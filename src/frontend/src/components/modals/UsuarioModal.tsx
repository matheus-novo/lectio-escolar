import { AlertCircle, Loader2, UserCog, UserPlus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { extractErrorMessage } from '../../services/api';
import { usuarioService } from '../../services/usuarioService';
import {
  PERFIS_USUARIO,
  type CreateUsuarioDto,
  type PerfilUsuario,
  type UpdateUsuarioDto,
  type Usuario,
} from '../../types';

interface UsuarioModalProps {
  isOpen: boolean;
  usuarioToEdit: Usuario | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface FormFieldErrors {
  nome?: string;
  email?: string;
  password?: string;
  matricula?: string;
  registroFuncional?: string;
}

interface UsuarioModalContentProps {
  usuarioToEdit: Usuario | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function UsuarioModalContent({
  usuarioToEdit,
  onClose,
  onSuccess,
}: UsuarioModalContentProps) {
  const isEditMode = Boolean(usuarioToEdit);

  const [nome, setNome] = useState<string>(usuarioToEdit?.nome ?? '');
  const [email, setEmail] = useState<string>(usuarioToEdit?.email ?? '');
  const [password, setPassword] = useState<string>('');
  const [perfil, setPerfil] = useState<PerfilUsuario>(
    usuarioToEdit?.perfil ?? 'Aluno'
  );
  const [matricula, setMatricula] = useState<string>(usuarioToEdit?.matricula ?? '');
  const [registroFuncional, setRegistroFuncional] = useState<string>(
    usuarioToEdit?.registroFuncional ?? ''
  );

  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validate = (): boolean => {
    const errors: FormFieldErrors = {};

    if (!nome.trim()) {
      errors.nome = 'Informe o nome completo do usuário.';
    }

    if (!email.trim()) {
      errors.email = 'Informe o e-mail institucional.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Formato de e-mail inválido.';
    }

    if (!isEditMode) {
      if (!password) {
        errors.password = 'Defina uma senha inicial para o usuário.';
      } else if (password.length < 6) {
        errors.password = 'A senha deve conter no mínimo 6 caracteres.';
      }
    }

    if (perfil === 'Aluno' && !matricula.trim()) {
      errors.matricula = 'Informe o número de matrícula do aluno.';
    }

    if (perfil === 'Professor' && !registroFuncional.trim()) {
      errors.registroFuncional = 'Informe o registro funcional do professor.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && usuarioToEdit) {
        const updateDto: UpdateUsuarioDto = {
          nome: nome.trim(),
          email: email.trim(),
          matricula: perfil === 'Aluno' ? matricula.trim() : undefined,
          registroFuncional:
            perfil === 'Professor' ? registroFuncional.trim() : undefined,
        };
        const response = await usuarioService.update(usuarioToEdit.id, updateDto);
        onSuccess(response.mensagem || 'Usuário atualizado com sucesso!');
      } else {
        const createDto: CreateUsuarioDto = {
          nome: nome.trim(),
          email: email.trim(),
          password,
          perfil,
          matricula: perfil === 'Aluno' ? matricula.trim() : undefined,
          registroFuncional:
            perfil === 'Professor' ? registroFuncional.trim() : undefined,
        };
        const response = await usuarioService.create(createDto);
        onSuccess(response.mensagem || 'Usuário cadastrado com sucesso!');
      }
      onClose();
    } catch (error: unknown) {
      setApiError(
        extractErrorMessage(
          error,
          isEditMode
            ? 'Erro ao atualizar dados do usuário.'
            : 'Erro ao cadastrar novo usuário.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usuario-modal-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {isEditMode ? (
                <UserCog className="h-5 w-5" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3
                id="usuario-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode
                  ? `Atualizando cadastro de #${usuarioToEdit?.id}`
                  : 'Preencha os dados para criar uma nova conta'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
          {apiError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label
              htmlFor="usuario-nome"
              className="block text-xs font-semibold text-slate-700"
            >
              Nome Completo *
            </label>
            <input
              id="usuario-nome"
              type="text"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (fieldErrors.nome) {
                  setFieldErrors((prev) => ({ ...prev, nome: undefined }));
                }
              }}
              placeholder="Ex.: Maria Fernanda Souza"
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
            />
            {fieldErrors.nome && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.nome}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="usuario-email"
              className="block text-xs font-semibold text-slate-700"
            >
              E-mail Institucional *
            </label>
            <input
              id="usuario-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="usuario@lectio.edu.br"
              className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Perfil */}
          <div>
            <label
              htmlFor="usuario-perfil"
              className="block text-xs font-semibold text-slate-700"
            >
              Perfil de Acesso *
            </label>
            <select
              id="usuario-perfil"
              value={perfil}
              disabled={isEditMode}
              onChange={(e) => setPerfil(e.target.value as PerfilUsuario)}
              className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              {PERFIS_USUARIO.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="mt-1 text-[11px] text-slate-500">
                O tipo de perfil é definido na criação da conta e não pode ser alterado.
              </p>
            )}
          </div>

          {/* Campo Condicional: Matrícula (Aluno) */}
          {perfil === 'Aluno' && (
            <div>
              <label
                htmlFor="usuario-matricula"
                className="block text-xs font-semibold text-slate-700"
              >
                Matrícula do Aluno *
              </label>
              <input
                id="usuario-matricula"
                type="text"
                value={matricula}
                onChange={(e) => {
                  setMatricula(e.target.value);
                  if (fieldErrors.matricula) {
                    setFieldErrors((prev) => ({ ...prev, matricula: undefined }));
                  }
                }}
                placeholder="Ex.: 202610045"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
              />
              {fieldErrors.matricula && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.matricula}</p>
              )}
            </div>
          )}

          {/* Campo Condicional: Registro Funcional (Professor) */}
          {perfil === 'Professor' && (
            <div>
              <label
                htmlFor="usuario-registro"
                className="block text-xs font-semibold text-slate-700"
              >
                Registro Funcional *
              </label>
              <input
                id="usuario-registro"
                type="text"
                value={registroFuncional}
                onChange={(e) => {
                  setRegistroFuncional(e.target.value);
                  if (fieldErrors.registroFuncional) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      registroFuncional: undefined,
                    }));
                  }
                }}
                placeholder="Ex.: RF-88421"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
              />
              {fieldErrors.registroFuncional && (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.registroFuncional}
                </p>
              )}
            </div>
          )}

          {/* Senha Inicial (Apenas Criação) */}
          {!isEditMode && (
            <div>
              <label
                htmlFor="usuario-password"
                className="block text-xs font-semibold text-slate-700"
              >
                Senha Inicial *
              </label>
              <input
                id="usuario-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="Mínimo de 6 caracteres"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-hidden"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-2xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsuarioModal({
  isOpen,
  usuarioToEdit,
  onClose,
  onSuccess,
}: UsuarioModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <UsuarioModalContent
      key={usuarioToEdit ? `edit-${usuarioToEdit.id}` : 'create'}
      usuarioToEdit={usuarioToEdit}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
