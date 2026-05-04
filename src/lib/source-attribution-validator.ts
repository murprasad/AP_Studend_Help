/**
 * src/lib/source-attribution-validator.ts — deterministic gate that
 * catches fake/hallucinated citations in question stimuli and
 * explanations.
 *
 * Failure modes caught:
 *
 * 1. Fake-author tells
 *    Generators love to invent plausible-but-fake names: "John Smith,
 *    1862", "Maria Gonzales, 1789". CB always cites real, identifiable
 *    historical figures or named documents. We flag if the cited name
 *    matches a "first-name + last-name + year" pattern with no
 *    distinguishing feature (no title, no role, no specific document).
 *
 * 2. Fake-document tells
 *    "From the Encyclopedia of Colonial America" — no such single
 *    work. CB cites SPECIFIC documents: "Stamp Act Resolves of 1765",
 *    "Federalist No. 10", "Plessy v. Ferguson (1896)". Generic
 *    "Encyclopedia of X" or "History of Y, 1850" is a tell.
 *
 * 3. Decade-or-century-precision tells
 *    "Quoted in a colonial pamphlet, 1700s" or "from a Roman text".
 *    CB always provides a specific year or narrow range
 *    (1765-1766 not "the 1700s").
 *
 * 4. Citation in explanation that doesn't appear in stimulus
 *    Generator says explanation cites "the Treaty of Paris" but the
 *    stimulus doesn't mention it. The student can't follow the
 *    reasoning.
 *
 * Pure function, <2ms per question, no LLM call. Deterministic gates
 * cannot replace the LLM judge for the hardest cases (real-but-misquoted
 * sources, real authors with wrong dates) — those go to JUDGE stage.
 *
 * The CB-anchored allowlist (real source titles + author names from CB
 * released exams + CED PDFs) is built at runtime from the corpus index;
 * for now we use a pattern-based fallback that catches the obvious tells.
 */

const DECADE_CENTURY_PATTERNS = [
  /\bthe\s+\d{4}s\b/i,                    // "the 1700s"
  /\b\d{1,2}(st|nd|rd|th)\s+century\b/i,  // "18th century"
  /\bsometime\s+in\s+the\b/i,             // "sometime in the..."
  /\bcirca\s+the\b/i,                     // "circa the early..."
  /\bduring\s+the\s+\d{4}s\b/i,           // "during the 1800s"
];

const GENERIC_DOCUMENT_PATTERNS = [
  /\bfrom\s+(an?\s+)?encyclopedia\b/i,
  /\bin\s+(an?\s+)?colonial\s+(pamphlet|document|book|text)\b/i,
  /\bfrom\s+a\s+(Roman|Greek|Egyptian|Chinese|Indian)\s+(text|document|book)\b/i,
  /\bin\s+a\s+(historical|primary|secondary)\s+(source|document|text)\b/i,
  /\bin\s+(an?\s+)?(letter|essay|book)\s+from\s+the\s+(period|era|time)\b/i,
];

const FAKE_NAME_PATTERN =
  // First Last, YEAR — with no title, role, or context. CB rarely cites
  // a person without role ("President Lincoln", "Mary Wollstonecraft,
  // English philosopher", etc.)
  /\b([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(\d{4})\b/g;

// Real CB-cited authors (small allowlist seeded from CED audit; expanded
// from RAG corpus at runtime). This is intentionally conservative —
// anything not on the list isn't auto-rejected, just not auto-approved
// for the bare-name pattern.
const KNOWN_CB_AUTHORS = new Set([
  // US History
  "Thomas Jefferson", "John Adams", "Abraham Lincoln", "Frederick Douglass",
  "George Washington", "Alexander Hamilton", "James Madison", "Andrew Jackson",
  "Theodore Roosevelt", "Franklin Roosevelt", "Martin Luther King",
  "Susan B. Anthony", "Elizabeth Cady Stanton", "Booker T. Washington",
  "W.E.B. Du Bois", "Jane Addams", "Ida B. Wells", "Eugene Debs",
  // World History
  "Mansa Musa", "Ibn Battuta", "Marco Polo", "Genghis Khan", "Suleiman",
  "Akbar", "Mahatma Gandhi", "Nelson Mandela", "Karl Marx", "Adam Smith",
  // Common attribution forms in CB exams
  "Stamp Act Congress", "Continental Congress", "Stamp Act", "Declaration of Independence",
  "Federalist", "Anti-Federalist", "Articles of Confederation",
]);

const KNOWN_CB_DOCUMENTS = [
  /\bDeclaration\s+of\s+Independence\b/i,
  /\bFederalist\s+No\.\s+\d+\b/i,
  /\bArticles\s+of\s+Confederation\b/i,
  /\bConstitution\s+of\s+the\s+United\s+States\b/i,
  /\bBill\s+of\s+Rights\b/i,
  /\bGettysburg\s+Address\b/i,
  /\bEmancipation\s+Proclamation\b/i,
  /\bMonroe\s+Doctrine\b/i,
  /\bMarbury\s+v\.\s+Madison\b/i,
  /\bPlessy\s+v\.\s+Ferguson\b/i,
  /\bBrown\s+v\.\s+Board\b/i,
  /\bStamp\s+Act\b/i,
  /\bMagna\s+Carta\b/i,
  /\bUniversal\s+Declaration\s+of\s+Human\s+Rights\b/i,
  /\bTreaty\s+of\s+Versailles\b/i,
  /\bTreaty\s+of\s+Paris\b/i,
  /\bTreaty\s+of\s+Tordesillas\b/i,
  /\bTreaty\s+of\s+Westphalia\b/i,
  /\bCommunist\s+Manifesto\b/i,
  /\bWealth\s+of\s+Nations\b/i,
];

/**
 * Find decade- or century-level imprecision.
 */
function findImpreciseTimeAttribution(text: string): string | null {
  for (const re of DECADE_CENTURY_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * Find generic document attribution (no specific title).
 */
function findGenericDocument(text: string): string | null {
  for (const re of GENERIC_DOCUMENT_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * Look at "First Last, YYYY" patterns; flag if the name isn't a known
 * CB author AND no role/title is given. Returns the suspicious string
 * or null.
 */
function findUnknownAuthorAttribution(text: string): string | null {
  // Reset regex state for repeated calls (shared global regex).
  FAKE_NAME_PATTERN.lastIndex = 0;
  const matches = Array.from(text.matchAll(FAKE_NAME_PATTERN));
  for (const m of matches) {
    const name = m[1];
    const year = m[2];
    if (KNOWN_CB_AUTHORS.has(name)) continue;
    // Look for a role/title within 30 chars before the name — signals
    // legitimacy: "President Lincoln, 1865", "Justice Marshall, 1819".
    const start = Math.max(0, (m.index ?? 0) - 40);
    const before = text.slice(start, m.index);
    const hasRole = /\b(President|Justice|Senator|Representative|Governor|King|Queen|Emperor|Sultan|Caliph|Reverend|Dr\.|Professor|General|Captain|Lord|Lady|Mr\.|Mrs\.|Ms\.|philosopher|scientist|historian|economist|abolitionist|suffragist|writer|author|leader)\s*$/i.test(
      before,
    );
    if (!hasRole) {
      return `${name}, ${year}`;
    }
  }
  return null;
}

/**
 * Validate a stimulus's attribution. Returns null on pass, error
 * string on fail.
 */
export function validateStimulusAttribution(stimulus: string | null | undefined): string | null {
  const s = (stimulus ?? "").trim();
  if (s.length === 0) return null; // empty stimulus is handled by stimulus-validator, not here

  const imprecise = findImpreciseTimeAttribution(s);
  if (imprecise) {
    return `Imprecise time attribution: "${imprecise}". CB cites specific years (e.g. "1765", not "the 1700s").`;
  }

  const generic = findGenericDocument(s);
  if (generic) {
    return `Generic document attribution: "${generic}". CB cites SPECIFIC documents by name (e.g. "Federalist No. 10", "Plessy v. Ferguson"), not "from an encyclopedia".`;
  }

  const fakeAuthor = findUnknownAuthorAttribution(s);
  if (fakeAuthor) {
    return `Possibly fabricated author attribution: "${fakeAuthor}". Either provide a role/title (e.g. "President", "abolitionist") or the name must match a known CB-cited figure. Verify the name is real.`;
  }

  return null;
}

/**
 * Validate that any document/source named in the EXPLANATION also
 * appears (or has a clear referent) in the STIMULUS. Otherwise the
 * student can't follow the reasoning.
 */
export function validateExplanationCitesStimulus(
  stimulus: string | null | undefined,
  explanation: string | null | undefined,
): string | null {
  const s = (stimulus ?? "").trim().toLowerCase();
  const e = (explanation ?? "").trim();
  if (!e || !s) return null;

  // Find named documents in the explanation that we'd expect to also
  // appear in the stimulus.
  for (const re of KNOWN_CB_DOCUMENTS) {
    const m = e.match(re);
    if (!m) continue;
    const docName = m[0].toLowerCase();
    if (!s.includes(docName)) {
      return `Explanation cites "${m[0]}" but the stimulus doesn't reference it — student cannot follow the reasoning.`;
    }
  }
  return null;
}

/**
 * Combined entry point.
 */
export function validateAttribution(
  stimulus: string | null | undefined,
  explanation: string | null | undefined,
): string | null {
  return (
    validateStimulusAttribution(stimulus) ??
    validateExplanationCitesStimulus(stimulus, explanation)
  );
}
