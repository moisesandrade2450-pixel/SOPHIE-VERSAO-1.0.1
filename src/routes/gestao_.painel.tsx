import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SophieNav } from "@/components/SophieNav";
import { CURSOS, SALAS, salasPorCurso } from "@/lib/salas";
import {
  obterPerfilUsuario,
  podeEnviarAvisos,
  type PerfilGestao,
} from "@/lib/gestao-auth";
import { criarContaPeloPainel } from "@/lib/gestao-admin.functions";

type Destino =
  | { tipo: "todas" }
  | { tipo: "curso"; curso: string }
  | { tipo: "sala"; salaId: number };

export const Route = createFileRoute("/gestao_/painel")({
  head: () => ({
    meta: [{ title: "Painel da Gestão — SOPHIE" }, { name: "robots", content: "noindex" }],
  }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilGestao | null>(null);
  const [destino, setDestino] = useState<Destino>({ tipo: "todas" });
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const validarSessao = async (s: Session | null) => {
      if (!s) {
        setSession(null);
        setPerfil(null);
        navigate({ to: "/gestao" });
        return;
      }
      const role = await obterPerfilUsuario(s.user.id);
      if (!role) {
        await supabase.auth.signOut();
        setSession(null);
        setPerfil(null);
        navigate({ to: "/gestao" });
        return;
      }
      setSession(s);
      setPerfil(role);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void validarSessao(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      void validarSessao(data.session);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setErro(null);
    setFeedback(null);
    setEnviando(true);

    const autorizado = await podeEnviarAvisos(session.user.id);
    if (!autorizado) {
      setEnviando(false);
      setErro(
        "Sua conta não tem perfil de gestão. Em /gestao use Criar conta e escolha Professor ou Diretora.",
      );
      return;
    }

    let salasAlvo: number[] = [];
    if (destino.tipo === "todas") salasAlvo = SALAS.map((s) => s.id);
    else if (destino.tipo === "curso")
      salasAlvo = salasPorCurso(destino.curso as (typeof CURSOS)[number]).map((s) => s.id);
    else salasAlvo = [destino.salaId];

    const rows = salasAlvo.map((sala_id) => ({
      sala_id,
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      enviado_por: session.user.id,
    }));

    const { error } = await supabase.from("avisos").insert(rows);
    setEnviando(false);
    if (error) {
  console.log("ERRO COMPLETO:", error);
  setErro(JSON.stringify(error, null, 2));
  return;
}
    setFeedback(`Aviso enviado para ${salasAlvo.length} sala(s).`);
    setTitulo("");
    setMensagem("");
  };

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/gestao" });
  };

  if (!session || !perfil) return null;

  return (
    <div className="min-h-screen bg-background text-brand-deep">
      <SophieNav />

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20 grid lg:grid-cols-[350px_1fr] gap-8 lg:gap-12">
        <aside className="space-y-8">
          <header>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light mb-2">
              Gestão Escolar
            </p>
            <h1 className="text-3xl font-black tracking-tight">Painel de Gestão</h1>
            <p className="text-muted-foreground text-sm mt-1">{session.user.email}</p>
            <p className="text-xs font-mono uppercase tracking-widest text-brand-light mt-2 capitalize">
              Perfil: {perfil}
            </p>
          </header>

          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
              Selecionar Destino
            </label>
            <select
              value={
                destino.tipo === "todas"
                  ? "todas"
                  : destino.tipo === "curso"
                    ? `curso:${destino.curso}`
                    : `sala:${destino.salaId}`
              }
              onChange={(e) => {
                const v = e.target.value;
                if (v === "todas") setDestino({ tipo: "todas" });
                else if (v.startsWith("curso:")) setDestino({ tipo: "curso", curso: v.slice(6) });
                else if (v.startsWith("sala:"))
                  setDestino({ tipo: "sala", salaId: Number(v.slice(5)) });
              }}
              className="mt-2 w-full p-4 border-2 border-brand-deep/10 rounded-xl font-bold bg-surface focus:outline-none focus:border-brand-deep"
            >
              <option value="todas">Todas as Salas</option>
              <optgroup label="Por curso">
                {CURSOS.map((c) => (
                  <option key={c} value={`curso:${c}`}>
                    Curso: {c}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sala específica">
                {SALAS.map((s) => (
                  <option key={s.id} value={`sala:${s.id}`}>
                    {s.nome} — {s.curso}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="p-6 bg-brand-light/5 border border-brand-light/20 rounded-2xl">
            <div className="text-[10px] font-mono uppercase text-brand-light mb-2 tracking-widest">
              Status do Sistema
            </div>
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="size-2 bg-green-500 rounded-full animate-pulse" />
              Conectado a 12 terminais
            </div>
          </div>

          <button
            type="button"
            onClick={sair}
            className="w-full px-6 py-3 border-2 border-brand-deep/20 rounded-full text-sm font-bold uppercase tracking-widest text-muted-foreground hover:bg-brand-deep hover:text-primary-foreground transition-colors"
          >
            Sair
          </button>

          <Link
            to="/salas"
            className="block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-deep"
          >
            Ver salas →
          </Link>
        </aside>

        <form
          onSubmit={enviar}
          className="bg-card border-4 border-brand-deep p-8 md:p-12 rounded-[2.5rem]"
        >
          <h2 className="text-xl font-bold mb-8">Compor Novo Aviso</h2>
          <div className="space-y-6">
            <input
              required
              maxLength={120}
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do Aviso (Ex: Reunião)"
              className="w-full text-3xl md:text-4xl font-black tracking-tighter border-b-2 border-border py-4 focus:outline-none focus:border-brand-deep placeholder:text-border bg-transparent"
            />
            <textarea
              required
              maxLength={500}
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem principal aqui..."
              className="w-full text-xl md:text-2xl border-none focus:outline-none resize-none placeholder:text-border bg-transparent"
            />

            {erro && <div className="text-sm text-destructive font-medium">{erro}</div>}
            {feedback && <div className="text-sm text-brand-deep font-medium">{feedback}</div>}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={enviando}
                className="px-8 py-4 bg-brand-deep text-primary-foreground font-bold rounded-full hover:bg-foreground transition-colors disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar Imediatamente"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
