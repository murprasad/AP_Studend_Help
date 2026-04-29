/**
 * frq-types.ts
 *
 * Typed rubric shapes for every AP FRQ type. The Prisma column `rubric` is
 * still `Json` — this file is the single source of truth for what lives inside
 * that JSON and how the UI should render it.
 *
 * Each rubric variant is a discriminated union keyed on `type`, which mirrors
 * the Prisma `FrqType` enum exactly.
 */
export type FrqType =
  | "SHORT"
  | "LONG"
  | "MULTI_PART"
  | "INVESTIGATIVE"
  | "SAQ"
  | "DBQ"
  | "LEQ"
  | "AAQ"
  | "EBQ";

/* ── Shared primitives ─────────────────────────────────────────────────── */

/** A single "part" of a multi-part FRQ (a, b, c, ...). */
export interface RubricPart {
  label: string;
  points: number;
  criterion: string;
  keywords?: string[];
}

/** SAQ sub-parts are always exactly A / B / C per College Board convention. */
export interface SaqSubPart {
  label: "A" | "B" | "C";
  points: number;
  criterion: string;
}

/** One document shown in a DBQ stimulus pane. */
export interface DbqDocument {
  id: string;             // e.g. "Doc 1" or "A"
  sourceCitation: string; // author / year / publication
  excerpt: string;        // short primary source text
}

/** DBQ rubric sections per the 7-point CollegeBoard scoring guide. */
export interface DbqSections {
  thesis: { points: number; criterion: string };
  context: { points: number; criterion: string };
  evidenceFromDocs: { points: number; criterion: string; minDocs: number };
  evidenceBeyondDocs: { points: number; criterion: string };
  hipp: { points: number; criterion: string; minDocsAnalyzed: number };
  complexity: { points: number; criterion: string };
}

/** LEQ rubric sections per the 6-point CollegeBoard scoring guide. */
export interface LeqSections {
  thesis: { points: number; criterion: string };
  context: { points: number; criterion: string };
  evidence: { points: number; criterion: string };
  reasoning: { points: number; criterion: string };
  complexity: { points: number; criterion: string };
}

/** Meta shown at the top of an AAQ (article analysis). */
export interface AaqArticleMeta {
  title?: string;
  methodology?: string;
  participants?: string;
}

/** A single excerpt card in an EBQ. */
export interface EbqExcerpt {
  id: string;
  excerpt: string;
  source?: string;
}

/* ── Discriminated union of all rubric variants ─────────────────────────── */

/** Physics / Chem short or long FRQ. Also covers MULTI_PART (Calc/Bio/Chem). */
export interface MultiPartRubric {
  type: "SHORT" | "LONG" | "MULTI_PART";
  parts: RubricPart[];
  totalPoints: number;
}

/** AP Stats Q6 — multi-part plus a dataset/notes display. */
export interface InvestigativeRubric {
  type: "INVESTIGATIVE";
  parts: RubricPart[];
  datasetNotes?: string;
  totalPoints: number;
}

/** AP History short-answer question (APUSH / World / Euro). */
export interface SaqRubric {
  type: "SAQ";
  subParts: SaqSubPart[];
  totalPoints: number;
}

/** AP History document-based question. Canonically 7 points. */
export interface DbqRubric {
  type: "DBQ";
  sections: DbqSections;
  documents: DbqDocument[];
  totalPoints: 7;
}

/** AP History long essay question. Canonically 6 points. */
export interface LeqRubric {
  type: "LEQ";
  sections: LeqSections;
  totalPoints: 6;
}

/** AP Psych article-analysis question. */
export interface AaqRubric {
  type: "AAQ";
  articleMeta: AaqArticleMeta;
  parts: RubricPart[];
  totalPoints: number;
}

/** AP Psych evidence-based question (up to 3 excerpts). */
export interface EbqRubric {
  type: "EBQ";
  excerpts: EbqExcerpt[];
  parts: RubricPart[];
  totalPoints: number;
}

export type FrqRubric =
  | MultiPartRubric
  | InvestigativeRubric
  | SaqRubric
  | DbqRubric
  | LeqRubric
  | AaqRubric
  | EbqRubric;

/* ── Defensive parser ──────────────────────────────────────────────────── */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function parsePart(p: unknown): RubricPart {
  const o = isObj(p) ? p : {};
  return {
    label: str(o.label, str(o.step, "")),
    points: num(o.points, 0),
    // accept either `criterion` or legacy `step` from old seeds
    criterion: str(o.criterion, str(o.step, "")),
    keywords: arr<string>(o.keywords).filter((k) => typeof k === "string"),
  };
}

function parseSaqSubPart(p: unknown, fallbackIdx = 0): SaqSubPart {
  const o = isObj(p) ? p : {};
  // Beta 9.0.6 fix — DB rubric stores `step` as the FULL CRITERION TEXT
  // (e.g. "Identify ONE specific historical example..."), not a single
  // letter. So we must use index-based fallback for the label, and use
  // `step`/`criterion` as the criterion text. Beta 9.0.5 incorrectly used
  // `step` as a label fallback, collapsing all 3 parts to label="A".
  const explicitLabel = str(o.label, "");
  const safeLabel: "A" | "B" | "C" =
    explicitLabel === "A" || explicitLabel === "B" || explicitLabel === "C"
      ? (explicitLabel as "A" | "B" | "C")
      : ((["A", "B", "C"][fallbackIdx] as "A" | "B" | "C") ?? "A");
  // For criterion: prefer explicit criterion, then step text (if it's
  // descriptive — i.e. NOT a single letter), then keywords joined.
  const keywordsStr = Array.isArray(o.keywords) ? (o.keywords as unknown[]).filter(k => typeof k === "string").join(", ") : "";
  const stepText = str(o.step, "");
  const stepIsDescriptive = stepText.length > 1; // "A" → false, "Thesis" → true
  const criterion = str(o.criterion, "") || (stepIsDescriptive ? stepText : "") || keywordsStr;
  return {
    label: safeLabel,
    points: num(o.points, 1),
    criterion,
  };
}

function parseSection(
  v: unknown
): { points: number; criterion: string } {
  const o = isObj(v) ? v : {};
  return { points: num(o.points, 0), criterion: str(o.criterion, "") };
}

/**
 * Legacy shape from the original Physics seed was a bare array of
 * `{step, points, keywords, note}` with no `type` field. We coerce that into
 * the new `MultiPartRubric` shape when the requested `type` is SHORT / LONG /
 * MULTI_PART so the 10 existing Physics rows render under the new dispatcher
 * without a DB migration.
 */
function coerceLegacyArray(
  json: unknown,
  type: "SHORT" | "LONG" | "MULTI_PART"
): MultiPartRubric | null {
  if (!Array.isArray(json)) return null;
  const parts = json.map(parsePart);
  const totalPoints = parts.reduce((acc, p) => acc + p.points, 0);
  return { type, parts, totalPoints };
}

/**
 * Parse and validate a rubric JSON blob.
 *
 * If the JSON shape doesn't match the expected variant for `type`, we return
 * a safe fallback (`{ type, parts: [], totalPoints: 0 }` or an equivalent
 * empty skeleton) and `console.warn` so the UI never crashes.
 */
export function parseRubric(json: unknown, type: FrqType): FrqRubric {
  const warn = (reason: string) =>
    // eslint-disable-next-line no-console
    console.warn(`[parseRubric] ${type}: ${reason}; using empty fallback`);

  // Physics legacy rows: bare array, no `type` field. Accept for SHORT/LONG/MULTI_PART.
  if (
    (type === "SHORT" || type === "LONG" || type === "MULTI_PART") &&
    Array.isArray(json)
  ) {
    const coerced = coerceLegacyArray(json, type);
    if (coerced) return coerced;
  }

  // Beta 9.0.7 fix — SAQ/DBQ/LEQ rubrics are stored as flat arrays in DB
  // (e.g. SAQ: [{step:'A',points,keywords},...]). The top-level isObj
  // guard below rejected ALL arrays, falling through to empty fallback.
  // Allow arrays through here; per-type case statements handle them.
  if (!isObj(json) && !Array.isArray(json)) {
    warn("rubric JSON is not an object or array");
    return emptyFallback(type);
  }

  switch (type) {
    case "SHORT":
    case "LONG":
    case "MULTI_PART": {
      // These cases require object form — if we got here with an array,
      // bail to empty fallback (legacy array handling already happened above).
      if (Array.isArray(json)) {
        warn("array rubric for SHORT/LONG/MULTI_PART; using empty fallback");
        return emptyFallback(type);
      }
      const parts = arr(json.parts).map(parsePart);
      if (parts.length === 0) {
        warn("no `parts` in rubric");
      }
      return {
        type,
        parts,
        totalPoints: num(
          json.totalPoints,
          parts.reduce((a, p) => a + p.points, 0)
        ),
      };
    }

    case "INVESTIGATIVE": {
      if (Array.isArray(json)) {
        warn("array rubric for INVESTIGATIVE; using empty fallback");
        return emptyFallback(type);
      }
      const parts = arr(json.parts).map(parsePart);
      return {
        type: "INVESTIGATIVE",
        parts,
        datasetNotes:
          typeof json.datasetNotes === "string" ? json.datasetNotes : undefined,
        totalPoints: num(
          json.totalPoints,
          parts.reduce((a, p) => a + p.points, 0)
        ),
      };
    }

    case "SAQ": {
      // Beta 9.0.5 fix — accept BOTH wrapped form `{subParts: [...]}` AND
      // flat array `[{step, points, keywords}, ...]` (the actual ingested
      // shape). Without this, the flat-array form parsed to empty subParts,
      // SaqInput fell back to a hardcoded A/B/C scaffold (so user could
      // type), but SaqReveal then had empty rubric.subParts → reveal echo
      // showed "(no answer recorded)" despite DB having content.
      const rawArray = Array.isArray(json) ? json : arr(json.subParts);
      const subParts = rawArray.map((item, idx) => parseSaqSubPart(item, idx));
      return {
        type: "SAQ",
        subParts,
        totalPoints: num(
          (json as { totalPoints?: unknown }).totalPoints,
          subParts.reduce((a, p) => a + p.points, 0)
        ),
      };
    }

    case "DBQ": {
      // Beta 9.0.7 — array form not yet mapped; pass through with empty
      // sections (essay echo still works in DbqReveal). Followup #38.
      if (Array.isArray(json)) {
        return { type: "DBQ", sections: { thesis: parseSection(undefined), context: parseSection(undefined), evidenceFromDocs: { ...parseSection(undefined), minDocs: 3 }, evidenceBeyondDocs: parseSection(undefined), hipp: { ...parseSection(undefined), minDocsAnalyzed: 2 }, complexity: parseSection(undefined) }, documents: [], totalPoints: 7 };
      }
      const s = isObj(json.sections) ? json.sections : {};
      const evDocs = isObj(s.evidenceFromDocs) ? s.evidenceFromDocs : {};
      const hipp = isObj(s.hipp) ? s.hipp : {};
      const sections: DbqSections = {
        thesis: parseSection(s.thesis),
        context: parseSection(s.context),
        evidenceFromDocs: {
          ...parseSection(s.evidenceFromDocs),
          minDocs: num(evDocs.minDocs, 3),
        },
        evidenceBeyondDocs: parseSection(s.evidenceBeyondDocs),
        hipp: {
          ...parseSection(s.hipp),
          minDocsAnalyzed: num(hipp.minDocsAnalyzed, 2),
        },
        complexity: parseSection(s.complexity),
      };
      const documents = arr<unknown>(json.documents).map((d) => {
        const o = isObj(d) ? d : {};
        return {
          id: str(o.id, ""),
          sourceCitation: str(o.sourceCitation, ""),
          excerpt: str(o.excerpt, ""),
        };
      });
      return { type: "DBQ", sections, documents, totalPoints: 7 };
    }

    case "LEQ": {
      if (Array.isArray(json)) {
        return { type: "LEQ", sections: { thesis: parseSection(undefined), context: parseSection(undefined), evidence: parseSection(undefined), reasoning: parseSection(undefined), complexity: parseSection(undefined) }, totalPoints: 6 };
      }
      const s = isObj(json.sections) ? json.sections : {};
      const sections: LeqSections = {
        thesis: parseSection(s.thesis),
        context: parseSection(s.context),
        evidence: parseSection(s.evidence),
        reasoning: parseSection(s.reasoning),
        complexity: parseSection(s.complexity),
      };
      return { type: "LEQ", sections, totalPoints: 6 };
    }

    case "AAQ": {
      if (Array.isArray(json)) return emptyFallback("AAQ");
      const meta = isObj(json.articleMeta) ? json.articleMeta : {};
      const parts = arr(json.parts).map(parsePart);
      return {
        type: "AAQ",
        articleMeta: {
          title: typeof meta.title === "string" ? meta.title : undefined,
          methodology:
            typeof meta.methodology === "string" ? meta.methodology : undefined,
          participants:
            typeof meta.participants === "string" ? meta.participants : undefined,
        },
        parts,
        totalPoints: num(
          json.totalPoints,
          parts.reduce((a, p) => a + p.points, 0)
        ),
      };
    }

    case "EBQ": {
      if (Array.isArray(json)) return emptyFallback("EBQ");
      const excerpts = arr<unknown>(json.excerpts).map((e) => {
        const o = isObj(e) ? e : {};
        return {
          id: str(o.id, ""),
          excerpt: str(o.excerpt, ""),
          source: typeof o.source === "string" ? o.source : undefined,
        };
      });
      const parts = arr(json.parts).map(parsePart);
      return {
        type: "EBQ",
        excerpts,
        parts,
        totalPoints: num(
          json.totalPoints,
          parts.reduce((a, p) => a + p.points, 0)
        ),
      };
    }
  }
}

/** Empty skeleton returned when parsing fails — guaranteed to render. */
function emptyFallback(type: FrqType): FrqRubric {
  switch (type) {
    case "SHORT":
    case "LONG":
    case "MULTI_PART":
      return { type, parts: [], totalPoints: 0 };
    case "INVESTIGATIVE":
      return { type: "INVESTIGATIVE", parts: [], totalPoints: 0 };
    case "SAQ":
      return { type: "SAQ", subParts: [], totalPoints: 0 };
    case "DBQ":
      return {
        type: "DBQ",
        sections: {
          thesis: { points: 0, criterion: "" },
          context: { points: 0, criterion: "" },
          evidenceFromDocs: { points: 0, criterion: "", minDocs: 3 },
          evidenceBeyondDocs: { points: 0, criterion: "" },
          hipp: { points: 0, criterion: "", minDocsAnalyzed: 2 },
          complexity: { points: 0, criterion: "" },
        },
        documents: [],
        totalPoints: 7,
      };
    case "LEQ":
      return {
        type: "LEQ",
        sections: {
          thesis: { points: 0, criterion: "" },
          context: { points: 0, criterion: "" },
          evidence: { points: 0, criterion: "" },
          reasoning: { points: 0, criterion: "" },
          complexity: { points: 0, criterion: "" },
        },
        totalPoints: 6,
      };
    case "AAQ":
      return { type: "AAQ", articleMeta: {}, parts: [], totalPoints: 0 };
    case "EBQ":
      return { type: "EBQ", excerpts: [], parts: [], totalPoints: 0 };
  }
}

/* ── UI helpers ────────────────────────────────────────────────────────── */

/**
 * Every input component collects answers as a `Record<string, string>` keyed
 * by the rubric part/section label. The submit API keeps the same
 * `studentText` column but now stores a JSON-stringified record.
 *
 * Inputs join answers into a readable preview string so list views and
 * reveal screens can fall back to a plain render even if the keyed map is
 * missing some entries.
 */
export function joinAnswersToText(answers: Record<string, string>): string {
  return Object.entries(answers)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `(${k}) ${v.trim()}`)
    .join("\n\n");
}

/**
 * Inverse of `joinAnswersToText` — best-effort parse used when a reveal
 * component loads a legacy submission. We never block reveal on this; if
 * parsing fails we just show the raw text as a single blob.
 */
export function parseAnswersFromStored(
  raw: string
): { structured: Record<string, string> | null; fallback: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { structured: null, fallback: "" };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isObj(parsed)) {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string") out[k] = v;
        }
        return { structured: out, fallback: trimmed };
      }
    } catch {
      /* fall through */
    }
  }
  return { structured: null, fallback: trimmed };
}
