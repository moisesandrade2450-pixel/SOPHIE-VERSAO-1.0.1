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

const AUTO_SPEAK_DELAY_MS = 10_000;

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
  const [audioReady, setAudioReady] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [pulse, setPulse] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spokenIds, setSpokenIds] = useState<Set<string>>(new Set());
  const audioReadyRef = useRef(false);
  audioReadyRef.current = audioReady;

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  const falarAviso = useCallback(
    (a: Aviso) => {
      if (!sala) return;
      playChime();
      setTimeout(
        () =>
          speak(
            `Atenção, sala ${String(sala.id).padStart(2, "0")}. ${a.titulo}. ${a.mensagem}`,
          ),
        900,
      );
      setSpokenIds((prev) => {
        if (prev.has(a.id)) return prev;
        const next = new Set(prev);
        next.add(a.id);
        return next;
      });
    },
    [sala],
  );

  useEffect(() => {
    if (!sala) return;
    let mounted = true;

    supabase
      .from("avisos")
      .select("id, sala_id, titulo, mensagem, created_at")
      .eq("sala_id", idNum)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (mounted && data) setAvisos(data as Aviso[]);
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
            return [novo, ...prev].slice(0, 50);
          });
          setPulse((p) => p + 1);
          setSelectedId(novo.id);
          // Chime imediato; voz só depois de 10s, e somente se ainda não falado.
          if (audioReadyRef.current) {
            playChime();
            setTimeout(() => {
              setSpokenIds((prev) => {
                if (prev.has(novo.id)) return prev;
                speak(
                  `Atenção, sala ${String(sala.id).padStart(2, "0")}. ${novo.titulo}. ${novo.mensagem}`,
                );
                const next = new Set(prev);
                next.add(novo.id);
                return next;
              });
            }, AUTO_SPEAK_DELAY_MS);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [idNum, sala]);

  const avisoAtual = useMemo(() => {
    if (selectedId) {
      const found = avisos.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return avisos[0] ?? null;
  }, [avisos, selectedId]);

  const historico = useMemo(
    () => avisos.filter((a) => a.id !== avisoAtual?.id).slice(0, 12),
    [avisos, avisoAtual],
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

  const segundosDesdeCriacao = avisoAtual
    ? Math.floor((Date.now() - new Date(avisoAtual.created_at).getTime()) / 1000)
    : 0;
  const aguardandoVoz =
    audioReady &&
    avisoAtual &&
    !spokenIds.has(avisoAtual.id) &&
    segundosDesdeCriacao < 10;
  const segundosParaVoz = aguardandoVoz ? Math.max(0, 10 - segundosDesdeCriacao) : 0;

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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
          {/* Main aviso */}
          <div className="relative min-h-[55vh] flex flex-col items-center justify-center p-8 md:p-16 text-center overflow-hidden bg-card">
            {avisoAtual ? (
              <div
                key={`${avisoAtual.id}-${pulse}`}
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
                  {selectedId && selectedId !== avisos[0]?.id
                    ? "Reproduzindo do histórico"
                    : "Comunicado recebido"}{" "}
                  · {tempoRelativo(avisoAtual.created_at)}
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-black leading-[0.85] tracking-tighter mb-6 md:mb-10 uppercase break-words max-w-full text-brand-deep">
                  {avisoAtual.titulo}
                </h2>
                <p className="text-xl md:text-3xl font-medium text-brand-deep/70 max-w-3xl mx-auto leading-snug">
                  {avisoAtual.mensagem}
                </p>

                {aguardandoVoz && (
                  <div
                    className="mt-6 text-[10px] font-mono uppercase tracking-[0.3em]"
                    style={{ color: cor.accent }}
                  >
                    🔈 Voz automática em {segundosParaVoz}s
                  </div>
                )}

                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  {audioReady && (
                    <button
                      type="button"
                      onClick={() => falarAviso(avisoAtual)}
                      className="px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                      style={{ background: cor.accent }}
                    >
                      🔁 Reproduzir agora
                    </button>
                  )}
                  {selectedId && avisos[0] && selectedId !== avisos[0].id && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2 hover:scale-105 transition-transform text-brand-deep"
                      style={{ borderColor: cor.accent }}
                    >
                      ↩ Voltar ao mais recente
                    </button>
                  )}
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
                  Os comunicados enviados pela gestão aparecem aqui em tempo real, com som e voz
                  automática 10 segundos depois.
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
                Histórico · clique p/ ouvir
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {avisos.length}
              </span>
            </div>
            {historico.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Avisos anteriores aparecem aqui.
              </p>
            ) : (
              <ul className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                {historico.map((a) => {
                  const isSelected = a.id === selectedId;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(a.id);
                          setPulse((p) => p + 1);
                          if (audioReady) falarAviso(a);
                        }}
                        className={`w-full text-left rounded-xl bg-card border-2 p-3 hover:shadow-md hover:scale-[1.02] transition-all animate-fade-in ${
                          isSelected ? "" : "border-border"
                        }`}
                        style={isSelected ? { borderColor: cor.accent } : undefined}
                      >
                        <p className="text-sm font-bold text-brand-deep truncate uppercase tracking-tight">
                          {a.titulo}
                        </p>
                        <p className="text-xs text-brand-deep/70 line-clamp-2 mt-0.5">
                          {a.mensagem}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {tempoRelativo(a.created_at)}
                          </p>
                          <span
                            className="text-[10px] font-mono uppercase tracking-widest font-bold"
                            style={{ color: cor.accent }}
                          >
                            ▶ ouvir
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>

        <div className="h-2 md:h-3 w-full" style={{ background: cor.accent }} />
      </div>
    </div>
  );
}
