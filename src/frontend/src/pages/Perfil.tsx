import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Hash,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../services/api';
import { usuarioService } from '../services/usuarioService';

export function Perfil() {
  const { user, updateProfileState } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserDetails() {
      if (!user?.id) return;
      setIsLoadingProfile(true);
      try {
        const detailedUser = await usuarioService.getById(user.id);
        if (isMounted) {
          updateProfileState(detailedUser);
        }
      } catch {
        // Fallback to cached user data in AuthContext
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    fetchUserDetails();
    return () => {
      isMounted = false;
    };
  }, [user?.id, updateProfileState]);

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!user) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos de senha.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const response = await usuarioService.changePassword(user.id, {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(response.mensagem || 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      setPasswordError(
        extractErrorMessage(error, 'Não foi possível alterar a senha.')
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Meu Perfil
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Visualize seus dados de leitor ou colaborador na Biblioteca Pública Virtual e
          gerencie sua senha de acesso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Dados do Usuário */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-[#0d2949]">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Dados de Identificação
                </h3>
                <p className="text-xs text-slate-500">
                  Informações vinculadas à sua conta na Lectio Escolar
                </p>
              </div>
            </div>

            {isLoadingProfile && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sincronizando...
              </span>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                Nome Completo
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-slate-900">
                {user.nome}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                E-mail Cadastrado
              </dt>
              <dd className="mt-1.5 text-sm font-semibold text-slate-900">
                {user.email}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                Perfil na Biblioteca
              </dt>
              <dd className="mt-1.5">
                <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-[#0d2949]">
                  {user.perfil}
                </span>
              </dd>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                <BadgeCheck className="h-3.5 w-3.5 text-slate-400" />
                Status da Conta
              </dt>
              <dd className="mt-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    user.ativo
                      ? 'bg-emerald-100 text-[#175a3a]'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {user.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </dd>
            </div>

            {user.perfil === 'Aluno' && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:col-span-2">
                <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  Matrícula do Aluno (Rede Pública)
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-slate-900">
                  {user.matricula || 'Não informada'}
                </dd>
              </div>
            )}

            {user.perfil === 'Professor' && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:col-span-2">
                <dt className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  Registro Funcional (Professor)
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-slate-900">
                  {user.registroFuncional || 'Não informado'}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Alteração de Senha */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#175a3a]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Alterar Senha
              </h3>
              <p className="text-xs text-slate-500">
                Atualize sua credencial de acesso
              </p>
            </div>
          </div>

          {passwordError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                Senha Atual
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                Nova Senha
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#0d2949] focus:ring-2 focus:ring-[#0d2949]/20 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d2949] px-4 py-2.5 text-sm font-semibold text-white shadow-2xs transition hover:bg-[#163d6b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <span>Salvar Nova Senha</span>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
