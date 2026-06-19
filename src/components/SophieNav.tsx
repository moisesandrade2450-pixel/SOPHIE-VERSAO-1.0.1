import { Link } from "@tanstack/react-router";

export function SophieNav() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-brand-deep/5 px-6 md:px-8 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-black tracking-tighter uppercase text-brand-deep">
        Sophie
      </Link>
      <div className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-widest opacity-60">
        <Link to="/salas" className="hover:text-brand-deep hover:opacity-100">
          Salas
        </Link>
        <Link to="/gestao" className="hover:text-brand-deep hover:opacity-100">
          Gestão
        </Link>
        <span>Sistema Escolar v1.0</span>
      </div>
      <div className="md:hidden flex gap-4 font-mono text-xs uppercase tracking-widest opacity-70">
        <Link to="/salas">Salas</Link>
        <Link to="/gestao">Gestão</Link>
      </div>
    </nav>
  );
}
