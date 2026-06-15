import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SophieNav } from "@/components/SophieNav";
import { CURSOS, SALAS, salasPorCurso, CURSO_CORES } from "@/lib/salas";

type Destino =
  | { tipo: "todas" }
  | { tipo: "curso"; curso: (typeof CURSOS)[number] }
  | { tipo: "sala"; salaId: number };

interface Template {
  titulo: string;
  mensagem: string;
  emoji: string;
}

const TEMPLATES: Template[] = [
  { emoji: "🔔", titulo: "Recreio", mensagem: "Atenção, está iniciando o horário do recreio." },
  { emoji: "🏁", titulo: "Saída", mensagem: "Atenção, horário de saída. Boa tarde a todos." },
  { emoji: "📢", titulo: "Reunião", mensagem: "Professores e alunos, dirijam-se ao auditório." },
  {
    emoji: "🚨",
    titulo: "Emergência",
    mensagem: "Mantenham a calma e sigam as orientações da equipe.",
  },
  { emoji: "📚", titulo: "Prova", mensagem: "Atenção, preparem-se para a aplicação da prova." },
  {
    emoji: "🎉",
    titulo: "Evento",
    mensagem: "Atenção, está iniciando o evento. Compareçam ao local indicado.",
  },
];

export const Route = createFileRoute("/gestao_/painel")({
  head: () => ({
    meta: [{ title: "Painel da Gestão — SOPHIE" }, { name: "robots", content: "noindex" }],
  }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [destino, setDestino] = useState<Destino>({ tipo: "todas" });
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const aplicar = (s: Session | null) => {
      if (!s) {
        setSession(null);
        navigate({ to: "/gestao" });
        return;
      }
      setSession(s);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => aplicar(s));
    supabase.auth.getSession().then(({ data }) => aplicar(data.session));
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const salasAlvo = useMemo(() => {
    if (destino.tipo === "todas") return SALAS.map((s) => s.id);
    if (destino.tipo === "curso") return salasPorCurso(destino.curso).map((s) => s.id);
    return [destino.salaId];
  }, [destino]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setErro(null);
    setFeedback(null);
    setEnviando(true);

    const rows = salasAlvo.map((sala_id) => ({
      sala_id,
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      enviado_por: session.user.id,
    }));

    const { error } = await supabase.from("avisos").insert(rows);
    setEnviando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setFeedback(`✅ Aviso enviado para ${salasAlvo.length} sala(s).`);
    setTitulo("");
    setMensagem("");
    setTimeout(() => setFeedback(null), 4000);
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/gestao" });
  };

  const aplicarTemplate = (t: Template) => {
    setTitulo(t.titulo);
    setMensagem(t.mensagem);
  };

  if (!session) return null;

  const destinoLabel =
    destino.tipo === "todas"
      ? "Todas as salas"
      : destino.tipo === "curso"
        ? `Curso ${destino.curso}`
        : `Sala ${destino.salaId}`;

  return (
    <div className="min-h-screen bg-background text-brand-deep">
      <SophieNav />

      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light mb-2">
              Gestão Escolar
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Compor Aviso</h1>
            <p className="text-muted-foreground text-sm mt-1">{session.user.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/salas"
              className="px-4 py-2 rounded-full border-2 border-brand-deep/20 text-xs font-bold uppercase tracking-widest hover:bg-brand-deep/5"
            >
              Ver salas
            </Link>
            <button
              type="button"
              onClick={sair}
              className="px-4 py-2 rounded-full border-2 border-brand-deep/20 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-brand-deep hover:text-primary-foreground transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          {/* FORM */}
          <form
            onSubmit={enviar}
            className="bg-card border-4 border-brand-deep p-6 md:p-10 rounded-[2rem] space-y-8"
          >
            {/* Templates rápidos */}
            <div>
              <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-3 block">
                Modelos rápidos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.titulo}
                    type="button"
                    onClick={() => aplicarTemplate(t)}
                    className="text-left p-3 rounded-xl border-2 border-brand-deep/10 hover:border-brand-deep hover:bg-brand-deep/5 transition-all hover:scale-[1.02]"
                  >
                    <div className="text-2xl">{t.emoji}</div>
                    <div className="text-sm font-bold uppercase tracking-tight mt-1">
                      {t.titulo}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Destino */}
            <div>
              <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-3 block">
                Destino · {salasAlvo.length} sala(s)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setDestino({ tipo: "todas" })}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2 transition-all ${
                    destino.tipo === "todas"
                      ? "bg-brand-deep text-primary-foreground border-brand-deep"
                      : "border-brand-deep/15 hover:border-brand-deep"
                  }`}
                >
                  🌐 Todas
                </button>
                {CURSOS.map((c) => {
                  const ativo = destino.tipo === "curso" && destino.curso === c;
                  const cor = CURSO_CORES[c];
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDestino({ tipo: "curso", curso: c })}
                      className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border-2 transition-all"
                      style={{
                        borderColor: cor.accent,
                        background: ativo ? cor.accent : "transparent",
                        color: ativo ? "#fff" : cor.accent,
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <select
                value={destino.tipo === "sala" ? String(destino.salaId) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setDestino({ tipo: "sala", salaId: Number(v) });
                }}
                className="w-full p-3 border-2 border-brand-deep/10 rounded-xl text-sm font-bold bg-surface focus:outline-none focus:border-brand-deep"
              >
                <option value="">— ou escolha uma sala específica —</option>
                {SALAS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {s.sigla}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                  Título
                </label>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {titulo.length}/120
                </span>
              </div>
              <input
                required
                maxLength={120}
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: RECREIO"
                className="w-full text-3xl md:text-4xl font-black tracking-tighter border-b-2 border-border py-3 focus:outline-none focus:border-brand-deep placeholder:text-border bg-transparent uppercase"
              />
            </div>

            {/* Mensagem */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                  Mensagem
                </label>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                  {mensagem.length}/500
                </span>
              </div>
              <textarea
                required
                maxLength={500}
                rows={3}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite a mensagem que será exibida e falada nas salas..."
                className="w-full text-lg md:text-xl border-2 border-border rounded-xl p-3 focus:outline-none focus:border-brand-deep resize-none placeholder:text-border bg-transparent"
              />
            </div>

            {erro && (
              <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                ⚠ {erro}
              </div>
            )}
            {feedback && (
              <div className="text-sm text-brand-deep font-bold bg-green-100 p-3 rounded-lg animate-fade-in">
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando || !titulo.trim() || !mensagem.trim()}
              className="w-full px-8 py-5 bg-brand-deep text-primary-foreground font-black uppercase tracking-widest rounded-2xl hover:bg-foreground transition-all disabled:opacity-50 hover:scale-[1.01] text-lg"
            >
              {enviando ? "Enviando..." : `📡 Enviar para ${destinoLabel}`}
            </button>
          </form>

          {/* PREVIEW */}
          <aside className="space-y-4">
            <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
              Pré-visualização
            </div>
            <div className="bg-brand-deep text-primary-foreground rounded-3xl p-6 min-h-[280px] flex flex-col justify-between border-4 border-brand-deep shadow-xl">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-70 flex items-center gap-2">
                <span className="size-2 bg-white rounded-full animate-pulse" />
                Como aparece na sala
              </div>
              <div className="text-center py-6">
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none break-words">
                  {titulo || "Título"}
                </h2>
                <p className="text-sm opacity-80 mt-3 leading-snug">
                  {mensagem || "A mensagem aparecerá aqui..."}
                </p>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                🔈 Voz automática 10s após envio
              </div>
            </div>

            <div className="bg-brand-light/5 border border-brand-light/20 rounded-2xl p-4">
              <div className="text-[10px] font-mono uppercase text-brand-light mb-2 tracking-widest">
                Destino
              </div>
              <div className="text-sm font-bold">{destinoLabel}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {salasAlvo.length} terminal(is) receberão este aviso
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
