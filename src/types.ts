export type Block =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "kv"; items: { k: string; v: string }[] }
  | { type: "note"; tone: "info" | "ok" | "warn"; text: string };

export type Section = {
  id: string;
  title: string;
  icon: string;
  blocks: Block[];
};

export type CaseRecord = {
  id: string;
  kind: string;
  description: string;
  court: string;
  courtDate: string;
  articles: string;
  status: "Анализ готов" | "Распознавание" | "Черновик";
  createdAt: string;
  uid: string;
  words: number;
  sections: Section[];
  source: {
    caption: string[];
    paragraphs: string[];
  };
};

/** Разметка исходного документа:
 *  `^` — мелкий служебный текст;  `#` — заголовок по центру;
 *  `|` — строка по центру;  `>` — строка справа;  остальные — абзац с отступом */
export type DocLine = { t: "cap" | "head" | "center" | "right" | "p"; text: string };

export function parseDoc(lines: string[]): DocLine[] {
  return lines.map((raw) => {
    if (raw.startsWith("^")) return { t: "cap", text: raw.slice(1).trim() } as DocLine;
    if (raw.startsWith("#")) return { t: "head", text: raw.slice(1).trim() } as DocLine;
    if (raw.startsWith("|")) return { t: "center", text: raw.slice(1).trim() } as DocLine;
    if (raw.startsWith(">")) return { t: "right", text: raw.slice(1).trim() } as DocLine;
    return { t: "p", text: raw.trim() } as DocLine;
  });
}
