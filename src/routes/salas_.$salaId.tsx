import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findSala, CURSO_CORES } from "@/lib/salas";
import { playChime, speak } from "@/lib/audio";

interface Aviso {
  id: string;
  sala_id: number;
  titulo: string;
  mensagem: string;
  created_at: string;
}

export const Route = createFileRoute("/salas_/$salaId")({
  head: ({ params }) => ({
    meta: [
      { title: `Sala ${params.salaId} — SOPHIE` },
      {
        name: "description",
        content: `Terminal de avisos em tempo real da Sala ${params.salaId}.`,
      },
    ],
  }),
  component: SalaPage,
});

const dismissedKey = (salaId: number) => `sophie:dismissed:${salaId}`;
function loadDismissed(salaId: number): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(dismissedKey(salaId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function saveDismissed(salaId: number, set: Set<string>) {
  try {
    // Cap to last 200 IDs to avoid bloat
    const arr = Array.from(set).slice(-200);
    window.localStorage.setItem(dismissedKey(salaId), JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}

function SalaPage() {
  const { salaId } = useParams({ from: "/salas_/$salaId" });
  const idNum = Number(salaId);
  const sala = useMemo(() => findSala(idNum), [idNum]);

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(idNum));
  const [audioReady, setAudioReady] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [pulse, setPulse] = useState(0);
  const firstLoadRef = useRef(true);

  useEffect(() => {
    setDismissed(loadDismissed(idNum));
  }, [idNum]);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!sala) return;
    let mounted = true;

    supabase
      .from("avisos")
      .select("id, sala_id, titulo, mensagem, created_at")
      .eq("sala_id", idNum)
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (mounted && data) setAvisos(data as Aviso[]);
        firstLoadRef.current = false;
      });

    const channel = supabase
      .channel(`avisos-sala-${idNum}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "avisos",
          filter: `sala_id=eq.${idNum}`,
        },
        (payload) => {
          const novo = payload.new as Aviso;
          setAvisos((prev) => {
            if (prev.some((a) => a.id === novo.id)) return prev;
            return [novo, ...prev].slice(0, 15);
          });
          setPulse((p) => p + 1);
          if (audioReady) {
            playChime();
            setTimeout(
              () =>
                speak(
                  `Atenção, sala ${String(sala.id).padStart(2, "0")}. ${novo.titulo}. ${novo.mensagem}`,
                ),
              900,
            );
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [idNum, sala, audioReady]);

  const visiveis = useMemo(
    () => avisos.filter((a) => !dismissed.has(a.id)),
    [avisos, dismissed],
  );
  const aviso = visiveis[0] ?? null;
  const historico = visiveis.slice(1, 6);

  const dispensar = useCallback(
    (id: string) => {
      setDismissed((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveDismissed(idNum, next);
        return next;
      });
    },
    [idNum],
  );

  if (!sala) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-brand-deep">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-4">Sala não encontrada</h1>
          <Link to="/salas" className="text-brand-light underline">
            Voltar para o painel de salas
          </Link>
        </div>
      </div>
    );
  }

  const cor = CURSO_CORES[sala.curso];
  const horaStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background"
      style={{ backgroundImage: `radial-gradient(circle at 20% 0%, ${cor.tint}, transparent 60%)` }}
    >
      <div
        className="w-full max-w-7xl bg-card rounded-3xl overflow-hidden shadow-2xl flex flex-col border-4"
        style={{ borderColor: cor.accent }}
      >
        {/* Top bar */}
        <div
          className="px-6 md:px-10 py-4 md:py-5 flex flex-wrap gap-4 justify-between items-center text-white"
          style={{ background: cor.accent }}
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="size-3 md:size-4 rounded-full bg-white animate-pulse" />
            <span className="font-mono font-bold tracking-tighter text-sm md:text-base">
              {sala.sigla} — SALA {String(sala.id).padStart(2, "0")}
            </span>
          </div>
          <div className="flex flex-col items-end leading-none">
            <span className="font-mono font-black text-3xl md:text-5xl tabular-nums tracking-tight">
              {horaStr}
            </span>
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.25em] opacity-90 mt-1">
              {dataStr}
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {!audioReady && (
              <button
                type="button"
                onClick={() => {
                  setAudioReady(true);
                  playChime();
                  if (aviso) {
                    setTimeout(
                      () =>
                        speak(
                          `Atenção, sala ${String(sala.id).padStart(2, "0")}. ${aviso.titulo}. ${aviso.mensagem}`,
                        ),
                      900,
                    );
                  }
                }}
                className="px-3 py-1.5 rounded-full bg-white text-brand-deep text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                🔊 Ativar som
              </button>
            )}
            <Link
              to="/salas"
              className="text-xs font-mono uppercase tracking-widest opacity-90 hover:opacity-100 hover:underline"
            >
              ← Salas
            </Link>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Main aviso */}
          <div className="relative min-h-[55vh] flex flex-col items-center justify-center p-8 md:p-16 text-center overflow-hidden bg-card">
            {aviso ? (
              <div
                key={`${aviso.id}-${pulse}`}
                className="w-full animate-[fade-in_0.4s_ease-out,scale-in_0.3s_ease-out]"
              >
                <div
                  className="text-xs font-mono mb-4 md:mb-6 uppercase tracking-[0.4em] flex items-center justify-center gap-3"
                  style={{ color: cor.accent }}
                >
                  <span
                    className="inline-block size-2 rounded-full animate-ping"
                    style={{ background: cor.accent }}
                  />
                  Comunicado recebido · {tempoRelativo(aviso.created_at)}
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-black leading-[0.85] tracking-tighter mb-6 md:mb-10 uppercase break-words max-w-full text-brand-deep">
                  {aviso.titulo}
                </h2>
                <p className="text-xl md:text-3xl font-medium text-brand-deep/70 max-w-3xl mx-auto leading-snug">
                  {aviso.mensagem}
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  {audioReady && (
                    <button
                      type="button"
                      onClick={() => {
                        playChime();
                        setTimeout(
                          () =>
                            speak(
                              `Atenção, sala ${String(sala.id).padStart(2, "0")}. ${aviso.titulo}. ${aviso.mensagem}`,
                            ),
                          900,
                        );
                      }}
                      className="px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                      style={{ background: cor.accent }}
                    >
                      🔁 Repetir aviso
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dispensar(aviso.id)}
                    className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2 hover:scale-105 transition-transform text-brand-deep"
                    style={{ borderColor: cor.accent }}
                  >
                    ✕ Dispensar aviso
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div
                  className="text-xs font-mono mb-6 uppercase tracking-[0.4em]"
                  style={{ color: cor.accent }}
                >
                  Terminal ativo — aguardando aviso
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase opacity-20 text-brand-deep">
                  Sem avisos
                  <br />
                  no momento
                </h2>
                <p className="mt-6 text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                  Os comunicados enviados pela gestão aparecem aqui em tempo real, com som e voz.
                </p>
              </div>
            )}
          </div>

          {/* Histórico */}
          <aside className="border-t lg:border-t-0 lg:border-l border-border bg-muted/30 p-5 md:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold"
                style={{ color: cor.accent }}
              >
                Histórico
              </h3>
              {visiveis.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const all = new Set(dismissed);
                    visiveis.forEach((a) => all.add(a.id));
                    saveDismissed(idNum, all);
                    setDismissed(all);
                  }}
                  className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-deep"
                >
                  Limpar tudo
                </button>
              )}
            </div>
            {historico.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Avisos anteriores aparecem aqui.
              </p>
            ) : (
              <ul className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {historico.map((a) => (
                  <li
                    key={a.id}
                    className="group rounded-xl bg-card border border-border p-3 hover:shadow-md transition-shadow animate-fade-in"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-deep truncate uppercase tracking-tight">
                          {a.titulo}
                        </p>
                        <p className="text-xs text-brand-deep/70 line-clamp-2 mt-0.5">
                          {a.mensagem}
                        </p>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-2">
                          {tempoRelativo(a.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispensar(a.id)}
                        aria-label="Dispensar"
                        className="opacity-40 group-hover:opacity-100 text-muted-foreground hover:text-brand-deep transition-opacity text-sm leading-none"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>

        <div className="h-2 md:h-3 w-full" style={{ background: cor.accent }} />
      </div>
    </div>
  );
}
