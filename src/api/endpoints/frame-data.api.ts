import { AxiosResponse } from 'axios';

import apiClient from '@/api/clients/axios-configs';

export interface NamazTimingsRequestInterface {}

export interface NamazTimingsResponseInterface {
  data: Array<{
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
      Firstthird: string;
      Lastthird: string;
    };
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        day: string;
        weekday: { en: string };
        month: { number: number; en: string };
        year: string;
      };
      hijri: {
        date: string;
        day: string;
        weekday: { en: string; ar: string };
        month: { number: number; en: string; ar: string };
        year: string;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
    };
  }>;
}

export interface BannersRequestInterface {}

export interface BannersResponseInterface {
  data: Array<{
    filename: string;
    url: string;
  }>;
}

export interface TickersRequestInterface {}

export interface TickersResponseInterface {
  id: number;
  text: string;
}

export interface MasjidConfigResponseInterface {
  data: {
    _id: string;
    __v: number;
    address: string;
    calendarMethod: string;
    createdAt: string;
    latitudeAdjustmentMethod: number;
    method: number;
    midnightMode: number;
    month: number;
    qrLink: string;
    school: number;
    shafaq: string;
    timeZone: string;
    tune: string;
    updatedAt: string;
    year: number;
    tickerText?: string;
    maghribSunsetAdditionMinutes?: number;
    alwaysDisplayIqamaahTime?: boolean;
    displayTimerDuration ?: number;
    announcements?: string;
  };
}

export interface IqamahTimesResponseInterface {
  year: number;
  month: number;
  data: Array<{
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    jumuah: string[];
  }>;
}

export interface PagesResponseInterface extends Array<{
  _id: string;
  title: string;
  pageType: 'text' | 'image' | 'image-text';
  content?: string;
  image?: string;
  imageUrl?: string;
  pageDuration: number;
  order: number;
  schedules: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}> {}

export const fetchFrameData = {
  namazTimings: (): Promise<NamazTimingsResponseInterface> =>
    apiClient
      .get<NamazTimingsResponseInterface>('/namaz-timings')
      .then((response) => response.data),

  banners: (): Promise<BannersResponseInterface> =>
    apiClient
      .get<BannersResponseInterface>('/banners')
      .then((response) => response.data),

  tickers: (
    data: TickersRequestInterface
  ): Promise<AxiosResponse<TickersResponseInterface[]>> =>
    apiClient.post('/frame-data/tickers', data),

  masjidConfig: (): Promise<MasjidConfigResponseInterface> =>
    apiClient
      .get<MasjidConfigResponseInterface>('/masjid-config')
      .then((response) => response.data),

  iqamahTimes: (year: number, month: number): Promise<IqamahTimesResponseInterface> =>
    apiClient
      .get<IqamahTimesResponseInterface>('/iqamaah-times/month', {
        params: { year, month },
      })
      .then((response) => response.data),

  pages: (): Promise<PagesResponseInterface> =>
    apiClient
      .get<PagesResponseInterface>('/pages/mob')
      .then((response) => response.data),
};
