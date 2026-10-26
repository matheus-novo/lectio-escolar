import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const AUTH_TOKEN_STORAGE_KEY = '@LectioEscolar:token';
export const AUTH_USER_STORAGE_KEY = '@LectioEscolar:user';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5273/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ mensagem?: string; title?: string }>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isLoginEndpoint = requestUrl.includes('/usuarios/login');

    if (status === 401 && !isLoginEndpoint) {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('lectio:unauthorized'));

      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    }

    if (status === 403) {
      window.dispatchEvent(
        new CustomEvent('lectio:forbidden', {
          detail: {
            message:
              error.response?.data?.mensagem ||
              'Acesso negado: seu perfil não possui permissão para realizar esta operação.',
          },
        })
      );
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { mensagem?: string; message?: string; title?: string }
      | undefined;

    if (responseData?.mensagem) {
      return responseData.mensagem;
    }
    if (responseData?.message) {
      return responseData.message;
    }
    if (error.response?.status === 401) {
      return 'Sessão expirada ou credenciais inválidas.';
    }
    if (error.response?.status === 403) {
      return 'Você não tem permissão para executar esta ação.';
    }
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique se a Web API está em execução.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export default api;

