import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SophieNav } from "@/components/SophieNav";
import { criarContaGestao, entrarNaGestao, type PerfilGestao } from "@/lib/gestao-auth";

type Modo = "login" | "cadastro";

const PERFIS: { id: PerfilGestao; titulo: string; descricao: string }[] = [
  {
    id: "professor",
    titulo: "Professor",
    descricao: "Envia avisos para salas e cursos.",
  },
  {
    id: "diretora",
    titulo: "Diretora",
    descricao: "Acesso total ao painel de comunicados.",
  },
];

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
  const [perfil, setPerfil] = useState<PerfilGestao | null>(null);
  const [modo, setModo] = useState<Modo>("login");
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
    if (!perfil) {
      setErro("Escolha Professor ou Diretora antes de continuar.");
      return;
    }

    setErro(null);
    setInfo(null);
    setLoading(true);

    try {
      if (modo === "cadastro") {
        const result = await criarContaGestao(email.trim(), senha, perfil);
        if (!result.ok) {
          setErro(result.error);
          return;
        }
        setInfo(`Conta criada como ${result.role}. Redirecionando…`);
        navigate({ to: "/gestao/painel" });
      } else {
        const result = await entrarNaGestao(email.trim(), senha);
        if (!result.ok) {
          setErro(result.error);
          return;
        }
        navigate({ to: "/gestao/painel" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-brand-deep">
      <SophieNav />

      <section className="max-w-3xl mx-auto px-6 md:px-8 py-16 md:py-24">
        <div className="mb-10 text-center animate-slide-up">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light mb-3">
            Acesso Restrito
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Gestão Escolar</h1>
          <p className="text-muted-foreground mt-3">
            Crie uma conta ou entre como <strong>Professor</strong> ou <strong>Diretora</strong>{" "}
            para enviar avisos às salas.
          </p>
        </div>

        {!perfil && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid sm:grid-cols-2 gap-4">
              {PERFIS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPerfil(p.id)}
                  className="p-8 border-4 border-brand-deep rounded-[1.5rem] hover:bg-brand-deep hover:text-primary-foreground transition-colors text-left"
                >
                  <div className="text-xs font-mono uppercase tracking-widest opacity-60 mb-2">
                    Sou
                  </div>
                  <div className="text-3xl font-black">{p.titulo}</div>
                  <p className="text-sm mt-3 opacity-80">{p.descricao}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {perfil && (
          <form
            onSubmit={submit}
            className="bg-card border-4 border-brand-deep p-8 md:p-10 rounded-[2rem] space-y-6 animate-slide-up"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-brand-light">
                  Perfil selecionado
                </div>
                <div className="text-2xl font-black capitalize">
                  {perfil === "professor" ? "Professor" : "Diretora"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPerfil(null);
                  setErro(null);
                  setInfo(null);
                }}
                className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-deep"
              >
                Trocar
              </button>
            </div>

            <p className="text-sm text-muted-foreground border-l-4 border-brand-light pl-4">
              Passo 2 — {modo === "cadastro" ? "Crie sua conta escolar" : "Entre com email e senha"}
            </p>

            <div className="flex gap-2 text-xs font-mono uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setModo("login")}
                className={`px-3 py-1 rounded-full ${modo === "login" ? "bg-brand-deep text-primary-foreground" : "text-muted-foreground"}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setModo("cadastro")}
                className={`px-3 py-1 rounded-full ${modo === "cadastro" ? "bg-brand-deep text-primary-foreground" : "text-muted-foreground"}`}
              >
                Criar conta
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="gestao-email"
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
              >
                Email escolar
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
                autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
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
              {loading
                ? "Aguarde…"
                : modo === "login"
                  ? "Entrar no painel"
                  : "Criar conta e entrar"}
            </button>

            <Link
              to="/"
              className="block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-brand-deep"
            >
              ← Voltar ao início
            </Link>
          </form>
        )}
      </section>
    </div>
  );
}
