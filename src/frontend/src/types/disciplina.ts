export interface Disciplina {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  turmaId: number;
  nomeTurma: string;
  professorId: number;
  nomeProfessor: string;
}

export interface CreateDisciplinaDto {
  nome: string;
  descricao?: string;
  turmaId: number;
  professorId: number;
}

export interface UpdateDisciplinaDto extends CreateDisciplinaDto {
  ativo: boolean;
}

export interface DisciplinaListFilters {
  turmaId?: number;
  professorId?: number;
  ativo?: boolean;
}

