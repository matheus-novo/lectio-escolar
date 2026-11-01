import api from './api';
import type {
  ApiMessageResponse,
  CreatedResourceResponse,
  CreateTurmaDto,
  EnrollAlunosDto,
  EnrollAlunosResponse,
  Turma,
  TurmaDetalhada,
  TurmaListFilters,
  UpdateTurmaDto,
} from '../types';

function buildTurmaPayload(dto: CreateTurmaDto): CreateTurmaDto {
  return {
    nome: dto.nome.trim(),
    anoLetivo: dto.anoLetivo,
    turno: dto.turno,
  };
}

export const turmaService = {
  async listAll(filters: TurmaListFilters = {}): Promise<Turma[]> {
    const { data } = await api.get<Turma[]>('/turmas', {
      params: { ativo: filters.ativo },
    });
    return data;
  },

  async getById(id: number): Promise<TurmaDetalhada> {
    const { data } = await api.get<TurmaDetalhada>(`/turmas/${id}`);
    return data;
  },

  async create(dto: CreateTurmaDto): Promise<CreatedResourceResponse> {
    const { data } = await api.post<CreatedResourceResponse>(
      '/turmas',
      buildTurmaPayload(dto)
    );
    return data;
  },

  async update(id: number, dto: UpdateTurmaDto): Promise<ApiMessageResponse> {
    const payload: UpdateTurmaDto = { ...buildTurmaPayload(dto), ativo: dto.ativo };
    const { data } = await api.put<ApiMessageResponse>(`/turmas/${id}`, payload);
    return data;
  },

  async deactivate(id: number): Promise<ApiMessageResponse> {
    const { data } = await api.patch<ApiMessageResponse>(`/turmas/${id}/deactivate`);
    return data;
  },

  async enrollAlunos(id: number, dto: EnrollAlunosDto): Promise<EnrollAlunosResponse> {
    const { data } = await api.post<EnrollAlunosResponse>(`/turmas/${id}/alunos`, dto);
    return data;
  },

  async unenrollAluno(id: number, alunoId: number): Promise<ApiMessageResponse> {
    const { data } = await api.delete<ApiMessageResponse>(
      `/turmas/${id}/alunos/${alunoId}`
    );
    return data;
  },
};

