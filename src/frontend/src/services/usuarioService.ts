import api from './api';
import {
  type ApiMessageResponse,
  type ChangePasswordDto,
  type CreateUsuarioDto,
  type LoginDto,
  type LoginResponseDto,
  normalizePerfilUsuario,
  PERFIL_USUARIO_ENUM_MAP,
  type UpdateUsuarioDto,
  type Usuario,
} from '../types';

interface RawUsuarioResponse {
  id: number;
  nome: string;
  email: string;
  perfil: string | number;
  ativo: boolean;
  matricula?: string | null;
  registroFuncional?: string | null;
}

interface RawLoginResponse {
  token: string;
  usuario: RawUsuarioResponse;
}

function mapRawUsuario(raw: RawUsuarioResponse): Usuario {
  return {
    id: raw.id,
    nome: raw.nome,
    email: raw.email,
    perfil: normalizePerfilUsuario(raw.perfil),
    ativo: raw.ativo,
    matricula: raw.matricula ?? null,
    registroFuncional: raw.registroFuncional ?? null,
  };
}

export const usuarioService = {
  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    const { data } = await api.post<RawLoginResponse>('/usuarios/login', credentials);
    return {
      token: data.token,
      usuario: mapRawUsuario(data.usuario),
    };
  },

  async getAll(): Promise<Usuario[]> {
    const { data } = await api.get<RawUsuarioResponse[]>('/usuarios');
    return data.map(mapRawUsuario);
  },

  async getById(id: number): Promise<Usuario> {
    const { data } = await api.get<RawUsuarioResponse>(`/usuarios/${id}`);
    return mapRawUsuario(data);
  },

  async create(dto: CreateUsuarioDto): Promise<ApiMessageResponse> {
    const payload = {
      nome: dto.nome.trim(),
      email: dto.email.trim(),
      password: dto.password,
      perfil: PERFIL_USUARIO_ENUM_MAP[dto.perfil],
      matricula: dto.perfil === 'Aluno' ? dto.matricula?.trim() : undefined,
      registroFuncional:
        dto.perfil === 'Professor' ? dto.registroFuncional?.trim() : undefined,
    };
    const { data } = await api.post<ApiMessageResponse>('/usuarios', payload);
    return data;
  },

  async update(id: number, dto: UpdateUsuarioDto): Promise<ApiMessageResponse> {
    const payload: UpdateUsuarioDto = {
      nome: dto.nome.trim(),
      email: dto.email.trim(),
      matricula: dto.matricula?.trim(),
      registroFuncional: dto.registroFuncional?.trim(),
    };
    const { data } = await api.put<ApiMessageResponse>(`/usuarios/${id}`, payload);
    return data;
  },

  async deactivate(id: number): Promise<ApiMessageResponse> {
    const { data } = await api.patch<ApiMessageResponse>(`/usuarios/${id}/deactivate`);
    return data;
  },

  async changePassword(id: number, dto: ChangePasswordDto): Promise<ApiMessageResponse> {
    const { data } = await api.patch<ApiMessageResponse>(
      `/usuarios/${id}/change-password`,
      dto
    );
    return data;
  },
};

