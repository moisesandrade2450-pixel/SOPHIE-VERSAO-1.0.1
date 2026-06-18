import { createFileRoute, Link } from "@tanstack/react-router";
import { SophieNav } from "@/components/SophieNav";
import { CURSO_CORES, CURSOS } from "@/lib/salas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOPHIE — Avisos escolares em tempo real, com voz e agendamento" },
      {
        name: "description",
        content:
          "A gestão envia avisos para as salas em segundos, com som, voz automática e agendamento por data, horário diário ou semanal. 12 salas em 4 cursos.",
      },
      { property: "og:title", content: "SOPHIE — Avisos em tempo real" },
      {
        property: "og:description",
        content:
          "Envie avisos agora ou agende recorrências. Voz automática 10s após o envio, histórico por sala e calendário visual.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-brand-deep selection:bg-brand-light/30 overflow-hidden relative">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full opacity-30 blur-3xl animate-blob bg-brand-deep" />
        <div
          className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl animate-blob bg-brand-light"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[460px] h-[460px] rounded-full opacity-20 blur-3xl animate-blob"
          style={{ background: "#7c3aed", animationDelay: "4s" }}
        />
      </div>

      <SophieNav />

      <section className="max-w-7xl mx-auto px-6 md:px-8 pt-12 md:pt-20 pb-16">
        {/* Hero */}
        <div className="text-center mb-14 md:mb-20 animate-slide-up">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-brand-light px-3 py-1.5 rounded-full border border-brand-light/30 bg-white/50 backdrop-blur-sm mb-6">
            <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
            Sistema online — 12 salas
          </div>
          <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.85] bg-gradient-to-br from-brand-deep via-brand-light to-brand-deep bg-clip-text text-transparent">
            SOPHIE
          </h1>
          <p className="text-brand-light font-medium uppercase tracking-[0.3em] text-xs md:text-sm mt-4">
            Informação em tempo real
          </p>
        </div>

        {/* Action cards */}
        <div className="grid md:grid-cols-2 gap-5 md:gap-8 mb-16">
          <Link
            to="/salas"
            className="group relative cursor-pointer p-8 md:p-10 bg-brand-deep text-primary-foreground rounded-[2rem] overflow-hidden flex flex-col justify-between min-h-[340px] md:h-[400px] animate-slide-up transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_-20px_rgba(124,58,237,0.6)] active:scale-[0.98]"
            style={{ animationDelay: "100ms" }}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="absolute -top-24 -right-24 size-64 bg-brand-light/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="text-xs font-mono mb-4 opacity-70 uppercase tracking-widest">
                Acesso Público
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-none">
                Entrar nas
                <br />
                Salas de Aula
              </h2>
            </div>
            <div className="relative flex justify-between items-end mt-8">
              <p className="max-w-[20ch] opacity-80 font-medium">
                Visualização direta sem login para alunos e visitantes.
              </p>
              <div className="size-14 rounded-full border border-white/30 grid place-items-center group-hover:bg-white group-hover:text-brand-deep group-hover:rotate-[-45deg] transition-all duration-500 text-2xl">
                →
              </div>
            </div>
          </Link>

          <Link
            to="/gestao"
            className="group relative cursor-pointer p-8 md:p-10 bg-card border-4 border-brand-deep rounded-[2rem] overflow-hidden flex flex-col justify-between min-h-[340px] md:h-[400px] animate-slide-up transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_-20px_rgba(124,58,237,0.4)] active:scale-[0.98]"
            style={{ animationDelay: "200ms" }}
          >
            <span className="absolute -bottom-24 -left-24 size-64 bg-brand-light/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative">
              <div className="text-xs font-mono mb-4 text-brand-light uppercase tracking-widest">
                Acesso Restrito
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-none">
                Gestão
                <br />
                Escolar
              </h2>
            </div>
            <div className="relative flex justify-between items-end mt-8">
              <p className="max-w-[20ch] text-brand-deep/60 font-medium">
                Painel administrativo para professores e diretoria.
              </p>
              <div className="size-14 rounded-full border border-brand-deep/20 grid place-items-center group-hover:bg-brand-deep group-hover:text-primary-foreground group-hover:rotate-[-45deg] transition-all duration-500 text-2xl">
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Course color legend */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up"
          style={{ animationDelay: "350ms" }}
        >
          {CURSOS.map((curso) => {
            const cor = CURSO_CORES[curso];
            return (
              <div
                key={curso}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-border hover:scale-[1.03] transition-transform"
                style={{ borderColor: cor.ring }}
              >
                <span className="size-8 rounded-xl shrink-0" style={{ background: cor.accent }} />
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                    Salas{" "}
                    {curso === "Administração"
                      ? "01–03"
                      : curso === "Desenvolvimento de Sistemas"
                        ? "04–06"
                        : curso === "Edificações"
                          ? "07–09"
                          : "10–12"}
                  </div>
                  <div className="text-sm font-bold truncate">{curso}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative py-10 px-8 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center opacity-50">
          <span className="text-xl font-black text-brand-deep">SOPHIE</span>
          <span className="text-xs font-mono text-muted-foreground">© 2026 SOPHIE</span>
        </div>
      </footer>
    </div>
  );
}
