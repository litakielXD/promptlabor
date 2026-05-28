// Hilfsfunktionen für das gesamte Projekt

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c))
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const AI_MODELS = {
  ALLROUND: {
    label: "Allround",
    color: "#7c3aed",
    bgColor: "rgba(124, 58, 237, 0.15)",
    icon: "◎",
    shortLabel: "ALL",
  },
  CHATGPT: {
    label: "ChatGPT",
    color: "#10A37F",
    bgColor: "rgba(16, 163, 127, 0.15)",
    icon: "✦",
    shortLabel: "GPT",
  },
  CLAUDE: {
    label: "Claude",
    color: "#D97757",
    bgColor: "rgba(217, 119, 87, 0.15)",
    icon: "◆",
    shortLabel: "CLD",
  },
  GEMINI: {
    label: "Gemini",
    color: "#4285F4",
    bgColor: "rgba(66, 133, 244, 0.15)",
    icon: "✸",
    shortLabel: "GEM",
  },
  NOTEBOOKLM: {
    label: "NotebookLM",
    color: "#9C27B0",
    bgColor: "rgba(156, 39, 176, 0.15)",
    icon: "☰",
    shortLabel: "NLM",
  },
} as const;

export type ModelKey = keyof typeof AI_MODELS;

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `Vor ${minutes} Min.`;
  if (hours < 24) return `Vor ${hours} Std.`;
  if (days < 7) return `Vor ${days} Tag${days > 1 ? "en" : ""}`;
  return formatDate(date);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "…";
}

export function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}
