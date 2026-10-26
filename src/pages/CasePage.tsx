import { Fragment, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  ArrowLeft,
  CheckIcon,
  CopyIcon,
  DocTextIcon,
  DownloadIcon,
  InfoIcon,
  LockIcon,
  PlusCircleIcon,
  SearchIcon,
  SectionIcon,
  SparklesIcon,
  XIcon,
} from "@/components/icons";
import {
  getInteractiveAnalysisConfig,
  type InteractiveAnalysisConfig,
  type InteractiveAnalysisItem,
  type InteractiveKind,
} from "@/data/analysisTools";
import { ScrollArea } from "@/components/Scroller";
import { parseDoc, type Block, type CaseRecord } from "@/types";
import { cn } from "@/utils/cn";

/* --------------------------- отрисовка блоков анализа --------------------------- */

const STOP_WORDS = new Set([
  "также", "который", "которая", "которые", "предусмотренный", "предусмотренных",
  "совершение", "совершении", "преступление", "преступлений", "указано", "судом",
  "дела", "данные", "отношении", "является", "признано", "признаны", "составляет",
  "размере", "рублей", "части",
]);

const SECTION_HINTS: Record<string, string[]> = {
  fabula: ["установил", "хищен", "краж", "обвиняем"],
  person: ["личност", "здоров", "несовершеннолет", "подсудим"],
  aggravating: ["отягча", "административн", "рецидив"],
  mitigating: ["смягча", "возмещен", "раская", "повинн"],
  alternatives: ["наказан", "обязательн", "лишени", "штраф"],
  release: ["освобожд", "применен", "пресечен", "вступлен"],
  limitation: ["срок", "давност", "период"],
  materials: ["материал", "доказательств", "документ"],
  practice: ["квалифиц", "статья", "приговор"],
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[«»„“”<>#|^—–.,:;!?()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(word: string) {
  if (/^фио\d+$/i.test(word) || /\d/.test(word) || word.length < 6) return word;
  return word.replace(
    /(иями|ями|ами|ого|его|ому|ему|ыми|ими|иях|ах|ях|остью|ение|ения|енный|анных|ная|ное|ные|ой|ый|ий|ая|ов|ев|ам|ям|ом|ем|у|ю|а|я|ы|и|е|о)$/,
    "",
  );
}

function tokens(value: string) {
  return Array.from(
    new Set(
      normalize(value)
        .split(" ")
        .filter((word) => word.length >= 4 && !STOP_WORDS.has(word))
        .map(stem),
    ),
  );
}

/** Находит первоисточник по датам, суммам, статьям и ключевым словам. */
function findSourceMatches(query: string, sectionId: string, source: string[]) {
  const queryNormalized = normalize(query);
  const queryTokens = tokens(query);
  const dates = queryNormalized.match(/\d{2}\.\d{2}\.\d{4}/g) ?? [];
  const numbers = (queryNormalized.match(/\d[\d\s]*\d|\d+/g) ?? [])
    .map((number) => number.replace(/\s/g, ""))
    .filter((number) => number.length >= 3);
  const hints = SECTION_HINTS[sectionId] ?? [];

  const ranked = source.map((raw, index) => {
    const normalized = normalize(raw);
    const sourceTokens = new Set(tokens(raw));
    let score = 0;

    for (const token of queryTokens) {
      if (sourceTokens.has(token)) score += token.length >= 8 ? 3 : 1.8;
    }
    for (const date of dates) {
      if (normalized.includes(date)) score += 24;
    }
    for (const number of numbers) {
      if (normalized.replace(/\s/g, "").includes(number)) score += 7;
    }
    for (const hint of hints) {
      if (normalized.includes(hint)) score += 1.4;
    }
    if (queryNormalized.length > 18 && normalized.includes(queryNormalized)) score += 40;
    return { index, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best) return [];
  if (best.score < 2) {
    const fallback = source.findIndex((raw) =>
      hints.some((hint) => normalize(raw).includes(hint)),
    );
    return fallback >= 0 ? [fallback] : [0];
  }
  return ranked
    .filter((item) => item.score >= Math.max(4, best.score * 0.72))
    .slice(0, 2)
    .map((item) => item.index);
}

function findAnchorIndex(terms: string[], source: string[], fallback = 0) {
  const normalizedTerms = terms.map(normalize).filter(Boolean);
  const index = source.findIndex((line) => {
    const normalized = normalize(line);
    return normalizedTerms.some((term) => normalized.includes(term));
  });
  return index >= 0 ? index : fallback;
}

const INTERACTIVE_TONES: Record<
  InteractiveKind,
  {
    iconBox: string;
    softPanel: string;
    selectedCard: string;
    badge: string;
    addedBadge: string;
    primaryButton: string;
    selectedButton: string;
    note: string;
    sourceHighlight: string;
    mark: string;
    inserted: string;
  }
> = {
  mitigating: {
    mark: "bg-emerald-300/80 text-emerald-950 shadow-[0_0_0_2px_rgba(110,231,183,0.9)] dark:bg-emerald-400/45 dark:text-emerald-50 dark:shadow-[0_0_0_2px_rgba(52,211,153,0.35)]",
    inserted: "border-emerald-500 bg-emerald-100 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-100",
    iconBox: "bg-emerald-600 text-white",
    softPanel: "border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-500/15",
    selectedCard: "border-emerald-300 dark:border-emerald-500/50 bg-emerald-50/80",
    badge: "bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200",
    addedBadge: "bg-teal-100 dark:bg-teal-500/25 text-teal-800 dark:text-teal-200",
    primaryButton: "bg-emerald-600 text-white hover:bg-emerald-700",
    selectedButton: "bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200",
    note: "border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-100",
    sourceHighlight: "bg-emerald-100 dark:bg-emerald-500/25 text-slate-950 dark:text-white ring-emerald-300",
  },
  aggravating: {
    mark: "bg-rose-300/80 text-rose-950 shadow-[0_0_0_2px_rgba(253,164,175,0.9)] dark:bg-rose-400/45 dark:text-rose-50 dark:shadow-[0_0_0_2px_rgba(251,113,133,0.35)]",
    inserted: "border-rose-500 bg-rose-100 dark:bg-rose-500/25 text-rose-950 dark:text-rose-100",
    iconBox: "bg-rose-600 text-white",
    softPanel: "border-rose-200 dark:border-rose-500/40 bg-rose-50/60 dark:bg-rose-500/15",
    selectedCard: "border-rose-300 dark:border-rose-500/50 bg-rose-50/80",
    badge: "bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200",
    addedBadge: "bg-orange-100 dark:bg-orange-500/25 text-orange-800 dark:text-orange-200",
    primaryButton: "bg-rose-600 text-white hover:bg-rose-700",
    selectedButton: "bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 hover:bg-rose-200",
    note: "border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-500/15 text-rose-950 dark:text-rose-100",
    sourceHighlight: "bg-rose-100 dark:bg-rose-500/25 text-slate-950 dark:text-white ring-rose-300",
  },
  punishments: {
    mark: "bg-blue-300/80 text-blue-950 shadow-[0_0_0_2px_rgba(147,197,253,0.9)] dark:bg-blue-400/45 dark:text-blue-50 dark:shadow-[0_0_0_2px_rgba(96,165,250,0.35)]",
    inserted: "border-blue-500 bg-blue-100 dark:bg-blue-500/25 text-blue-950 dark:text-blue-100",
    iconBox: "bg-blue-600 text-white",
    softPanel: "border-blue-200 dark:border-blue-500/40 bg-blue-50/60",
    selectedCard: "border-blue-300 dark:border-blue-500/60 bg-blue-50/80 dark:bg-blue-500/15",
    badge: "bg-blue-100 dark:bg-blue-500/25 text-blue-800 dark:text-blue-200",
    addedBadge: "bg-cyan-100 dark:bg-cyan-500/25 text-cyan-800 dark:text-cyan-200",
    primaryButton: "bg-blue-600 text-white hover:bg-blue-700",
    selectedButton: "bg-blue-100 dark:bg-blue-500/25 text-blue-800 dark:text-blue-200 hover:bg-blue-200",
    note: "border-blue-300 dark:border-blue-500/60 bg-blue-50 dark:bg-blue-500/15 text-blue-950 dark:text-blue-100",
    sourceHighlight: "bg-blue-100 dark:bg-blue-500/25 text-slate-950 dark:text-white ring-blue-300 dark:ring-blue-500/50",
  },
};

const SECTION_BANNERS: Record<string, { box: string; icon: string; text: string }> = {
  fabula: { box: "border-blue-200 dark:border-blue-500/40 bg-blue-50/70 dark:bg-blue-500/15", icon: "bg-blue-600", text: "Краткая структурированная фабула. Нажмите на фрагмент — он выделится в приговоре." },
  person: { box: "border-violet-200 dark:border-violet-500/40 bg-violet-50/70 dark:bg-violet-500/15", icon: "bg-violet-600", text: "Сведения о подсудимом, подтверждённые материалами дела." },
  release: { box: "border-teal-200 dark:border-teal-500/40 bg-teal-50/70 dark:bg-teal-500/15", icon: "bg-teal-600", text: "Основания освобождения от ответственности и наказания, проверенные судом." },
  limitation: { box: "border-amber-200 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/15", icon: "bg-amber-600", text: "Расчёт сроков давности по ст. 78 УК РФ." },
  materials: { box: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900", icon: "bg-slate-600", text: "Опись томов и доказательств, использованных судом." },
  practice: { box: "border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-500/15", icon: "bg-indigo-600", text: "Разъяснения высших судов и сопоставимые дела региона." },
};

function SectionBanner({ id, icon, title }: { id: string; icon: string; title: string }) {
  const banner = SECTION_BANNERS[id];
  if (!banner) return null;
  return (
    <div className={cn("mb-4 flex items-center gap-3 rounded-2xl border p-3", banner.box)}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white", banner.icon)}>
        <SectionIcon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        <p className="text-[12.5px] leading-[1.4] text-slate-600 dark:text-slate-300">{banner.text}</p>
      </div>
    </div>
  );
}

const INSERT_LABEL: Record<InteractiveKind, string> = {
  mitigating: "Смягчающее",
  aggravating: "Отягчающее",
  punishments: "Альтернатива",
};

function insertedSentence(kind: InteractiveKind, item: InteractiveAnalysisItem) {
  const ref = item.reference ? ` (${item.reference})` : "";
  if (kind === "mitigating")
    return `Дополнительно в качестве смягчающего обстоятельства суд учитывает: ${item.label.charAt(0).toLocaleLowerCase("ru-RU")}${item.label.slice(1)}${ref}.`;
  if (kind === "aggravating")
    return `Дополнительно в качестве отягчающего обстоятельства суд учитывает: ${item.label.charAt(0).toLocaleLowerCase("ru-RU")}${item.label.slice(1)}${ref}.`;
  return `Рассмотрен альтернативный вид наказания — ${item.label.toLocaleLowerCase("ru-RU")}${item.detail ? `: ${item.detail}` : ""}`;
}

/** Выделяет в тексте все вхождения заданных фраз (без учёта регистра). */
function markPhrases(text: string, phrases: string[], markClass: string) {
  if (!phrases.length) return text;
  const lower = text.toLocaleLowerCase("ru-RU");
  const ranges: [number, number][] = [];
  for (const phrase of phrases) {
    const needle = phrase.toLocaleLowerCase("ru-RU");
    if (!needle) continue;
    let from = 0;
    for (;;) {
      const at = lower.indexOf(needle, from);
      if (at < 0) break;
      ranges.push([at, at + needle.length]);
      from = at + needle.length;
    }
  }
  if (!ranges.length) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const parts: (string | ReactElement)[] = [];
  let cursor = 0;
  merged.forEach(([start, end], index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={index} className={cn("rounded-[3px] px-[2px] [box-decoration-break:clone]", markClass)}>
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function InteractiveSection({
  config,
  presentItems,
  selectedAlternatives,
  selectedIds,
  addedIds,
  activeKey,
  onToggle,
  onLocate,
}: {
  config: InteractiveAnalysisConfig;
  presentItems: InteractiveAnalysisItem[];
  selectedAlternatives: InteractiveAnalysisItem[];
  selectedIds: Set<string>;
  addedIds: Set<string>;
  activeKey: string | null;
  onToggle: (item: InteractiveAnalysisItem) => void;
  onLocate: (text: string, key: string) => void;
}) {
  const [query, setQuery] = useState("");
  const tone = INTERACTIVE_TONES[config.kind];
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  const filteredItems = config.catalogItems.filter((item) =>
    normalizedQuery
      ? `${item.label} ${item.reference ?? ""} ${item.detail ?? ""}`
          .toLocaleLowerCase("ru-RU")
          .includes(normalizedQuery)
      : true,
  );
  const groups = Array.from(new Set(filteredItems.map((item) => item.group)));

  const itemStatus = (item: InteractiveAnalysisItem) => {
    if (config.kind === "punishments" && item.id === config.appliedCatalogId) return "applied";
    if (config.initialCatalogIds.includes(item.id)) return "verdict";
    if (addedIds.has(item.id)) return "added";
    return "available";
  };

  return (
    <div className="space-y-5">
      {config.kind === "punishments" && config.appliedPunishment ? (
        <>
          <section className={cn("rounded-2xl border p-4", tone.softPanel)}>
            <div className="flex flex-wrap items-start gap-3">
              <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tone.iconBox)}>
                <SectionIcon name="scales" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-70">
                  {config.presentTitle}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-50">
                    {config.appliedPunishment.label}
                  </h3>
                  <span className="text-[18px] font-semibold text-blue-700 dark:text-blue-300">
                    {config.appliedPunishment.value}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-[1.5] text-slate-600 dark:text-slate-300">
                  {config.appliedPunishment.detail}
                </p>
                <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">{config.appliedPunishment.reference}</p>
              </div>
              <span className={cn("rounded-lg px-2.5 py-1 text-[11.5px] font-semibold", tone.badge)}>
                По приговору
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                onLocate(
                  `${config.appliedPunishment?.label} ${config.appliedPunishment?.sourceQuery}`,
                  "applied-punishment",
                )
              }
              className={cn(
                "mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                tone.primaryButton,
                activeKey === "applied-punishment" && "ring-2 ring-slate-900/20",
              )}
            >
              <DocTextIcon className="h-4 w-4" />
              Показать в исходном документе
            </button>
          </section>

          {selectedAlternatives.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">Отмеченные альтернативы</h3>
                <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold", tone.addedBadge)}>
                  {selectedAlternatives.length}
                </span>
              </div>
              <div className="space-y-2">
                {selectedAlternatives.map((item) => (
                  <article
                    key={item.id}
                    className={cn("flex items-start gap-3 rounded-xl border p-3", tone.selectedCard)}
                  >
                    <button
                      type="button"
                      onClick={() => onLocate(`${item.label} ${item.sourceQuery}`, `selected-${item.id}`)}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <span className="block text-[14px] font-semibold text-slate-900 dark:text-slate-50">{item.label}</span>
                      {item.detail && (
                        <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-slate-600 dark:text-slate-300">{item.detail}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggle(item)}
                      title="Убрать альтернативу"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 transition hover:text-rose-600 dark:hover:text-rose-300"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-50">{config.presentTitle}</h3>
            <span className={cn("rounded-md px-2 py-0.5 text-[11.5px] font-semibold", tone.badge)}>
              {presentItems.length}
            </span>
          </div>
          <p className="-mt-1 mb-3 text-[12.5px] leading-[1.45] text-slate-500 dark:text-slate-400">{config.presentSubtitle}</p>
          <div className="space-y-2">
            {presentItems.map((item) => {
              const added = addedIds.has(item.id);
              const key = `present-${item.id}`;
              return (
                <article
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 transition",
                    activeKey === key && tone.selectedCard,
                  )}
                >
                  <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white", added ? "bg-teal-600" : tone.iconBox)}>
                    {added ? <PlusCircleIcon className="h-4 w-4" /> : <CheckIcon className="h-3.5 w-3.5" />}
                  </span>
                  <button
                    type="button"
                    onClick={() => onLocate(`${item.label} ${item.sourceQuery}`, key)}
                    className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <span className="block text-[14px] font-medium leading-[1.45] text-slate-800 dark:text-slate-100">{item.label}</span>
                    {item.reference && <span className="mt-0.5 block text-[11.5px] text-slate-500 dark:text-slate-400">{item.reference}</span>}
                    {item.detail && <span className="mt-0.5 block text-[12.5px] text-slate-600 dark:text-slate-300">{item.detail}</span>}
                  </button>
                  <span className={cn("shrink-0 rounded-md px-2 py-1 text-[10.5px] font-semibold", added ? tone.addedBadge : tone.badge)}>
                    {added ? "Добавлено" : "В приговоре"}
                  </span>
                  {added && (
                    <button
                      type="button"
                      onClick={() => onToggle(item)}
                      title="Убрать из выбранных"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 dark:text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-300"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900 dark:text-slate-50">{config.catalogTitle}</h3>
            <p className="mt-1 max-w-[560px] text-[12.5px] leading-[1.45] text-slate-500 dark:text-slate-400">{config.catalogSubtitle}</p>
          </div>
          <span className="text-[12px] text-slate-500 dark:text-slate-400">
            Выбрано: <strong className="text-slate-800 dark:text-slate-100">{selectedIds.size}</strong> из {config.catalogItems.length}
          </span>
        </div>

        <label className="relative mt-3 block">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по перечню"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-9 text-[13.5px] text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-500/25"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        {groups.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900 px-4 py-5 text-center text-[13px] text-slate-500 dark:text-slate-400">
            По запросу ничего не найдено.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group} className="mt-4">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{group}</h4>
              <div className="space-y-2">
                {filteredItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const status = itemStatus(item);
                    const selected = status === "added" || status === "verdict" || status === "applied";
                    const key = `catalog-${item.id}`;
                    return (
                      <article
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 transition",
                          selected && tone.selectedCard,
                          activeKey === key && "ring-2 ring-blue-300 dark:ring-blue-500/50",
                        )}
                      >
                        <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", selected ? cn("text-white", tone.iconBox) : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500")}>
                          {status === "applied" || status === "verdict" ? <CheckIcon className="h-3.5 w-3.5" /> : status === "added" ? <PlusCircleIcon className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                        </span>
                        <button
                          type="button"
                          onClick={() => onLocate(`${item.label} ${item.sourceQuery}`, key)}
                          className="min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          <span className="block text-[13.5px] font-medium leading-[1.45] text-slate-800 dark:text-slate-100">{item.label}</span>
                          {item.reference && <span className="mt-0.5 block text-[11.5px] font-medium text-slate-500 dark:text-slate-400">{item.reference}</span>}
                          {item.detail && <span className="mt-1 block text-[12.5px] leading-[1.45] text-slate-600 dark:text-slate-300">{item.detail}</span>}
                        </button>
                        {status === "verdict" ? (
                          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold", tone.badge)}>
                            <LockIcon className="h-3.5 w-3.5" />
                            В приговоре
                          </span>
                        ) : status === "applied" ? (
                          <span className={cn("shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold", tone.badge)}>
                            Применено
                          </span>
                        ) : status === "added" ? (
                          <button
                            type="button"
                            onClick={() => onToggle(item)}
                            className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition", tone.selectedButton)}
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Добавлено
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggle(item)}
                            className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition", tone.primaryButton)}
                          >
                            <PlusCircleIcon className="h-4 w-4" />
                            Добавить
                          </button>
                        )}
                      </article>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function SourceCue() {
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1 pl-2 text-[10.5px] font-medium text-blue-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
      <DocTextIcon className="h-3.5 w-3.5" />
      к документу
    </span>
  );
}

function Blocks({
  blocks,
  sectionId,
  activeKey,
  onLocate,
}: {
  blocks: Block[];
  sectionId: string;
  activeKey: string | null;
  onLocate: (text: string, key: string) => void;
}) {
  const activeClass = "bg-blue-50/80 dark:bg-blue-500/15 ring-1 ring-inset ring-blue-200 dark:ring-blue-500/40";

  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        const key = `${sectionId}-${i}`;
        if (b.type === "h")
          return (
            <button
              key={key}
              type="button"
              onClick={() => onLocate(b.text, key)}
              className={cn(
                "group flex w-full cursor-pointer items-center rounded-lg px-2 py-1 text-left text-[16px] font-semibold text-slate-900 dark:text-slate-50 transition hover:bg-blue-50/60 dark:hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                activeKey === key && activeClass,
              )}
            >
              <span>{b.text}</span>
              <SourceCue />
            </button>
          );
        if (b.type === "p")
          return (
            <button
              key={key}
              type="button"
              onClick={() => onLocate(b.text, key)}
              className={cn(
                "group flex w-full cursor-pointer items-start rounded-lg px-2 py-1.5 text-left text-[14px] leading-[1.62] text-slate-600 dark:text-slate-300 transition hover:bg-blue-50/60 dark:hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                activeKey === key && activeClass,
              )}
            >
              <span className="whitespace-pre-line">{b.text}</span>
              <SourceCue />
            </button>
          );
        if (b.type === "list")
          return (
            <ul key={key} className="space-y-1">
              {b.items.map((item, j) => (
                <li key={j}>
                  <button
                    type="button"
                    onClick={() => onLocate(item, `${key}-${j}`)}
                    className={cn(
                      "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-[14px] leading-[1.55] text-slate-600 dark:text-slate-300 transition hover:bg-blue-50/60 dark:hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                      activeKey === `${key}-${j}` && activeClass,
                    )}
                  >
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span>{item}</span>
                    <SourceCue />
                  </button>
                </li>
              ))}
            </ul>
          );
        if (b.type === "kv")
          return (
            <div key={key} className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              {b.items.map((item, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => onLocate(`${item.k}. ${item.v}`, `${key}-${j}`)}
                  className={cn(
                    "group flex w-full cursor-pointer flex-col gap-0.5 px-3.5 py-2.5 text-left transition hover:bg-blue-50/70 dark:hover:bg-blue-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 sm:flex-row sm:items-start sm:gap-4",
                    j % 2 ? "bg-slate-50/70 dark:bg-slate-800/50" : "bg-white dark:bg-slate-900",
                    activeKey === `${key}-${j}` && activeClass,
                  )}
                >
                  <span className="w-[42%] shrink-0 text-[12.5px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 sm:text-[11.5px]">
                    {item.k}
                  </span>
                  <span className="flex flex-1 items-start text-[13.5px] leading-[1.5] text-slate-700 dark:text-slate-200">
                    <span>{item.v}</span>
                    <SourceCue />
                  </span>
                </button>
              ))}
            </div>
          );
        const tone =
          b.tone === "ok"
            ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-emerald-200 dark:ring-emerald-500/40"
            : b.tone === "warn"
              ? "bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-100 ring-amber-200 dark:ring-amber-500/40"
              : "bg-blue-50/70 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200 ring-blue-200 dark:ring-blue-500/40";
        if (b.text === "Структурировано ИИ" || b.text.startsWith("Структурировано ИИ"))
          return (
            <span key={key} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-500/15 px-2.5 py-1 text-[12.5px] font-medium text-blue-700 dark:text-blue-300">
              <SparklesIcon className="h-3.5 w-3.5" />
              Структурировано ИИ
            </span>
          );
        return (
          <button
            key={key}
            type="button"
            onClick={() => onLocate(b.text, key)}
            className={cn(
              "group flex w-full cursor-pointer items-start rounded-xl px-3.5 py-2.5 text-left text-[13px] leading-[1.5] ring-1 transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
              tone,
              activeKey === key && "ring-2 ring-blue-400",
            )}
          >
            <span>{b.text}</span>
            <SourceCue />
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- страница дела ------------------------------- */

export function CasePage({
  record,
  onBack,
}: {
  record: CaseRecord;
  onBack: () => void;
}) {
  const [active, setActive] = useState(record.sections[0]?.id ?? "fabula");
  const [copied, setCopied] = useState(false);
  const [docSize, setDocSize] = useState(13);
  const [activeAnalysisKey, setActiveAnalysisKey] = useState<string | null>(null);
  const [highlightedSource, setHighlightedSource] = useState<number[]>([]);
  const [addedItems, setAddedItems] = useState<Record<string, string[]>>(() => {
    try {
      const raw = window.localStorage.getItem("solomon-added-analysis");
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  });
  const sourceLineRefs = useRef(new Map<number, HTMLElement>());
  const noteRefs = useRef(new Map<string, HTMLElement>());
  const [flashNote, setFlashNote] = useState<string | null>(null);

  const section = useMemo(
    () => record.sections.find((s) => s.id === active) ?? record.sections[0],
    [record, active],
  );

  const plain = useMemo(
    () =>
      record.sections
        .map(
          (s) =>
            `### ${s.title}\n` +
            s.blocks
              .map((b) =>
                b.type === "list"
                  ? b.items.map((i) => `  - ${i}`).join("\n")
                  : b.type === "kv"
                    ? b.items.map((i) => `  ${i.k}: ${i.v}`).join("\n")
                    : b.text,
              )
              .join("\n"),
        )
        .join("\n\n"),
    [record],
  );

  const copySection = async () => {
    const txt = record.sections
      .find((s) => s.id === active)!
      .blocks.map((b) =>
        b.type === "list" ? "• " + b.items.join("\n• ") : b.type === "kv" ? b.items.map((i) => `${i.k}: ${i.v}`).join("\n") : b.text,
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(`${section?.title}\n\n${txt}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const download = (kind: "analysis" | "source") => {
    const body =
      kind === "analysis"
        ? `Дело №${record.id} — анализ ИИ-помощника «Соломон»\n${record.court} · ${record.courtDate}\n\n${plain}`
        : `${record.source.caption.join("\n")}\n\n${record.source.paragraphs.join("\n\n")}`;
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind === "analysis" ? "анализ" : "исходный_документ"}_дело_${record.id.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = useMemo(() => parseDoc(record.source.paragraphs), [record]);
  const lineTexts = useMemo(() => lines.map((line) => line.text), [lines]);
  const interactiveConfig = useMemo(
    () => (section ? getInteractiveAnalysisConfig(record, section) : undefined),
    [record, section],
  );
  const selectionKey = `${record.id}:${active}`;
  const addedIds = useMemo(
    () => new Set(addedItems[selectionKey] ?? []),
    [addedItems, selectionKey],
  );
  const selectedCatalogIds = useMemo(
    () =>
      new Set([
        ...(interactiveConfig?.initialCatalogIds ?? []),
        ...(interactiveConfig?.kind === "punishments" && interactiveConfig.appliedCatalogId
          ? [interactiveConfig.appliedCatalogId]
          : []),
        ...Array.from(addedIds),
      ]),
    [addedIds, interactiveConfig],
  );
  const presentInteractiveItems = useMemo(() => {
    if (!interactiveConfig || interactiveConfig.kind === "punishments") return [];
    return [
      ...interactiveConfig.presentItems,
      ...interactiveConfig.catalogItems.filter((item) => addedIds.has(item.id)),
    ];
  }, [addedIds, interactiveConfig]);
  const selectedAlternatives = useMemo(() => {
    if (!interactiveConfig || interactiveConfig.kind !== "punishments") return [];
    return interactiveConfig.catalogItems.filter((item) => addedIds.has(item.id));
  }, [addedIds, interactiveConfig]);

  useEffect(() => {
    try {
      window.localStorage.setItem("solomon-added-analysis", JSON.stringify(addedItems));
    } catch {
      // Локальное сохранение необязательно для работы интерфейса.
    }
  }, [addedItems]);

  const lineContainsPhrase = (line: string, phrase: string) =>
    line.toLocaleLowerCase("ru-RU").includes(phrase.toLocaleLowerCase("ru-RU"));

  const linesForPhrases = (phrases: string[]) =>
    lineTexts.flatMap((line, index) =>
      phrases.some((phrase) => lineContainsPhrase(line, phrase)) ? [index] : [],
    );

  /** Элементы активного раздела, которые уже есть в тексте приговора. */
  const activeVerdictItems = useMemo<InteractiveAnalysisItem[]>(() => {
    if (!interactiveConfig) return [];
    return interactiveConfig.kind === "punishments"
      ? interactiveConfig.appliedPunishment
        ? [interactiveConfig.appliedPunishment]
        : []
      : interactiveConfig.presentItems;
  }, [interactiveConfig]);

  /** Точные фразы приговора, выделяемые цветом, пока выбран раздел. */
  const activePhrases = useMemo(
    () => activeVerdictItems.flatMap((item) => item.phrases ?? []),
    [activeVerdictItems],
  );

  /** Для пунктов без точных фраз выделяем наиболее подходящий абзац целиком. */
  const interactiveHighlights = useMemo(() => {
    if (!interactiveConfig) return [];
    const withoutPhrases = activeVerdictItems.filter((item) => !item.phrases?.length);
    return Array.from(
      new Set(
        withoutPhrases.flatMap((item) =>
          findSourceMatches(`${item.label} ${item.sourceQuery}`, active, lineTexts),
        ),
      ),
    ).sort((a, b) => a - b);
  }, [active, activeVerdictItems, interactiveConfig, lineTexts]);

  /** Абзацы, подсвечиваемые жёлтым: ручной выбор либо фразы и пункты активного раздела. */
  const effectiveHighlightedSource = useMemo(() => {
    if (highlightedSource.length) return highlightedSource;
    return Array.from(new Set([...interactiveHighlights, ...linesForPhrases(activePhrases)])).sort(
      (a, b) => a - b,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhrases, highlightedSource, interactiveHighlights, lineTexts]);

  /** Все добавленные пользователем пункты всех трёх разделов — вставляются прямо в текст приговора. */
  const insertedNotes = useMemo(() => {
    const result: {
      sectionId: string;
      kind: InteractiveKind;
      item: InteractiveAnalysisItem;
      anchor: number;
    }[] = [];
    for (const sectionId of ["mitigating", "aggravating", "alternatives"]) {
      const sec = record.sections.find((candidate) => candidate.id === sectionId);
      const cfg = sec ? getInteractiveAnalysisConfig(record, sec) : undefined;
      if (!cfg) continue;
      const ids = addedItems[`${record.id}:${sectionId}`] ?? [];
      const anchor = findAnchorIndex(cfg.sourceAnchorTerms, lineTexts, lineTexts.length - 1);
      for (const item of cfg.catalogItems) {
        if (ids.includes(item.id)) result.push({ sectionId, kind: cfg.kind, item, anchor });
      }
    }
    return result;
  }, [addedItems, lineTexts, record]);

  const notesByAnchor = useMemo(() => {
    const map = new Map<number, typeof insertedNotes>();
    for (const note of insertedNotes) {
      const current = map.get(note.anchor) ?? [];
      current.push(note);
      map.set(note.anchor, current);
    }
    return map;
  }, [insertedNotes]);

  /** При открытии раздела автоматически показываем первое выделенное место. */
  const firstTargetLine = useMemo(() => {
    const candidates = [
      ...(activePhrases.length ? linesForPhrases(activePhrases) : []),
      ...interactiveHighlights,
    ];
    return candidates.length ? Math.min(...candidates) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhrases, interactiveHighlights, lineTexts]);

  useEffect(() => {
    if (!interactiveConfig || firstTargetLine === undefined) return;
    const timer = window.setTimeout(() => {
      sourceLineRefs.current.get(firstTargetLine)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [active, firstTargetLine, interactiveConfig, record.id]);

  const flashAndScrollToNote = (noteKey: string) => {
    window.setTimeout(() => {
      noteRefs.current.get(noteKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashNote(noteKey);
      window.setTimeout(() => setFlashNote(null), 1500);
    }, 80);
  };

  const toggleInteractiveItem = (item: InteractiveAnalysisItem) => {
    if (!interactiveConfig) return;
    if (interactiveConfig.initialCatalogIds.includes(item.id)) return;
    if (interactiveConfig.kind === "punishments" && item.id === interactiveConfig.appliedCatalogId) return;
    const adding = !(addedItems[selectionKey] ?? []).includes(item.id);
    setAddedItems((previous) => {
      const current = previous[selectionKey] ?? [];
      const next = current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : [...current, item.id];
      return { ...previous, [selectionKey]: next };
    });
    setHighlightedSource([]);
    setActiveAnalysisKey(null);
    // Новый пункт сразу появляется в тексте приговора — переходим к нему.
    if (adding) flashAndScrollToNote(`${active}:${item.id}`);
  };

  const locateInSource = (text: string, key: string) => {
    const matches = findSourceMatches(
      text,
      active,
      lines.map((line) => line.text),
    );
    if (!matches.length) return;

    setActiveAnalysisKey(key);
    setHighlightedSource(matches);
    window.setTimeout(() => {
      sourceLineRefs.current.get(matches[0])?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 30);
  };

  const locateInteractive = (text: string, key: string) => {
    if (!interactiveConfig) return locateInSource(text, key);
    const id =
      key === "applied-punishment"
        ? interactiveConfig.appliedPunishment?.id
        : key.replace(/^(present|catalog|selected)-/, "");
    const item = [
      ...interactiveConfig.presentItems,
      ...interactiveConfig.catalogItems,
      ...(interactiveConfig.appliedPunishment ? [interactiveConfig.appliedPunishment] : []),
    ].find((candidate) => candidate.id === id);

    setActiveAnalysisKey(key);

    // Добавленный пользователем пункт — переходим к вставленной строке.
    if (item && addedIds.has(item.id)) {
      setHighlightedSource([]);
      flashAndScrollToNote(`${active}:${item.id}`);
      return;
    }

    // Пункт, который уже есть в приговоре, — переходим к точной фразе.
    if (item?.phrases?.length) {
      const matched = linesForPhrases(item.phrases);
      if (matched.length) {
        setHighlightedSource(matched);
        window.setTimeout(() => {
          sourceLineRefs.current.get(matched[0])?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 30);
        return;
      }
    }
    locateInSource(text, key);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-4 sm:px-6 lg:px-10">
        {/* хлебные крошки */}
        <div className="flex items-center gap-2 text-[13px]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-slate-500 dark:text-slate-400 transition hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Мои дела
          </button>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-600 dark:text-slate-300">№ {record.id}</span>
        </div>

        {/* заголовок */}
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Дело № {record.id}
              </h1>
              <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
                {record.kind}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400">
              {record.court}
              <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
              {record.courtDate}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50/80 dark:bg-blue-500/15 px-3.5 py-2 text-[14px] font-medium text-blue-700 dark:text-blue-300">
              {record.articles}
            </span>
            <button
              onClick={() => download("analysis")}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[14px] font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <DownloadIcon className="h-[18px] w-[18px]" />
              Экспорт анализа
            </button>
          </div>
        </div>

        {/* рабочая область */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[214px_minmax(0,1fr)] xl:grid-cols-[214px_minmax(0,1fr)_minmax(0,1.02fr)]">
          {/* разделы */}
          <aside className="rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-[0_1px_2px_rgba(15,23,42,.05),0_20px_40px_-30px_rgba(15,23,42,.25)] ring-1 ring-slate-200/70 dark:ring-slate-700/70">
            <p className="px-2 pb-2 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400 dark:text-slate-500">
              Разделы анализа
            </p>
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {record.sections.map((s) => {
                const on = s.id === active;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActive(s.id);
                      setActiveAnalysisKey(null);
                      setHighlightedSource([]);
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-2 text-left transition lg:w-full",
                      on ? "bg-blue-50 dark:bg-blue-500/15" : "hover:bg-slate-50 dark:hover:bg-slate-800",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition",
                        on ? "bg-blue-600 text-white shadow-sm shadow-blue-200" : "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-700",
                      )}
                    >
                      <SectionIcon name={s.icon} className="h-[18px] w-[18px]" />
                    </span>
                    <span
                      className={cn(
                        "text-[13px] leading-[1.25]",
                        on ? "font-medium text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300",
                      )}
                    >
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* фабула дела */}
          <section className="flex h-[560px] min-h-[440px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.05),0_20px_40px_-30px_rgba(15,23,42,.25)] ring-1 ring-slate-200/70 dark:ring-slate-700/70 xl:h-[615px]">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
              <h2 className="text-[17px] font-semibold text-slate-900 dark:text-slate-50">{section?.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={copySection}
                  title="Скопировать раздел"
                  className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  {copied ? (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">ОК</span>
                  ) : (
                    <CopyIcon className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>
            </header>

            <ScrollArea key={section?.id} className="px-5 py-4">
              {interactiveConfig ? (
                <InteractiveSection
                  config={interactiveConfig}
                  presentItems={presentInteractiveItems}
                  selectedAlternatives={selectedAlternatives}
                  selectedIds={selectedCatalogIds}
                  addedIds={addedIds}
                  activeKey={activeAnalysisKey}
                  onToggle={toggleInteractiveItem}
                  onLocate={locateInteractive}
                />
              ) : (
                <>
                  <SectionBanner id={active} icon={section?.icon ?? "doc"} title={section?.title ?? ""} />
                  <Blocks
                    blocks={section?.blocks ?? []}
                    sectionId={active}
                    activeKey={activeAnalysisKey}
                    onLocate={locateInSource}
                  />
                </>
              )}
              <div className="h-2" />
            </ScrollArea>

            <footer className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 px-5 py-3 text-[12.5px] text-slate-500 dark:text-slate-400">
              <InfoIcon className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              {interactiveConfig
                ? "Добавленные пункты отображаются в исходном документе и подсвечиваются при выборе раздела."
                : "Нажмите на фрагмент анализа, чтобы открыть его в исходном документе."}
            </footer>
          </section>

          {/* исходный документ — текст, а не изображение */}
          <section className="flex h-[560px] min-h-[440px] flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 pb-3 shadow-[0_1px_2px_rgba(15,23,42,.05),0_20px_40px_-30px_rgba(15,23,42,.25)] ring-1 ring-slate-200/70 dark:ring-slate-700/70 max-lg:order-last lg:col-span-2 lg:h-[500px] xl:col-span-1 xl:h-[615px]">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-slate-50">
                <DocTextIcon className="h-[18px] w-[18px] text-blue-600 dark:text-blue-300" />
                Исходный документ
                {effectiveHighlightedSource.length > 0 && (
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10.5px] font-medium ring-1",
                      interactiveConfig
                        ? INTERACTIVE_TONES[interactiveConfig.kind].badge + " ring-current/20"
                        : "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-200 ring-amber-200 dark:ring-amber-500/40",
                    )}
                  >
                    {interactiveConfig ? "Фрагменты раздела выделены" : "Фрагмент выделен"}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => download("source")}
                  title="Скачать текст документа"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  <DownloadIcon className="h-[17px] w-[17px]" />
                </button>
              </div>
            </header>

            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 px-5 py-2">
              <span className="text-[12px] text-slate-500 dark:text-slate-400">Кегль:</span>
              <select
                value={docSize}
                onChange={(e) => setDocSize(Number(e.target.value))}
                aria-label="Кегль"
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 outline-none transition focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/25"
              >
                {[10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22].map((n) => (
                  <option key={n} value={n}>
                    {n} px
                  </option>
                ))}
              </select>
            </div>

            <ScrollArea className="px-6 py-4">
              <div
                className="mx-auto max-w-[760px] font-mono text-slate-800 dark:text-slate-100"
                style={{ fontSize: `${docSize}px`, lineHeight: 1.55 }}
              >
                {record.source.caption.map((c, i) => (
                  <p key={i} className="text-[0.78em] leading-[1.5] text-slate-500 dark:text-slate-400">
                    {c}
                  </p>
                ))}
                {lines.map((l, i) => {
                  const highlighted = effectiveHighlightedSource.includes(i);
                  const notes = notesByAnchor.get(i) ?? [];
                  const sourceClass = cn(
                    "source-fragment -mx-2 rounded-md px-2 transition-colors duration-300",
                    // Абзац всегда подсвечивается жёлтым, слова внутри — цветом раздела.
                    highlighted &&
                      "source-highlight bg-amber-100 text-slate-950 ring-1 ring-inset ring-amber-300 dark:bg-amber-400/20 dark:text-amber-50 dark:ring-amber-400/50",
                  );
                  const sourceRef = (node: HTMLParagraphElement | null) => {
                    if (node) sourceLineRefs.current.set(i, node);
                    else sourceLineRefs.current.delete(i);
                  };
                  const content = interactiveConfig
                    ? markPhrases(l.text, activePhrases, INTERACTIVE_TONES[interactiveConfig.kind].mark)
                    : l.text;
                  let paragraph: ReactElement;
                  if (l.t === "head") {
                    paragraph = (
                      <p
                        ref={sourceRef}
                        className={cn(
                          sourceClass,
                          "mb-[0.7em] mt-[1.1em] text-center font-bold tracking-[0.1em] text-slate-900 dark:text-slate-50",
                        )}
                      >
                        {content}
                      </p>
                    );
                  } else if (l.t === "center") {
                    paragraph = (
                      <p ref={sourceRef} className={cn(sourceClass, "text-center")}>
                        {content}
                      </p>
                    );
                  } else if (l.t === "right") {
                    paragraph = (
                      <p ref={sourceRef} className={cn(sourceClass, "pr-[8%] text-right")}>
                        {content}
                      </p>
                    );
                  } else {
                    paragraph = (
                      <p
                        ref={sourceRef}
                        className={cn(sourceClass, "mt-[0.35em] text-justify indent-[2.2em]")}
                      >
                        {content}
                      </p>
                    );
                  }
                  return (
                    <Fragment key={i}>
                      {paragraph}
                      {notes.map((note) => {
                        const isActiveSection = note.sectionId === active;
                        const tone = INTERACTIVE_TONES[note.kind];
                        return (
                          <p
                            key={`${note.sectionId}-${note.item.id}`}
                            ref={(node) => {
                              if (node) noteRefs.current.set(`${note.sectionId}:${note.item.id}`, node);
                              else noteRefs.current.delete(`${note.sectionId}:${note.item.id}`);
                            }}
                            className={cn(
                              "-mx-2 mt-[0.35em] rounded-md border-l-4 px-2 py-1 text-justify indent-[2.2em] transition-colors duration-300",
                              isActiveSection
                                ? cn(tone.inserted, "source-highlight")
                                : "border-slate-300 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300",
                              flashNote === `${note.sectionId}:${note.item.id}` && "ring-2 ring-slate-900/25",
                            )}
                          >
                            <span
                              className={cn(
                                "mr-2 inline-block rounded px-1.5 text-[0.72em] font-sans font-semibold uppercase tracking-wide indent-0",
                                isActiveSection ? tone.badge : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                              )}
                            >
                              {INSERT_LABEL[note.kind]}
                            </span>
                            {insertedSentence(note.kind, note.item)}
                          </p>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
              <div className="h-2" />
            </ScrollArea>


          </section>
        </div>
      </div>
    </div>
  );
}
