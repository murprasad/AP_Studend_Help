export interface TutorSections {
  coreConceptMd: string;
  visualBreakdownMd: string;
  apExampleMd: string;
  commonTrapsMd: string;
  memoryHookMd: string;
  completedSections: Set<"core" | "visual" | "apExample" | "traps" | "hook">;
}

const SECTION_HEADINGS = [
  { key: "core" as const, marker: "## 🎯" },
  { key: "visual" as const, marker: "## 📊" },
  { key: "apExample" as const, marker: "## 📝" },
  { key: "traps" as const, marker: "## ⚠️" },
  { key: "hook" as const, marker: "## 💡" },
];

export function parseSections(rawText: string): TutorSections {
  // Strip FOLLOW_UPS block
  const text = rawText.replace(/\n?FOLLOW_UPS:[\s\S]*$/, "").trim();

  const sections: Record<string, string> = {};
  const completedSections = new Set<"core" | "visual" | "apExample" | "traps" | "hook">();

  // Find positions of each heading
  const positions: Array<{ key: string; start: number; markerEnd: number }> = [];
  for (const { key, marker } of SECTION_HEADINGS) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      // Find end of heading line
      const lineEnd = text.indexOf("\n", idx);
      positions.push({ key, start: idx, markerEnd: lineEnd === -1 ? text.length : lineEnd + 1 });
    }
  }

  // Sort by position
  positions.sort((a, b) => a.start - b.start);

  // Extract content between headings
  for (let i = 0; i < positions.length; i++) {
    const current = positions[i];
    const next = positions[i + 1];
    const contentEnd = next ? next.start : text.length;
    sections[current.key] = text.slice(current.markerEnd, contentEnd).trim();

    // A section is "completed" if the next heading has already appeared
    if (next) {
      completedSections.add(current.key as "core" | "visual" | "apExample" | "traps" | "hook");
    } else {
      // Last section found — completed if text ends (not mid-stream)
      // We consider the last seen section as complete only if it has content and
      // the full text doesn't end mid-sentence (ends with a period, newline, or bracket)
      const content = sections[current.key];
      if (content && /[.\]}\n]$/.test(content.trimEnd())) {
        completedSections.add(current.key as "core" | "visual" | "apExample" | "traps" | "hook");
      }
    }
  }

  return {
    coreConceptMd: sections["core"] ?? "",
    visualBreakdownMd: sections["visual"] ?? "",
    apExampleMd: sections["apExample"] ?? "",
    commonTrapsMd: sections["traps"] ?? "",
    memoryHookMd: sections["hook"] ?? "",
    completedSections,
  };
}
