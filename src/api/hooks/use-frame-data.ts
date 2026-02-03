import { useQuery } from 'react-query';

import { fetchFrameData } from '@/api/endpoints/frame-data.api';

export const useNamazTimings = () => {
  return useQuery('namazTimings', () => fetchFrameData.namazTimings(), {
    // Twice daily: 12 hours interval (morning and night)
    refetchInterval: 12 * 60 * 60 * 1000, // 12 hours
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    keepPreviousData: true, // Keep previous data if API fails
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

export const useBanners = () => {
  return useQuery('banners', () => fetchFrameData.banners(), {
    // Every 3 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data if API fails
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

export const useTickers = () => {
  return useQuery('tickers', () =>
    fetchFrameData.tickers({
      // Twice daily: 12 hours interval (morning and night)
      refetchInterval: 12 * 60 * 60 * 1000, // 12 hours
      staleTime: 12 * 60 * 60 * 1000, // 12 hours
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
      keepPreviousData: true, // Keep previous data if API fails
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    })
  );
};

export const useMasjidConfig = () => {
  return useQuery('masjidConfig', () => fetchFrameData.masjidConfig(), {
    // Twice daily: 12 hours interval (morning and night)
    refetchInterval: 12 * 60 * 60 * 1000, // 12 hours
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    keepPreviousData: true, // Keep previous data if API fails
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};

export const useIqamahTimes = (year?: number, month?: number) => {
  return useQuery(
    ['iqamahTimes', year, month],
    () => fetchFrameData.iqamahTimes(year as number, month as number),
    {
      enabled: Boolean(year && month),
      // Twice daily: 12 hours interval (morning and night)
      refetchInterval: 12 * 60 * 60 * 1000, // 12 hours
      staleTime: 12 * 60 * 60 * 1000, // 12 hours
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
      keepPreviousData: true, // Keep previous data if API fails
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  );
};

export const usePages = () => {
  return useQuery('pages', () => fetchFrameData.pages(), {
   refetchInterval: 1 * 60 * 1000, // 3 minutes
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data if API fails
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
