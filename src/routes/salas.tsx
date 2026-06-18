import { createFileRoute, Link } from "@tanstack/react-router";
import { SophieNav } from "@/components/SophieNav";
import { CURSOS, salasPorCurso, CURSO_CORES } from "@/lib/salas";

export const Route = createFileRoute("/salas")({
  head: () => ({
    meta: [
      { title: "Salas — SOPHIE" },
      {
        name: "description",
        content:
          "Selecione uma das 12 salas para receber avisos da gestão em tempo real, com voz automática e histórico dos últimos comunicados.",
      },
      { property: "og:title", content: "Salas — SOPHIE" },
      {
        property: "og:description",
        content:
          "12 salas em 4 cursos. Avisos ao vivo, voz automática e histórico para reprodução.",
      },
    ],
  }),
  component: SalasPage,
});

function SalasPage() {
  return (
    <div className="min-h-screen bg-background text-brand-deep">
      <SophieNav />

      <section className="py-16 md:py-24 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 md:mb-16 flex flex-wrap gap-4 justify-between items-end animate-slide-up">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-brand-light mb-3">
                Painel de Salas
              </p>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Escolha sua sala</h1>
              <p className="text-muted-foreground mt-3 max-w-xl">
                Clique em uma das 12 salas abaixo para abrir o{" "}
                <strong className="text-brand-deep">terminal de avisos</strong>. É nessa tela que os
                comunicados da gestão aparecem em tempo real.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full border-2 border-brand-deep/20 hover:border-brand-deep hover:bg-brand-deep hover:text-primary-foreground transition-colors"
              >
                ← Início
              </Link>
              <Link
                to="/gestao/painel"
                className="text-xs font-mono uppercase tracking-widest px-4 py-2 rounded-full border-2 border-brand-deep/20 hover:border-brand-deep hover:bg-brand-deep hover:text-primary-foreground transition-colors"
              >
                Painel →
              </Link>
            </div>
          </header>

          <div className="space-y-14 md:space-y-20">
            {CURSOS.map((curso) => {
              const cor = CURSO_CORES[curso];
              return (
                <div key={curso}>
                  <h2
                    className="text-xs font-mono uppercase tracking-[0.3em] mb-6 md:mb-8 flex items-center gap-4"
                    style={{ color: cor.accent }}
                  >
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ background: cor.accent }}
                    />
                    {curso}
                    <span className="h-px flex-1" style={{ background: cor.ring }} />
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {salasPorCurso(curso).map((sala) => (
                      <Link
                        key={sala.id}
                        to="/salas/$salaId"
                        params={{ salaId: String(sala.id) }}
                        className="group relative min-h-[200px] bg-card rounded-2xl overflow-hidden border-2 border-border p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 cursor-pointer"
                        style={{
                          boxShadow: `0 1px 0 0 ${cor.ring} inset`,
                        }}
                      >
                        <span
                          className="absolute top-0 left-0 h-1.5 w-full transition-all duration-300 group-hover:h-2"
                          style={{ background: cor.accent }}
                        />
                        <span
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: cor.tint }}
                        />

                        <div className="relative flex justify-between items-start gap-2">
                          <div
                            className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
                            style={{ background: cor.tint, color: cor.accent }}
                          >
                            <span
                              className="size-1.5 rounded-full animate-pulse"
                              style={{ background: cor.accent }}
                            />
                            {sala.sigla}
                          </div>
                          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-md bg-brand-deep/5 text-brand-deep/70">
                            Terminal
                          </span>
                        </div>

                        <div className="relative flex items-end justify-between mt-6">
                          <div>
                            <div
                              className="text-5xl md:text-6xl font-black leading-none tracking-tighter"
                              style={{ color: cor.accent }}
                            >
                              {String(sala.id).padStart(2, "0")}
                            </div>
                            <div className="text-xs font-bold text-muted-foreground mt-2">
                              {sala.nome}
                            </div>
                          </div>
                          <div
                            className="size-10 rounded-full grid place-items-center text-sm transition-transform duration-300 group-hover:translate-x-1 shrink-0"
                            style={{
                              background: cor.accent,
                              color: "white",
                            }}
                            aria-hidden
                          >
                            →
                          </div>
                        </div>

                        <div
                          className="relative mt-4 pt-4 border-t text-center text-xs font-bold uppercase tracking-widest transition-colors"
                          style={{
                            borderColor: cor.ring,
                            color: cor.accent,
                          }}
                        >
                          <span className="group-hover:underline">Abrir terminal de avisos</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
