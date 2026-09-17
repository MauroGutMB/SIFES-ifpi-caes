import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, notifySessionExpired, setAccessToken } from './auth-tokens';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _skipAuth?: boolean;
  }
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config._skipAuth) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Fila de requisições que tomaram 401 enquanto um refresh já está em andamento — evita
// disparar N refreshes em paralelo quando várias chamadas falham ao mesmo tempo.
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  const { data } = await axiosInstance.post<{ accessToken: string }>(
    '/auth/refresh',
    undefined,
    { _skipAuth: true } as AxiosRequestConfig,
  );
  setAccessToken(data.accessToken);
  return data.accessToken;
}

// Rotas de auth cujo 401 é uma resposta de negócio (credenciais inválidas, sem sessão) — nunca
// deve disparar o fluxo de refresh, senão a mensagem de erro real vira "Refresh token ausente".
const ROTAS_SEM_RETRY_DE_REFRESH = ['/auth/login', '/auth/refresh'];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const ehRotaDeAuth = ROTAS_SEM_RETRY_DE_REFRESH.some((rota) =>
      originalRequest?.url?.includes(rota),
    );

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest._skipAuth ||
      ehRotaDeAuth
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      originalRequest.headers.set('Authorization', `Bearer ${token}`);
      return axiosInstance.request(originalRequest);
    } catch (refreshError) {
      notifySessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { data } = await axiosInstance.request<T>(config);
  return data;
};

export default customInstance;
