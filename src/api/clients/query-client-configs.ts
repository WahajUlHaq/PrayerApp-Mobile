import { serverConfigs } from '@/constants/server-config';
import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: serverConfigs.retryAttempts,
      staleTime: serverConfigs.staleTime,
      cacheTime: serverConfigs.cacheTime,
      refetchOnWindowFocus: serverConfigs.refetchOnWindowFocus,
    },
  },
});
