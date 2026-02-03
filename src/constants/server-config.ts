export const serverConfigs = {
  // baseURL: 'https://prayerapp-api.wahaj.site/api',
   baseURL: 'http://192.168.18.7:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  retryAttempts: 2,
  staleTime: 300000, // 5 minutes
  cacheTime: 600000, // 10 minutes
  refetchOnWindowFocus: false,
};
