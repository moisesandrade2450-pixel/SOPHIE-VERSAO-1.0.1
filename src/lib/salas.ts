export type Curso =
  | "Administração"
  | "Desenvolvimento de Sistemas"
  | "Edificações"
  | "Massoterapia";

export interface Sala {
  id: number;
  nome: string;
  curso: Curso;
  ano: 1 | 2 | 3;
  sigla: string; // ex: "1º ADM"
}

const SIGLAS: Record<Curso, string> = {
  Administração: "ADM",
  "Desenvolvimento de Sistemas": "DS",
  Edificações: "EDIF",
  Massoterapia: "MASSO",
};

const cursosOrdem: Curso[] = [
  "Administração",
  "Desenvolvimento de Sistemas",
  "Edificações",
  "Massoterapia",
];

export const SALAS: Sala[] = cursosOrdem.flatMap((curso, idx) =>
  ([1, 2, 3] as const).map((ano) => {
    const id = idx * 3 + ano;
    return {
      id,
      nome: `Sala ${id}`,
      curso,
      ano,
      sigla: `${ano}º ${SIGLAS[curso]}`,
    } satisfies Sala;
  }),
);

export const CURSOS: Curso[] = cursosOrdem;

export const salasPorCurso = (curso: Curso) => SALAS.filter((s) => s.curso === curso);
export const findSala = (id: number) => SALAS.find((s) => s.id === id);

export const CURSO_CORES: Record<
  Curso,
  { accent: string; tint: string; ring: string; nome: string }
> = {
  Administração: {
    accent: "#1e40af",
    tint: "rgba(30, 64, 175, 0.08)",
    ring: "rgba(30, 64, 175, 0.25)",
    nome: "Azul",
  },
  "Desenvolvimento de Sistemas": {
    accent: "#7c3aed",
    tint: "rgba(124, 58, 237, 0.08)",
    ring: "rgba(124, 58, 237, 0.25)",
    nome: "Roxo",
  },
  Edificações: {
    accent: "#dc2626",
    tint: "rgba(220, 38, 38, 0.08)",
    ring: "rgba(220, 38, 38, 0.25)",
    nome: "Vermelho",
  },
  Massoterapia: {
    accent: "#16a34a",
    tint: "rgba(22, 163, 74, 0.08)",
    ring: "rgba(22, 163, 74, 0.25)",
    nome: "Verde",
  },
};

export const corDaSala = (id: number) => {
  const s = findSala(id);
  return s ? CURSO_CORES[s.curso] : null;
};
