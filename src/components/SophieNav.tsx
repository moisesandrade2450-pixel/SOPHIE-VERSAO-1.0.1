import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "./ThemeToggle";

export function SophieNav() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-brand-deep/10 px-6 md:px-8 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-black tracking-tighter uppercase text-brand-deep">
        Sophie
      </Link>
      <div className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-foreground/70">
        <Link to="/salas" className="hover:text-brand-deep">
          Salas
        </Link>
        <Link to="/gestao" className="hover:text-brand-deep">
          Gestão
        </Link>
        <span className="text-foreground/50">Sistema Escolar v1.0</span>
        <ThemeToggle />
      </div>
      <div className="md:hidden flex items-center gap-4 font-mono text-xs uppercase tracking-widest text-foreground/80">
        <Link to="/salas">Salas</Link>
        <Link to="/gestao">Gestão</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
