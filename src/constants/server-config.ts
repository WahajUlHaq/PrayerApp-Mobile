export const serverConfigs = {
  baseURL: 'http://192.168.18.7:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  retryAttempts: 3,
  staleTime: 300000, // 5 minutes
  cacheTime: 600000, // 10 minutes
  refetchOnWindowFocus: false,
};
