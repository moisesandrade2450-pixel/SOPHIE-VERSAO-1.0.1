import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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

function SalaPage() {
  const { salaId } = useParams({ from: "/salas_/$salaId" });
  const idNum = Number(salaId);
  const sala = useMemo(() => findSala(idNum), [idNum]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [now, setNow] = useState("");

  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 30_000);
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
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) setAviso(data as Aviso);
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
          setAviso(novo);
          if (audioReady) {
            playChime();
            setTimeout(() => speak(`${novo.titulo}. ${novo.mensagem}`), 700);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [idNum, sala, audioReady]);

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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background"
      style={{ backgroundImage: `radial-gradient(circle at 20% 0%, ${cor.tint}, transparent 60%)` }}
    >
      <div
        className="w-full max-w-6xl aspect-video bg-card rounded-3xl overflow-hidden shadow-2xl flex flex-col border-4"
        style={{ borderColor: cor.accent }}
      >
        <div
          className="px-6 md:px-10 py-4 md:py-6 flex justify-between items-center text-white"
          style={{ background: cor.accent }}
        >
          <div className="flex items-center gap-3 md:gap-4">
            <div className="size-3 md:size-4 rounded-full bg-white animate-pulse" />
            <span className="font-mono font-bold tracking-tighter text-sm md:text-base">
              {sala.sigla} — SALA {String(sala.id).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono opacity-80 text-sm">{now}</span>
            <Link
              to="/salas"
              className="text-xs font-mono uppercase tracking-widest opacity-90 hover:opacity-100 hover:underline"
            >
              ← Salas
            </Link>
            <Link
              to="/gestao/painel"
              className="text-xs font-mono uppercase tracking-widest opacity-90 hover:opacity-100 hover:underline"
            >
              Painel →
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center overflow-hidden bg-card">
          {aviso ? (
            <>
              <div
                className="text-xs font-mono mb-6 md:mb-8 uppercase tracking-[0.4em]"
                style={{ color: cor.accent }}
              >
                Comunicado recebido
              </div>
              <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-black leading-[0.85] tracking-tighter mb-6 md:mb-10 uppercase break-words max-w-full text-brand-deep">
                {aviso.titulo}
              </h2>
              <p className="text-xl md:text-3xl font-medium text-brand-deep/70 max-w-3xl leading-snug">
                {aviso.mensagem}
              </p>
            </>
          ) : (
            <>
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
              <p className="mt-6 text-sm md:text-base text-muted-foreground max-w-md">
                Os comunicados enviados pela gestão aparecem aqui em tempo real, com som e voz.
              </p>
              {!audioReady && (
                <button
                  type="button"
                  onClick={() => {
                    setAudioReady(true);
                    playChime();
                  }}
                  className="mt-10 px-6 py-3 rounded-full text-white text-sm font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform shadow-lg"
                  style={{ background: cor.accent }}
                >
                  Ativar som e voz
                </button>
              )}
            </>
          )}
        </div>

        <div className="h-2 md:h-3 w-full" style={{ background: cor.accent }} />
      </div>
    </div>
  );
}
