import api from './api';
import type {
  ApiMessageResponse,
  CreatedResourceResponse,
  CreateDisciplinaDto,
  Disciplina,
  DisciplinaListFilters,
  UpdateDisciplinaDto,
} from '../types';

function buildDisciplinaPayload(dto: CreateDisciplinaDto): CreateDisciplinaDto {
  const descricao = dto.descricao?.trim();
  return {
    nome: dto.nome.trim(),
    descricao: descricao ? descricao : undefined,
    turmaId: dto.turmaId,
    professorId: dto.professorId,
  };
}

export const disciplinaService = {
  async listAll(filters: DisciplinaListFilters = {}): Promise<Disciplina[]> {
    const { data } = await api.get<Disciplina[]>('/disciplinas', {
      params: {
        turmaId: filters.turmaId,
        professorId: filters.professorId,
        ativo: filters.ativo,
      },
    });
    return data;
  },

  async getById(id: number): Promise<Disciplina> {
    const { data } = await api.get<Disciplina>(`/disciplinas/${id}`);
    return data;
  },

  async create(dto: CreateDisciplinaDto): Promise<CreatedResourceResponse> {
    const { data } = await api.post<CreatedResourceResponse>(
      '/disciplinas',
      buildDisciplinaPayload(dto)
    );
    return data;
  },

  async update(id: number, dto: UpdateDisciplinaDto): Promise<ApiMessageResponse> {
    const payload: UpdateDisciplinaDto = {
      ...buildDisciplinaPayload(dto),
      ativo: dto.ativo,
    };
    const { data } = await api.put<ApiMessageResponse>(`/disciplinas/${id}`, payload);
    return data;
  },

  async deactivate(id: number): Promise<ApiMessageResponse> {
    const { data } = await api.patch<ApiMessageResponse>(
      `/disciplinas/${id}/deactivate`
    );
    return data;
  },
};

