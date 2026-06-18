import { useEffect, useState } from "react";

type Tema = "claro" | "escuro";

const STORAGE_KEY = "sophie-tema";

function lerTemaInicial(): Tema {
  if (typeof document === "undefined") return "claro";
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

function aplicarTema(t: Tema) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "escuro");
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    setTema(lerTemaInicial());
  }, []);

  const alternar = () => {
    const novo: Tema = tema === "claro" ? "escuro" : "claro";
    setTema(novo);
    aplicarTema(novo);
  };

  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className="relative size-9 rounded-full border-2 border-brand-deep/15 hover:border-brand-deep flex items-center justify-center text-base transition-all hover:scale-105 bg-surface"
    >
      <span aria-hidden>{escuro ? "☀" : "☾"}</span>
    </button>
  );
}
