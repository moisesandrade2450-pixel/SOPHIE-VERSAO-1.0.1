import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SophieNav } from "@/components/SophieNav";
import { CURSOS, SALAS, salasPorCurso, CURSO_CORES, findSala } from "@/lib/salas";

type Destino =
  | { tipo: "todas" }
  | { tipo: "curso"; curso: (typeof CURSOS)[number] }
  | { tipo: "sala"; salaId: number };

type Aba = "agora" | "agendados" | "calendario";
type TipoAg = "unico" | "diario" | "semanal";

interface Template {
  titulo: string;
  mensagem: string;
  emoji: string;
}

interface Agendamento {
  id: string;
  titulo: string;
  mensagem: string;
  sala_ids: number[];
  tipo: TipoAg;
  data_unica: string | null;
  horarios: string[] | null;
  dias_semana: number[] | null;
  ativo: boolean;
  ultima_execucao: string | null;
  created_at: string;
}

const TEMPLATES: Template[] = [
  { emoji: "🔔", titulo: "Recreio", mensagem: "Atenção, está iniciando o horário do recreio." },
  { emoji: "🏁", titulo: "Saída", mensagem: "Atenção, horário de saída. Boa tarde a todos." },
  { emoji: "📢", titulo: "Reunião", mensagem: "Professores e alunos, dirijam-se ao auditório." },
  { emoji: "🚨", titulo: "Emergência", mensagem: "Mantenham a calma e sigam as orientações da equipe." },
  { emoji: "📚", titulo: "Prova", mensagem: "Atenção, preparem-se para a aplicação da prova." },
  { emoji: "🎉", titulo: "Evento", mensagem: "Atenção, está iniciando o evento. Compareçam ao local indicado." },
];

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const Route = createFileRoute("/gestao_/painel")({
  head: () => ({
    meta: [{ title: "Painel da Gestão — SOPHIE" }, { name: "robots", content: "noindex" }],
  }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [aba, setAba] = useState<Aba>("agora");

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

  const sair = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/gestao" });
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background text-brand-deep">
      <SophieNav />
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light mb-2">
              Gestão Escolar
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Painel de Avisos</h1>
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

        {/* TABS */}
        <div className="flex gap-1 p-1 bg-brand-deep/5 rounded-full w-fit mb-8 border border-brand-deep/10">
          {(
            [
              { id: "agora", label: "⚡ Enviar agora" },
              { id: "agendados", label: "🗓 Agendados" },
              { id: "calendario", label: "📅 Calendário" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={`px-4 md:px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                aba === t.id
                  ? "bg-brand-deep text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-brand-deep"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {aba === "agora" && <EnviarAgora session={session} />}
        {aba === "agendados" && <ListaAgendados session={session} />}
        {aba === "calendario" && <Calendario session={session} />}
      </section>
    </div>
  );
}

/* ===================== ENVIAR AGORA + AGENDAR ===================== */

function EnviarAgora({ session }: { session: Session }) {
  const [destino, setDestino] = useState<Destino>({ tipo: "todas" });
  const [salasExtras, setSalasExtras] = useState<Set<number>>(new Set());
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Agendamento
  const [modoAgendar, setModoAgendar] = useState(false);
  const [tipoAg, setTipoAg] = useState<TipoAg>("unico");
  const [dataUnica, setDataUnica] = useState("");
  const [horaUnica, setHoraUnica] = useState("");
  const [horarios, setHorarios] = useState<string[]>([""]);
  const [diasSemana, setDiasSemana] = useState<Set<number>>(new Set());

  const salasAlvo = useMemo(() => {
    const base =
      destino.tipo === "todas"
        ? SALAS.map((s) => s.id)
        : destino.tipo === "curso"
          ? salasPorCurso(destino.curso).map((s) => s.id)
          : [destino.salaId];
    return Array.from(new Set([...base, ...salasExtras]));
  }, [destino, salasExtras]);

  const aplicarTemplate = (t: Template) => {
    setTitulo(t.titulo);
    setMensagem(t.mensagem);
  };

  const toggleExtra = (id: number) => {
    setSalasExtras((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleDia = (d: number) => {
    setDiasSemana((prev) => {
      const n = new Set(prev);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });
  };

  const limpar = () => {
    setTitulo("");
    setMensagem("");
    setDataUnica("");
    setHoraUnica("");
    setHorarios([""]);
    setDiasSemana(new Set());
    setSalasExtras(new Set());
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setFeedback(null);
    setEnviando(true);

    try {
      if (!modoAgendar) {
        const rows = salasAlvo.map((sala_id) => ({
          sala_id,
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          enviado_por: session.user.id,
        }));
        const { error } = await supabase.from("avisos").insert(rows);
        if (error) throw error;
        setFeedback(`✅ Enviado para ${salasAlvo.length} sala(s).`);
      } else {
        const horariosLimpos = horarios.filter((h) => h.length === 5);
        if (tipoAg !== "unico" && horariosLimpos.length === 0) {
          throw new Error("Adicione pelo menos um horário.");
        }
        if (tipoAg === "semanal" && diasSemana.size === 0) {
          throw new Error("Selecione pelo menos um dia da semana.");
        }
        if (tipoAg === "unico" && (!dataUnica || !horaUnica)) {
          throw new Error("Defina a data e o horário.");
        }

        const payload: {
          titulo: string;
          mensagem: string;
          sala_ids: number[];
          tipo: TipoAg;
          enviado_por: string;
          data_unica: string | null;
          horarios: string[] | null;
          dias_semana: number[] | null;
        } = {
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          sala_ids: salasAlvo,
          tipo: tipoAg,
          enviado_por: session.user.id,
          data_unica: tipoAg === "unico" ? new Date(`${dataUnica}T${horaUnica}`).toISOString() : null,
          horarios: tipoAg !== "unico" ? horariosLimpos.map((h) => `${h}:00`) : null,
          dias_semana: tipoAg === "semanal" ? Array.from(diasSemana).sort() : null,
        };

        const { error } = await supabase.from("avisos_agendados").insert(payload);
        if (error) throw error;
        setFeedback(`📅 Agendado para ${salasAlvo.length} sala(s).`);
      }
      limpar();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setEnviando(false);
    }
  };

  const destinoLabel =
    destino.tipo === "todas"
      ? "Todas as salas"
      : destino.tipo === "curso"
        ? `Curso ${destino.curso}`
        : `Sala ${destino.salaId}`;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 animate-fade-in">
      <form
        onSubmit={enviar}
        className="bg-card border-4 border-brand-deep p-6 md:p-10 rounded-[2rem] space-y-8"
      >
        {/* Templates */}
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
                <div className="text-sm font-bold uppercase tracking-tight mt-1">{t.titulo}</div>
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

          <details className="border-2 border-brand-deep/10 rounded-xl">
            <summary className="cursor-pointer p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-brand-deep">
              + Adicionar salas específicas ({salasExtras.size})
            </summary>
            <div className="p-3 pt-0 grid grid-cols-3 md:grid-cols-4 gap-2">
              {SALAS.map((s) => {
                const ativo = salasExtras.has(s.id);
                const cor = CURSO_CORES[s.curso];
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleExtra(s.id)}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all"
                    style={{
                      borderColor: cor.accent,
                      background: ativo ? cor.accent : "transparent",
                      color: ativo ? "#fff" : cor.accent,
                    }}
                  >
                    {s.sigla}
                  </button>
                );
              })}
            </div>
          </details>
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

        {/* Modo: agora ou agendar */}
        <div className="border-2 border-brand-deep/10 rounded-2xl p-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModoAgendar(false)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                !modoAgendar
                  ? "bg-brand-deep text-primary-foreground"
                  : "border-2 border-brand-deep/10 text-muted-foreground"
              }`}
            >
              ⚡ Enviar agora
            </button>
            <button
              type="button"
              onClick={() => setModoAgendar(true)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                modoAgendar
                  ? "bg-brand-deep text-primary-foreground"
                  : "border-2 border-brand-deep/10 text-muted-foreground"
              }`}
            >
              ⏰ Agendar
            </button>
          </div>

          {modoAgendar && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-2">
                {(["unico", "diario", "semanal"] as TipoAg[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoAg(t)}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border-2 transition-all ${
                      tipoAg === t
                        ? "bg-brand-deep text-primary-foreground border-brand-deep"
                        : "border-brand-deep/10 text-muted-foreground"
                    }`}
                  >
                    {t === "unico" ? "Único" : t === "diario" ? "Diário" : "Semanal"}
                  </button>
                ))}
              </div>

              {tipoAg === "unico" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                      Data
                    </label>
                    <input
                      type="date"
                      value={dataUnica}
                      onChange={(e) => setDataUnica(e.target.value)}
                      className="w-full mt-1 p-3 border-2 border-brand-deep/10 rounded-xl focus:outline-none focus:border-brand-deep bg-surface"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={horaUnica}
                      onChange={(e) => setHoraUnica(e.target.value)}
                      className="w-full mt-1 p-3 border-2 border-brand-deep/10 rounded-xl focus:outline-none focus:border-brand-deep bg-surface"
                    />
                  </div>
                </div>
              )}

              {tipoAg !== "unico" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-2 block">
                      Horários ({horarios.filter((h) => h).length})
                    </label>
                    <div className="space-y-2">
                      {horarios.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="time"
                            value={h}
                            onChange={(e) => {
                              const n = [...horarios];
                              n[i] = e.target.value;
                              setHorarios(n);
                            }}
                            className="flex-1 p-2.5 border-2 border-brand-deep/10 rounded-lg focus:outline-none focus:border-brand-deep bg-surface"
                          />
                          {horarios.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setHorarios(horarios.filter((_, j) => j !== i))}
                              className="px-3 rounded-lg border-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setHorarios([...horarios, ""])}
                        className="w-full p-2 rounded-lg border-2 border-dashed border-brand-deep/20 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-brand-deep hover:text-brand-deep"
                      >
                        + Horário
                      </button>
                    </div>
                  </div>

                  {tipoAg === "semanal" && (
                    <div>
                      <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest mb-2 block">
                        Dias da semana
                      </label>
                      <div className="flex gap-1">
                        {DIAS.map((d, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleDia(i)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              diasSemana.has(i)
                                ? "bg-brand-deep text-primary-foreground"
                                : "border-2 border-brand-deep/10 text-muted-foreground"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
          {enviando
            ? "Salvando..."
            : modoAgendar
              ? `📅 Agendar para ${destinoLabel}`
              : `📡 Enviar para ${destinoLabel}`}
        </button>
      </form>

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
          {salasExtras.size > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              + {salasExtras.size} extra(s)
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {salasAlvo.length} terminal(is) receberão este aviso
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ===================== LISTA DE AGENDADOS ===================== */

function useAgendamentos(session: Session) {
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("avisos_agendados")
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as Agendamento[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
    const ch = supabase
      .channel("avisos_agendados_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avisos_agendados" },
        () => carregar(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [carregar, session.user.id]);

  return { items, loading, recarregar: carregar };
}

function descreverAg(a: Agendamento): string {
  if (a.tipo === "unico" && a.data_unica) {
    const d = new Date(a.data_unica);
    return `Único · ${d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`;
  }
  const horas = (a.horarios ?? []).map((h) => h.slice(0, 5)).join(", ");
  if (a.tipo === "diario") return `Diário · ${horas}`;
  const dias = (a.dias_semana ?? []).map((d) => DIAS[d]).join(" ");
  return `Semanal · ${dias} · ${horas}`;
}

function ListaAgendados({ session }: { session: Session }) {
  const { items, loading } = useAgendamentos(session);

  const apagar = async (id: string) => {
    if (!confirm("Apagar este agendamento?")) return;
    await supabase.from("avisos_agendados").delete().eq("id", id);
  };

  const toggleAtivo = async (a: Agendamento) => {
    await supabase.from("avisos_agendados").update({ ativo: !a.ativo }).eq("id", a.id);
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-card border-2 border-dashed border-brand-deep/15 rounded-3xl animate-fade-in">
        <div className="text-5xl mb-3">🗓</div>
        <h3 className="text-xl font-black tracking-tight">Nenhum aviso agendado</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vá em "Enviar agora", clique em "⏰ Agendar" e defina o horário.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
      {items.map((a) => (
        <article
          key={a.id}
          className={`bg-card border-2 rounded-2xl p-5 transition-all ${
            a.ativo ? "border-brand-deep/20" : "border-muted opacity-60"
          }`}
        >
          <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-brand-light">
                {descreverAg(a)}
              </div>
              <h3 className="text-xl font-black tracking-tight uppercase mt-1 break-words">
                {a.titulo}
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => toggleAtivo(a)}
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                  a.ativo
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
                }`}
                title={a.ativo ? "Pausar" : "Ativar"}
              >
                {a.ativo ? "● Ativo" : "○ Pausado"}
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{a.mensagem}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {a.sala_ids.slice(0, 6).map((id) => {
              const s = findSala(id);
              if (!s) return null;
              const cor = CURSO_CORES[s.curso];
              return (
                <span
                  key={id}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: cor.tint, color: cor.accent }}
                >
                  {s.sigla}
                </span>
              );
            })}
            {a.sala_ids.length > 6 && (
              <span className="text-[10px] text-muted-foreground font-bold">
                +{a.sala_ids.length - 6}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {a.ultima_execucao
                ? `Última: ${new Date(a.ultima_execucao).toLocaleString("pt-BR")}`
                : "Nunca disparado"}
            </span>
            <button
              onClick={() => apagar(a.id)}
              className="text-destructive hover:underline text-[11px] font-bold uppercase tracking-widest"
            >
              Apagar
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ===================== CALENDÁRIO ===================== */

function Calendario({ session }: { session: Session }) {
  const { items } = useAgendamentos(session);
  const [mesRef, setMesRef] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const ano = mesRef.getFullYear();
  const mes = mesRef.getMonth();
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();

  const eventosPorDia = useMemo(() => {
    const map = new Map<number, Agendamento[]>();
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes, dia);
      const dow = data.getDay();
      const ehHoje =
        data.toDateString() === hoje.toDateString();
      const futuro = data >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const lista: Agendamento[] = [];
      for (const a of items) {
        if (!a.ativo) continue;
        if (a.tipo === "unico" && a.data_unica) {
          const d = new Date(a.data_unica);
          if (d.getFullYear() === ano && d.getMonth() === mes && d.getDate() === dia) {
            lista.push(a);
          }
        } else if (a.tipo === "diario" && (futuro || ehHoje)) {
          lista.push(a);
        } else if (a.tipo === "semanal" && (a.dias_semana ?? []).includes(dow) && (futuro || ehHoje)) {
          lista.push(a);
        }
      }
      if (lista.length) map.set(dia, lista);
    }
    return map;
  }, [items, ano, mes, diasNoMes, hoje]);

  const nomeMes = mesRef.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setMesRef(new Date(ano, mes - 1, 1))}
          className="px-4 py-2 rounded-full border-2 border-brand-deep/15 hover:border-brand-deep text-xs font-bold uppercase tracking-widest"
        >
          ← Anterior
        </button>
        <h2 className="text-2xl md:text-3xl font-black capitalize tracking-tight">{nomeMes}</h2>
        <button
          onClick={() => setMesRef(new Date(ano, mes + 1, 1))}
          className="px-4 py-2 rounded-full border-2 border-brand-deep/15 hover:border-brand-deep text-xs font-bold uppercase tracking-widest"
        >
          Próximo →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DIAS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: primeiroDia }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: diasNoMes }).map((_, i) => {
          const dia = i + 1;
          const ev = eventosPorDia.get(dia) ?? [];
          const ehHoje =
            ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate();
          return (
            <div
              key={dia}
              className={`min-h-[90px] p-2 rounded-xl border-2 transition-all ${
                ehHoje
                  ? "border-brand-deep bg-brand-deep/5"
                  : ev.length > 0
                    ? "border-brand-deep/30 bg-card hover:border-brand-deep"
                    : "border-brand-deep/5 bg-card/50"
              }`}
            >
              <div
                className={`text-xs font-bold mb-1 ${
                  ehHoje ? "text-brand-deep" : "text-muted-foreground"
                }`}
              >
                {dia}
              </div>
              <div className="space-y-0.5">
                {ev.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    title={`${a.titulo} — ${descreverAg(a)}`}
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-deep text-primary-foreground truncate"
                  >
                    {a.tipo === "unico" && a.data_unica
                      ? new Date(a.data_unica).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : (a.horarios?.[0]?.slice(0, 5) ?? "")}{" "}
                    {a.titulo}
                  </div>
                ))}
                {ev.length > 3 && (
                  <div className="text-[9px] text-muted-foreground font-bold">
                    +{ev.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
