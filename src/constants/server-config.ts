export const serverConfigs = {

  // prod
  // baseURL: 'https://prayerapp-api.wahaj.site/api',
  // socketBaseURL: 'https://prayerapp-api.wahaj.site',

  // loc
   baseURL: 'http://192.168.18.7:5000/api',
   socketBaseURL: 'http://192.168.18.7:5000',

  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  retryAttempts: 2,
  staleTime: 300000, // 5 minutes
  cacheTime: 600000, // 10 minutes
  refetchOnWindowFocus: false,
};
