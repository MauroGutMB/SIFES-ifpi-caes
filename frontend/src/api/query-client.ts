import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

function isAuthError(error: unknown): boolean {
  return isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !isAuthError(error) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
