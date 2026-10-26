export type PerfilUsuario = 'Administrador' | 'Professor' | 'Aluno';

export const PERFIS_USUARIO: readonly PerfilUsuario[] = [
  'Administrador',
  'Professor',
  'Aluno',
] as const;

export const PERFIL_USUARIO_ENUM_MAP: Record<PerfilUsuario, number> = {
  Administrador: 1,
  Professor: 2,
  Aluno: 3,
};

export function normalizePerfilUsuario(rawPerfil: string | number): PerfilUsuario {
  if (rawPerfil === 1 || rawPerfil === '1' || rawPerfil === 'Administrador') {
    return 'Administrador';
  }
  if (rawPerfil === 2 || rawPerfil === '2' || rawPerfil === 'Professor') {
    return 'Professor';
  }
  return 'Aluno';
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  matricula?: string | null;
  registroFuncional?: string | null;
}

export type UsuarioResponseDto = Usuario;

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  usuario: Usuario;
}

export interface CreateUsuarioDto {
  nome: string;
  email: string;
  password: string;
  perfil: PerfilUsuario;
  matricula?: string;
  registroFuncional?: string;
}

export interface UpdateUsuarioDto {
  nome: string;
  email: string;
  matricula?: string;
  registroFuncional?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ApiMessageResponse {
  mensagem: string;
}

