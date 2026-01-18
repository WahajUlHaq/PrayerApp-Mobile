import { useQuery } from 'react-query';

import { fetchFrameData } from '@/api/endpoints/frame-data.api';

const getMsUntilNextFetch = () => {
  const now = new Date();
  const next = new Date(now);

  if (now.getHours() < 6) {
    next.setHours(6, 0, 0, 0);
  } else if (now.getHours() < 18) {
    next.setHours(18, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
  }

  return next.getTime() - Date.now();
};

export const useNamazTimings = () => {
  return useQuery('namazTimings', () => fetchFrameData.namazTimings(), {
    refetchInterval: getMsUntilNextFetch,
    staleTime: Infinity,
  });
};

export const useBanners = () => {
  return useQuery('banners', () => fetchFrameData.banners(), {
     staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
  });
};

export const useTickers = () => {
  return useQuery('tickers', () => fetchFrameData.tickers({
         staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
  }));
};

export const useMasjidConfig = () => {
  return useQuery('masjidConfig', () => fetchFrameData.masjidConfig(), {
     staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
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
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    }
  );
};
