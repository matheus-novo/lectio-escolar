import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import logoLectio from '../assets/logo-lectio-escolar.jpg';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../services/api';
import type { PerfilUsuario } from '../types';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

function getDefaultRouteForRole(role: PerfilUsuario): string {
  if (role === 'Administrador') {
    return '/admin/usuarios';
  }
  return '/painel';
}

export function Login() {
  const { isAuthenticated, role, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const sessionExpired = searchParams.get('sessionExpired') === 'true';

  if (isAuthenticated && role) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'O campo de e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Informe um endereço de e-mail válido.';
    }

    if (!password) {
      errors.password = 'O campo de senha é obrigatório.';
    } else if (password.length < 4) {
      errors.password = 'A senha deve possuir pelo menos 4 caracteres.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const authenticatedUser = await login({
        email: email.trim(),
        password,
      });

      const state = location.state as LocationState | null;
      const intendedPath = state?.from?.pathname;

      if (
        intendedPath &&
        intendedPath !== '/login' &&
        !(intendedPath.startsWith('/admin') && authenticatedUser.perfil === 'Aluno')
      ) {
        navigate(intendedPath, { replace: true });
      } else {
        navigate(getDefaultRouteForRole(authenticatedUser.perfil), { replace: true });
      }
    } catch (error: unknown) {
      const message = extractErrorMessage(
        error,
        'Falha ao realizar login. Verifique suas credenciais e tente novamente.'
      );
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-linear-to-br from-[#0d2949] via-[#10345c] to-[#175a3a] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-2xl sm:px-10">
          {/* Logo & Identidade da Biblioteca */}
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={logoLectio}
              alt="Logo Lectio Escolar"
              className="h-32 w-auto object-contain"
            />
            <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#175a3a] border border-emerald-200">
              Biblioteca Pública Virtual
            </span>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Compartilhamento de livros e materiais de leitura de professores para
              alunos do ensino fundamental e médio da rede pública.
            </p>
          </div>

          {sessionExpired && !apiError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <span>Sua sessão expirou. Faça login novamente para continuar.</span>
            </div>
          )}

          {apiError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-semibold">Não foi possível autenticar</p>
                <p className="mt-0.5 text-rose-700">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                E-mail de acesso
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  placeholder="seu.email@escola.gov.br"
                  className={`block w-full rounded-xl border py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-hidden focus:ring-2 ${
                    fieldErrors.email
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 bg-white focus:border-[#0d2949] focus:ring-[#0d2949]/20'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Senha
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`block w-full rounded-xl border py-2.5 pr-10 pl-10 text-sm text-slate-900 placeholder-slate-400 transition focus:outline-hidden focus:ring-2 ${
                    fieldErrors.password
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 bg-white focus:border-[#0d2949] focus:ring-[#0d2949]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d2949] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163d6b] focus:ring-2 focus:ring-[#0d2949] focus:ring-offset-2 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Acessar Biblioteca</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
