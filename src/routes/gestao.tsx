import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SophieNav } from "@/components/SophieNav";
import { entrarNaGestao } from "@/lib/gestao-auth";
import { criarPrimeiraDiretora } from "@/lib/gestao-admin.functions";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Gestão Escolar — SOPHIE" },
      {
        name: "description",
        content: "Acesso restrito para professores e diretoria enviarem avisos às salas.",
      },
    ],
  }),
  component: GestaoPage,
});

function GestaoPage() {
  const navigate = useNavigate();
  const bootstrap = useServerFn(criarPrimeiraDiretora);
  const [modo, setModo] = useState<"login" | "bootstrap">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/gestao/painel" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setInfo(null);
    setLoading(true);

    try {
      if (modo === "bootstrap") {
        try {
          await bootstrap({ data: { email: email.trim(), senha } });
        } catch (err) {
          setErro(err instanceof Error ? err.message : "Falha ao criar conta.");
          return;
        }
        setInfo("Diretora cadastrada. Entrando…");
      }

      const result = await entrarNaGestao(email.trim(), senha);
      if (!result.ok) {
        setErro(result.error);
        return;
      }
      navigate({ to: "/gestao/painel" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-brand-deep">
      <SophieNav />

      <section className="max-w-md mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="mb-10 text-center animate-slide-up">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light mb-3">
            Acesso Restrito
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Gestão Escolar</h1>
          <p className="text-muted-foreground mt-3">
            {modo === "login"
              ? "Entre com a conta fornecida pela diretora."
              : "Cadastre a primeira diretora desta escola."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-card border-4 border-brand-deep p-8 md:p-10 rounded-[2rem] space-y-6 animate-slide-up"
        >
          <div className="space-y-2">
            <label
              htmlFor="gestao-email"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              Email
            </label>
            <input
              id="gestao-email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-brand-deep/10 rounded-xl bg-surface focus:outline-none focus:border-brand-deep"
              placeholder="nome@escola.edu.br"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="gestao-senha"
              className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
            >
              Senha (mínimo 6 caracteres)
            </label>
            <input
              id="gestao-senha"
              required
              type="password"
              minLength={6}
              autoComplete={modo === "bootstrap" ? "new-password" : "current-password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 border-2 border-brand-deep/10 rounded-xl bg-surface focus:outline-none focus:border-brand-deep"
              placeholder="••••••••"
            />
          </div>

          {erro && <div className="text-sm text-destructive font-medium">{erro}</div>}
          {info && <div className="text-sm text-brand-deep font-medium">{info}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-brand-deep text-primary-foreground font-bold rounded-full hover:bg-foreground transition-colors disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {loading ? "Aguarde…" : modo === "login" ? "Entrar" : "Criar diretora e entrar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setModo(modo === "login" ? "bootstrap" : "login");
              setErro(null);
              setInfo(null);
            }}
            className="block w-full text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-deep"
          >
            {modo === "login"
              ? "Primeira vez? Cadastrar diretora →"
              : "← Já tenho conta, entrar"}
          </button>

          <Link
            to="/"
            className="block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-deep"
          >
            ← Voltar ao início
          </Link>
        </form>
      </section>
    </div>
  );
}
