import { useEffect, useRef, useState } from "react";
import watermark from "@/assets/watermark.png";
import {
  ArrowLeft,
  ArrowRight,
  CheckIcon,
  ChevronDown,
  ChevronRight,
  DocIcon,
  FilePlusIcon,
  LockIcon,
  SearchIcon,
  SortIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from "@/components/icons";
import { buildCase } from "@/lib/newCase";
import type { CaseRecord } from "@/types";
import { cn } from "@/utils/cn";

type Sort = "new" | "old" | "num";
const PAGE = 4;



/* ------------------------------- Левая карточка ------------------------------- */

function History({
  cases,
  onOpen,
  onDelete,
}: {
  cases: CaseRecord[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(cases[0]?.id ?? null);

  const filtered = cases.filter((c) =>
    q.trim()
      ? (c.id + c.description + c.kind + c.articles).toLowerCase().includes(q.trim().toLowerCase())
      : true,
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "old") return a.createdAt.localeCompare(b.createdAt);
    if (sort === "num") return a.id.localeCompare(b.id, "ru", { numeric: true });
    return b.createdAt.localeCompare(a.createdAt);
  });

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const current = Math.min(page, pages);
  const rows = sorted.slice((current - 1) * PAGE, current * PAGE);
  const sortLabels: Record<Sort, string> = {
    new: "Сначала новые",
    old: "Сначала старые",
    num: "По номеру дела",
  };
  const plural = (n: number) => {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "дело";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "дела";
    return "дел";
  };

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.05),0_24px_48px_-32px_rgba(15,23,42,.25)] ring-1 ring-slate-200/70 dark:ring-slate-700/70">
      <div className="flex items-center gap-3 px-6 pt-6">
        <h2 className="text-[23px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">История дел</h2>
        <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
          {cases.length} {plural(cases.length)}
        </span>
      </div>

      <div className="px-6 pt-4">
        <label className="relative block">
          <SearchIcon className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск по номеру, участнику или содержанию дела"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-11 pr-10 text-[14px] text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-500/25"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      <div className="mt-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 px-6 pb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
        <span>Дело / описание</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-3">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-500/15 px-3 py-1.5 text-[13px] font-medium text-blue-600 dark:text-blue-300">
            Все дела
            <span className="rounded-md bg-white dark:bg-slate-900 px-1.5 text-[11.5px] text-blue-600 dark:text-blue-300">{cases.length}</span>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setSortOpen((s) => !s)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13.5px] text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <SortIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            {sortLabels[sort]}
            <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-xl">
              {(Object.keys(sortLabels) as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSort(s);
                    setSortOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13.5px] transition hover:bg-slate-50 dark:hover:bg-slate-800",
                    sort === s ? "text-blue-600 dark:text-blue-300" : "text-slate-600 dark:text-slate-300",
                  )}
                >
                  {sortLabels[s]}
                  {sort === s && <CheckIcon className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-[168px] flex-1 border-l-[3px] border-blue-600">
        {rows.length === 0 && (
          <div className="flex h-[168px] flex-col items-center justify-center gap-2 text-center">
            <DocIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-[14px] text-slate-500 dark:text-slate-400">Дела не найдены</p>
            <p className="text-[12.5px] text-slate-400 dark:text-slate-500">Измените условия поиска или фильтр</p>
          </div>
        )}
        {rows.map((c) => (
          <div
            key={c.id}
            className={cn(
              "group flex w-full items-center gap-3 px-6 py-5 transition",
              selected === c.id ? "bg-blue-50/70 dark:bg-blue-500/15" : "hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
          >
            <button
              onClick={() => {
                setSelected(c.id);
                onOpen(c.id);
              }}
              className="flex min-w-0 flex-1 items-center gap-4 text-left"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-700">
                <DocIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[14.5px] font-semibold text-blue-600 dark:text-blue-300">№{c.id}</span>
                  <span className="text-[13px] text-slate-400 dark:text-slate-500">{c.kind}</span>
                </span>
                <span className="mt-1 block truncate text-[15px] text-slate-800 dark:text-slate-100">{c.description}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600 transition group-hover:text-blue-500" />
            </button>

            {confirmId === c.id ? (
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="hidden text-[12.5px] text-slate-500 dark:text-slate-400 sm:inline">Удалить дело?</span>
                <button
                  onClick={() => {
                    onDelete(c.id);
                    setConfirmId(null);
                  }}
                  className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[12px] font-medium text-white transition hover:bg-rose-700"
                >
                  Да
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Нет
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmId(c.id)}
                title="Удалить дело"
                aria-label={`Удалить дело №${c.id}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 dark:text-slate-500 opacity-0 transition hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <TrashIcon className="h-[18px] w-[18px]" />
              </button>
            )}

          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Показаны {rows.length} из {sorted.length} {plural(sorted.length)}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(Math.max(1, current - 1))}
            disabled={current === 1}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 dark:bg-blue-500/15 text-[13px] font-medium text-blue-600 dark:text-blue-300">
            {current}
          </span>
          <button
            onClick={() => setPage(Math.min(pages, current + 1))}
            disabled={current === pages}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Правая карточка ------------------------------ */

const KINDS = ["Уголовное дело", "Гражданское дело", "Административное дело", "Материал"];

function NewCase({ onCreated }: { onCreated: (c: CaseRecord) => void }) {
  const [name, setName] = useState<string | null>(null);
  const [size, setSize] = useState(0);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [number, setNumber] = useState(`1-${Math.floor(Math.random() * 240 + 40)}/${new Date().getFullYear()}`);
  const [kind, setKind] = useState(KINDS[0]);
  const [court, setCourt] = useState("Апатитский городской суд Мурманской области");
  const [date, setDate] = useState(new Date().toLocaleDateString("ru-RU"));
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const ready = !!name && progress >= 100;

  const handle = async (file: File) => {
    setName(file.name);
    setSize(file.size);
    setProgress(0);
    setText("");
    if (/\.(txt|md|csv)$/i.test(file.name)) {
      try {
        const t = await file.text();
        if (t.trim().length > 40) setText(t.trim());
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    if (!name || progress >= 100) return;
    const id = window.setInterval(() => setProgress((p) => Math.min(100, p + 7 + Math.random() * 12)), 90);
    return () => window.clearInterval(id);
  }, [name, progress]);

  const register = () => {
    if (!ready || !name) return;
    const rec = buildCase({ number, kind, court, date, text, sourceName: name });
    onCreated(rec);
    setName(null);
    setProgress(0);
  };

  const field =
    "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13.5px] text-slate-800 dark:text-slate-100 outline-none transition focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-500/25";

  return (
    <section className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,.05),0_24px_48px_-32px_rgba(15,23,42,.25)] ring-1 ring-slate-200/70 dark:ring-slate-700/70">
      <h2 className="text-[23px] font-semibold tracking-tight text-slate-900 dark:text-slate-50">Новое дело</h2>
      <p className="mt-2 text-[13.5px] leading-[1.45] text-slate-500 dark:text-slate-400">
        Добавьте фото документа — помощник распознает текст и подготовит анализ дела.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handle(f);
        }}
        className={cn(
          "mt-5 rounded-2xl border border-dashed px-5 py-8 text-center transition",
          drag ? "border-blue-400 bg-blue-50/70 dark:bg-blue-500/15 ring-4 ring-blue-100 dark:ring-blue-500/30" : "border-blue-200/80 dark:border-blue-500/40 bg-blue-50/40",
        )}
      >
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 grid place-items-center rounded-2xl bg-white dark:bg-slate-900 text-blue-500 shadow-sm ring-1 ring-blue-100 dark:ring-blue-500/30">
            <FilePlusIcon className="h-7 w-7" />
          </span>
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-blue-50 bg-blue-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M12 6v12M6 12h12" />
            </svg>
          </span>
        </div>

        <p className="mt-4 text-[17px] font-semibold text-slate-900 dark:text-slate-50">Переместите файл документа</p>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">или выберите файл на компьютере</p>

        <button
          onClick={() => input.current?.click()}
          className="mx-auto mt-4 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-[14px] font-medium text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <UploadIcon className="h-[18px] w-[18px] text-blue-500" />
          Выбрать файл
        </button>
        <input
          ref={input}
          type="file"
          accept=".txt,.md,.docx,.doc,.pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
          }}
        />
        <p className="mt-3 text-[12.5px] text-slate-400 dark:text-slate-500">DOCX, PDF — до 200 МБ</p>
      </div>

      {name && (
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-300 ring-1 ring-slate-200 dark:ring-slate-700">
              <DocIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-slate-800 dark:text-slate-100">{name}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {(size / 1024).toFixed(0)} КБ ·{" "}
                {progress < 100 ? "Распознавание текста…" : text ? "Текст распознан" : "Метаданные распознаны"}
              </p>
            </div>
            <button
              onClick={() => {
                setName(null);
                setProgress(0);
              }}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 dark:text-slate-500 transition hover:bg-white dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-100"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {progress >= 100 && (
            <div className="mt-4 space-y-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Проверьте распознанные данные
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <input value={number} onChange={(e) => setNumber(e.target.value)} className={field} placeholder="Номер дела" />
                <input value={date} onChange={(e) => setDate(e.target.value)} className={field} placeholder="Дата" />
              </div>
              <select value={kind} onChange={(e) => setKind(e.target.value)} className={field}>
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <input value={court} onChange={(e) => setCourt(e.target.value)} className={field} placeholder="Суд" />
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
                {text ? "Файл прочитан как текст — исходный документ будет доступен для листания." : "Будет создан черновик с распознанным текстом."}
              </p>
            </div>
          )}
        </div>
      )}

      <ol className="mt-5 space-y-3.5">
        {[
          { t: "Загрузите читаемое фото", d: "Документ целиком, без бликов и обрезанных краёв." },
          { t: "Проверьте распознанные данные", d: "Уточните номер дела и сохраните его в базе." },
        ].map((s, i) => (
          <li key={s.t} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11.5px] font-semibold text-slate-500 dark:text-slate-400">
              {i + 1}
            </span>
            <div>
              <p className="text-[14px] font-medium text-slate-800 dark:text-slate-100">{s.t}</p>
              <p className="text-[12.5px] leading-[1.4] text-slate-500 dark:text-slate-400">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 h-px bg-slate-100 dark:bg-slate-800" />

      <button
        onClick={register}
        disabled={!ready}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-medium transition",
          ready
            ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
            : "cursor-not-allowed bg-blue-600/90 text-white/90",
        )}
      >
        <ArrowRight className="h-[18px] w-[18px]" />
        Зарегистрировать дело
      </button>
      <p className="mt-2.5 text-center text-[12.5px] text-slate-400 dark:text-slate-500">
        {ready ? "Дело будет добавлено в историю" : "Сначала добавьте фото документа"}
      </p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-slate-500 dark:text-slate-400">
        <LockIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        Материалы доступны только в вашем пространстве
      </p>
    </section>
  );
}

/* ------------------------------- Страница ------------------------------- */

export function HomePage({
  cases,
  onOpenCase,
  onDeleteCase,
  onCreated,
}: {
  cases: CaseRecord[];
  onOpenCase: (id: string) => void;
  onDeleteCase: (id: string) => void;
  onCreated: (c: CaseRecord) => void;
}) {
  return (
    <div className="relative min-h-[calc(80vh-58px)] w-full overflow-hidden bg-[#f9fafc] dark:bg-slate-950">
      {/* герб на всю страницу */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-center bg-no-repeat dark:opacity-[0.07] dark:invert"
        style={{
          backgroundImage: `url(${watermark})`,
          backgroundSize: "contain",
          backgroundPosition: "center 46%",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10 xl:grid-cols-[minmax(0,1fr)_460px]">
        <History cases={cases} onOpen={onOpenCase} onDelete={onDeleteCase} />
        <NewCase onCreated={onCreated} />
      </div>
    </div>
  );
}


