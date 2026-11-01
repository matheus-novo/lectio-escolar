export type Turno = 'Manhã' | 'Tarde' | 'Noite' | 'Integral';

export const TURNOS: readonly Turno[] = ['Manhã', 'Tarde', 'Noite', 'Integral'] as const;

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

/** Converte o turno textual vindo da API (ex.: "manha", "MANHÃ") para o union type. */
export function normalizeTurno(rawTurno: string): Turno | null {
  const normalized = stripAccents(rawTurno);
  return TURNOS.find((turno) => stripAccents(turno) === normalized) ?? null;
}

export interface Turma {
  id: number;
  nome: string;
  anoLetivo: number;
  turno: string;
  ativo: boolean;
  totalAlunos: number;
}

export interface AlunoResumoDto {
  id: number;
  nome: string;
  email: string;
  matricula: string;
  dataMatricula: string;
}

export interface TurmaDetalhada {
  id: number;
  nome: string;
  anoLetivo: number;
  turno: string;
  ativo: boolean;
  alunos: AlunoResumoDto[];
}

export interface CreateTurmaDto {
  nome: string;
  anoLetivo: number;
  turno: Turno;
}

export interface UpdateTurmaDto extends CreateTurmaDto {
  ativo: boolean;
}

export interface EnrollAlunosDto {
  alunosIds: number[];
}

export interface EnrollAlunosResponse {
  mensagem: string;
  adicionados: number;
  ignoradosPorJaExistirem: number;
}

export interface CreatedResourceResponse {
  mensagem: string;
  id: number;
}

export interface TurmaListFilters {
  ativo?: boolean;
}
