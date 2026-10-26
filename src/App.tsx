import { useEffect, useState } from "react";
import { Header, type Route } from "@/components/Header";
import { initialCases } from "@/data/cases";
import { CasePage } from "@/pages/CasePage";
import { HomePage } from "@/pages/HomePage";
import type { CaseRecord } from "@/types";

type Theme = "light" | "dark";

function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem("solomon-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem("solomon-theme", theme);
    } catch {
      // Сохранение темы необязательно для работы интерфейса.
    }
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  const openCase = (id: string) => setRoute({ name: "case", id });

  const deleteCase = (id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id));
    setRoute((prev) => (prev.name === "case" && prev.id === id ? { name: "home" } : prev));
  };

  const current = route.name === "case" ? cases.find((c) => c.id === route.id) : undefined;

  return (
    <div className="min-h-[80vh] bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        route={route}
        onNavigate={setRoute}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />
      {route.name === "case" && current ? (
        <CasePage record={current} onBack={() => setRoute({ name: "home" })} />
      ) : (
        <HomePage
          cases={cases}
          onOpenCase={openCase}
          onDeleteCase={deleteCase}
          onCreated={(c) => {
            setCases((prev) => [c, ...prev]);
            openCase(c.id);
          }}
        />
      )}
    </div>
  );
}
