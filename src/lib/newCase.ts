import type { Block, CaseRecord, Section } from "@/types";

const today = () =>
  new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

export function paragraphsFromText(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n|\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const clean = line.replace(/^[•\-–]\s*/, "");
      if (clean.length < 60 && clean === clean.toUpperCase() && /[А-ЯA-Z]/.test(clean))
        return "#" + clean;
      return clean;
    });
}

const TEMPLATE = (no: string, court: string, date: string, text: string) => [
  "^Уг. дело №" + no + " (распознано ИИ, требуется сверка)",
  "^УИД — уточняется",
  "#П Р И Г О В О Р",
  "|Именем Российской Федерации",
  ">Мурманская область.",
  ">" + court + ", " + date + " года",
  text ||
    `${court} рассмотрел уголовное дело в отношении ФИО, обвиняемого в совершении преступления, предусмотренного ч. 1 ст. 158 УК РФ.\nВ судебном заседании установлено, что обвиняемый, имея умысел на тайное хищение чужого имущества, воспользовавшись отсутствием наблюдения, похитил имущество, причинив потерпевшему материальный ущерб.\nСуд квалифицирует действия по ч. 1 ст. 158 УК РФ. Смягчающими обстоятельствами признаны полное признание вины и возмещение ущерба.\nНа основании изложенного суд постановил признать подсудимого виновным и назначить наказание без изоляции от общества.`,
];

function sectionsFrom(text: string, kind: string): Section[] {
  const caps = text.match(/[А-ЯЁ][а-яё]+(?:ский|ская|ское) суд/g);
  const court = caps?.[0] ?? "суд не определён";
  const articles = Array.from(new Set(text.match(/ст\.\s?\d+(?:\.\d+)?\s?УК\s?РФ/g) ?? [])).slice(0, 5);
  const dates = Array.from(new Set(text.match(/\d{2}\.\d{2}\.\d{4}/g) ?? [])).slice(0, 6);

  const fabula: Block[] = [
    { type: "note", tone: "info", text: "Структурировано ИИ (черновик)" },
    { type: "h", text: "Тип акта" },
    { type: "p", text: `${kind}. Первичный разбор распознанного текста, требуется проверка судьёй.` },
    { type: "h", text: "Выявленный суд" },
    { type: "p", text: court },
    { type: "h", text: "Упомянутые нормы" },
    articles.length
      ? { type: "list", items: articles.map((a) => a.replace(/\s+/g, " ")) }
      : { type: "p", text: "Нормы УК РФ в тексте не распознаны — уточните вручную." },
    { type: "h", text: "Даты, упомянутые в документе" },
    dates.length
      ? { type: "list", items: dates }
      : { type: "p", text: "Даты не распознаны." },
    { type: "note", tone: "warn", text: "Проверьте реквизиты дела перед регистрацией в базе." },
  ];

  const generic = (title: string, note: string): Section => ({
    id: title,
    title,
    icon: "doc",
    blocks: [
      { type: "h", text: title },
      { type: "p", text: "Раздел подготовлен автоматически и требует наполнения." },
      { type: "note", tone: "info", text: note },
    ],
  });

  return [
    { id: "fabula", title: "Фабула дела", icon: "doc", blocks: fabula },
    generic("Личность подсудимого", "Данные о личности не распознаны полностью."),
    generic("Отягчающие обстоятельства", "Проверьте ст. 63 УК РФ вручную."),
    generic("Смягчающие обстоятельства", "Проверьте ст. 61 УК РФ вручную."),
    generic("Альтернативные наказания", "Сверьте с санкцией вменённой статьи."),
    generic("Основания освобождения", "Проверьте ст. 75–78, 76.2 УК РФ."),
    generic("Сроки давности", "Проверьте ст. 78 УК РФ."),
    generic("Материалы дела", "Опись томов не распознана."),
    generic("Судебная практика", "Подборка формируется по вменённым нормам."),
  ];
}

export function buildCase(opts: {
  number: string;
  kind: string;
  court: string;
  date: string;
  text: string;
  sourceName: string;
}): CaseRecord {
  const paragraphs = TEMPLATE(opts.number, opts.court, opts.date, opts.text);
  const flat = paragraphs.join("\n");
  return {
    id: opts.number,
    kind: opts.kind,
    description: `Уголовное дело — распознано из файла «${opts.sourceName}».`,
    court: opts.court,
    courtDate: `Документ от ${opts.date}`,
    articles: "Требует уточнения",
    status: "Черновик",
    createdAt: new Date().toISOString().slice(0, 10),
    uid: "—",
    words: flat.split(/\s+/).length,
    sections: sectionsFrom(flat, opts.kind),
    source: {
      caption: paragraphs.filter((p) => p.startsWith("^")).map((p) => p.slice(1)),
      paragraphs: paragraphs.filter((p) => !p.startsWith("^")),
    },
  };
}

export const newCaseStamp = today;
