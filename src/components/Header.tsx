import { useEffect, useRef, useState } from "react";
import gerb from "@/assets/gerb.png";
import { ChevronDown, HelpIcon, MenuIcon, MoonIcon, SunIcon, UserIcon } from "@/components/icons";
import { cn } from "@/utils/cn";

export type Route = { name: "home" } | { name: "case"; id: string };

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300">
            <HelpIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[17px] font-semibold text-slate-900 dark:text-slate-50">Как работает помощник</h3>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              ИИ-ассистент распознаёт судебный акт и готовит структурированный анализ.
            </p>
          </div>
        </div>
        <ol className="mt-5 space-y-3 text-[13px] text-slate-600 dark:text-slate-300">
          {[
            "Загрузите фото или файл судебного акта (DOCX, PDF, изображение).",
            "Проверьте распознанные реквизиты дела и зарегистрируйте его.",
            "Откройте дело: слева — разделы анализа, справа — исходный документ.",
            "Текст в окнах «Фабула дела» и «Исходный документ» листается ползунками, колёсиком мыши и клавишами ↑ ↓.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-[14px] font-medium text-white transition hover:bg-blue-700"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

export function Header({
  route,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<"user" | "burger" | null>(null);
  const [help, setHelp] = useState(false);
  const wrap = useOutside(() => setOpenMenu(null));

  const navItems: { label: string; key: string; go: Route }[] = [
    { label: "Мои дела", key: "home", go: { name: "home" } },
    { label: "Рабочее пространство", key: "workspace", go: { name: "home" } },
  ];

  const active =
    route.name === "case" ? "workspace" : "home";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900">
        <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <button
            onClick={() => onNavigate({ name: "home" })}
            className="flex shrink-0 items-center gap-3 rounded-xl pr-2 text-left transition hover:opacity-80"
          >
            <img src={gerb} alt="Герб" className="h-[46px] w-[46px] shrink-0 object-contain" />
            <span className="leading-tight">
              <span className="block text-[20px] font-bold tracking-tight text-slate-900 dark:text-slate-50">Соломон</span>
              <span className="block text-[12.5px] text-slate-500 dark:text-slate-400">ИИ-помощник судьи</span>
            </span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {navItems.map((n) => (
              <button
                key={n.key}
                onClick={() => onNavigate(n.go)}
                className={cn(
                  "rounded-lg px-3 py-2 text-[14.5px] transition",
                  active === n.key
                    ? "font-medium text-slate-900 dark:text-slate-50"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white",
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3" ref={wrap}>
            <button
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
            >
              {theme === "dark" ? (
                <SunIcon className="h-[18px] w-[18px]" />
              ) : (
                <MoonIcon className="h-[18px] w-[18px]" />
              )}
            </button>

            <button
              onClick={() => setHelp(true)}
              aria-label="Помощь"
              className="hidden h-9 w-9 place-items-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 sm:grid"
            >
              <HelpIcon className="h-[18px] w-[18px]" />
            </button>

            <span className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === "user" ? null : "user")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[14px] text-slate-700 dark:text-slate-200 transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden sm:inline">Демо-доступ</span>
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </button>
              {openMenu === "user" && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 px-3 py-2.5">
                    <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100">Демо-доступ</p>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Судья · Апатитский городской суд</p>
                  </div>
                  {["Профиль пользователя", "Настройки анализа", "Журнал действий"].map((i) => (
                    <button
                      key={i}
                      onClick={() => setOpenMenu(null)}
                      className="block w-full rounded-xl px-3 py-2 text-left text-[13.5px] text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                      {i}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === "burger" ? null : "burger")}
                aria-label="Меню"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              {openMenu === "burger" && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl">
                  {[
                    { l: "Мои дела", go: { name: "home" } as Route },
                    { l: "Рабочее пространство", go: { name: "home" } as Route },
                  ].map((i) => (
                    <button
                      key={i.l}
                      onClick={() => {
                        onNavigate(i.go);
                        setOpenMenu(null);
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-[13.5px] text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                      {i.l}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <button
                    onClick={() => {
                      setHelp(true);
                      setOpenMenu(null);
                    }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-[13.5px] text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  >
                    Помощь и поддержка
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {help && <HelpModal onClose={() => setHelp(false)} />}
    </>
  );
}
