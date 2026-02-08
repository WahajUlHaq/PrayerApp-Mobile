import ImageSlider from '@/components/common/Carosel';
import SimpleQRCode from '@/components/common/qr';
import TextTicker from 'react-native-text-ticker';
import SecondaryScreen from './SecondaryScreen';
import { io } from 'socket.io-client';
import { serverConfigs } from '@/constants/server-config';
// import Ticker from "react-native-ticker";
import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";

import {
  useBanners,
  useIqamahTimes,
  useMasjidConfig,
  useNamazTimings,
  useTickers,
  usePages,
} from '@/api/hooks/use-frame-data';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, Image, Pressable, ActivityIndicator, Modal, Animated } from 'react-native';
import { Divider } from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';

// dayjs.extend(utc);
// dayjs.extend(timezone);
dayjs.extend(duration);

const Screen = () => {
  useEffect(() => {
    console.log('Frame Screen mounted');
    activateKeepAwake();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  const [currentTime, setCurrentTime] = useState('--:--');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIqamahCountdown, setShowIqamahCountdown] = useState(false);
  const [iqamahCountdownData, setIqamahCountdownData] = useState<{
    name: string;
    secondsRemaining: number;
  } | null>(null);
  const [showSecondaryScreen, setShowSecondaryScreen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showA21, setShowA21] = useState(true);
  const [zawalCountdown, setZawalCountdown] = useState<string>('');
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    visible: boolean;
    apis: { name: string; loading: boolean; completed: boolean }[];
  }>({ visible: false, apis: [] });
  const loadingFadeAnim = useRef(new Animated.Value(0)).current;
  const { data: namazData, refetch: refetchNamaz } = useNamazTimings();
  const { data: bannersData, refetch: refetchBanners } = useBanners();
  const { data: masjidConfig, refetch: refetchMasjidConfig } = useMasjidConfig();
  // const { data: tickersData, refetch: refetchTickers } = useTickers();
  const { data: pagesData, refetch: refetchPages } = usePages();
  const timeZone = masjidConfig?.data?.timeZone;
  const getNow = () => dayjs();
  const iqamahYear = masjidConfig?.data?.year ?? getNow().year();
  const iqamahMonth = masjidConfig?.data?.month ?? getNow().month() + 1;
  const { data: iqamahData, refetch: refetchIqamah } = useIqamahTimes(iqamahYear, iqamahMonth);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchNamaz(),
        refetchBanners(),
        refetchMasjidConfig(),
        // refetchTickers(),
        refetchIqamah(),
        refetchPages(),
      ]);
    } catch (error) {
      // console.log('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Socket.io connection for real-time reload
  useEffect(() => {
    let isMounted = true;
    const socketUrl = serverConfigs.socketBaseURL
    let socket: any = null;
    
    try {
      socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        if (isMounted) {
          console.log('Socket connected:', socket.id);
        }
      });

      socket.on('disconnect', () => {
        if (isMounted) {
          console.log('Socket disconnected');
        }
      });

      socket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
      });

      // Listen for announcement trigger from server
      socket.on('client:announce', async (data: any) => {
        console.log('✅✅✅ CLIENT:ANNOUNCE EVENT RECEIVED ✅✅✅');
        console.log('Event data:', JSON.stringify(data, null, 2));
        
        if (!isMounted) {
          console.log('❌ Component not mounted, ignoring');
          return;
        }
        
        try {
          // First, refetch masjid config to get the latest announcement text
          console.log('📥 Refetching masjid config to get latest announcement...');
          const result = await refetchMasjidConfig();
          console.log('===== MASJID CONFIG API RESPONSE =====');
          console.log('Full result:', JSON.stringify(result, null, 2));
          console.log('result.data:', result.data);
          console.log('result.data?.data:', result.data?.data);
          console.log('======================================');
          
          // Get announcements text (note: plural field name)
          let announcementFromConfig = result.data?.data?.announcements;
          
          if (!announcementFromConfig) {
            // Try alternative path
            announcementFromConfig = result.data?.announcements;
          }
          
          console.log('Announcements from config (final):', announcementFromConfig);
          console.log('Announcements type:', typeof announcementFromConfig);
          
          if (!announcementFromConfig || announcementFromConfig === '') {
            console.log('⚠️ No announcements text in config');
            
            // Still send confirmation
            if (socket && socket.connected) {
              socket.emit('client:announced', {
                clientId: socket.id,
                status: 'received',
                error: 'No announcements text in config',
                timestamp: new Date().toISOString(),
              });
            }
            return;
          }
          
          // Parse announcements text - replace ||| with line breaks
          const parsedAnnouncement = announcementFromConfig.replace(/\|\|\|/g, '\n');
          console.log('📢 Showing announcement:', parsedAnnouncement);
          console.log('📢 Setting states now...');
          
          // Show announcement for 5 seconds
          setAnnouncementText(parsedAnnouncement);
          setShowAnnouncement(true);
          console.log('📢 States set - showAnnouncement should be TRUE');
          console.log('📢 announcementText:', parsedAnnouncement);
          
          setTimeout(() => {
            if (isMounted) {
              console.log('⏰ Hiding announcement after 5 seconds');
              setShowAnnouncement(false);
              setAnnouncementText('');
            }
          }, 5000);
          
          // Confirm announcement received
          if (socket && socket.connected) {
            console.log('📤 Emitting client:announced confirmation');
            socket.emit('client:announced', {
              clientId: socket.id,
              status: 'received',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('❌ Error processing announcement:', error);
          
          // Send error confirmation
          if (socket && socket.connected) {
            socket.emit('client:announced', {
              clientId: socket.id,
              status: 'error',
              error: String(error),
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      socket.on('client:reload', async (data: any) => {
        if (!isMounted) return;
        
        console.log('Reload signal received:', data);
        
        // Initialize loading states
        const apiList = [
          { name: 'Namaz Timings', loading: true, completed: false },
          { name: 'Banners', loading: true, completed: false },
          { name: 'Masjid Config', loading: true, completed: false },
          { name: 'Iqamah Times', loading: true, completed: false },
          { name: 'Pages', loading: true, completed: false },
        ];
        
        if (!isMounted) return;
        setLoadingStates({ visible: true, apis: apiList });
        loadingFadeAnim.setValue(0);
        Animated.timing(loadingFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        try {
          // Refresh each API individually to track progress
          if (isMounted && refetchNamaz) {
            await refetchNamaz();
            if (isMounted) {
              setLoadingStates(prev => ({
                ...prev,
                apis: prev.apis.map((api, i) => i === 0 ? { ...api, loading: false, completed: true } : api)
              }));
            }
          }
          
          if (isMounted && refetchBanners) {
            await refetchBanners();
            if (isMounted) {
              setLoadingStates(prev => ({
                ...prev,
                apis: prev.apis.map((api, i) => i === 1 ? { ...api, loading: false, completed: true } : api)
              }));
            }
          }
          
          if (isMounted && refetchMasjidConfig) {
            await refetchMasjidConfig();
            if (isMounted) {
              setLoadingStates(prev => ({
                ...prev,
                apis: prev.apis.map((api, i) => i === 2 ? { ...api, loading: false, completed: true } : api)
              }));
            }
          }
          
          if (isMounted && refetchIqamah) {
            await refetchIqamah();
            if (isMounted) {
              setLoadingStates(prev => ({
                ...prev,
                apis: prev.apis.map((api, i) => i === 3 ? { ...api, loading: false, completed: true } : api)
              }));
            }
          }
          
          if (isMounted && refetchPages) {
            await refetchPages();
            if (isMounted) {
              setLoadingStates(prev => ({
                ...prev,
                apis: prev.apis.map((api, i) => i === 4 ? { ...api, loading: false, completed: true } : api)
              }));
            }
          }
          
          if (!isMounted) return;
          console.log('All data refreshed successfully');
          
          // Wait a bit to show all checkmarks, then fade out and restart cycle
          setTimeout(() => {
            if (!isMounted) return;
            Animated.timing(loadingFadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              if (!isMounted) return;
              setLoadingStates({ visible: false, apis: [] });
              
              // Reset everything to initial state - restart the app cycle
              setShowSecondaryScreen(false);
              setCurrentPageIndex(0);
              setShowIqamahCountdown(false);
              setIqamahCountdownData(null);
              
              console.log('App cycle restarted from beginning');
            });
          }, 1000);
          
          // Confirm refresh is done
          if (socket && socket.connected) {
            socket.emit('client:refreshed', {
              message: 'Data refreshed successfully',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error refreshing data:', error);
          
          if (!isMounted) return;
          
          // Fade out on error
          Animated.timing(loadingFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            if (isMounted) {
              setLoadingStates({ visible: false, apis: [] });
            }
          });
          
          if (socket && socket.connected) {
            socket.emit('client:refreshed', {
              message: 'Data refresh failed',
              error: String(error),
              timestamp: new Date().toISOString(),
            });
          }
        }
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
    }

    return () => {
      isMounted = false;
      if (socket) {
        try {
          socket.off('connect');
          socket.off('disconnect');
          socket.off('connect_error');
          socket.off('client:announce');
          socket.off('client:reload');
          socket.disconnect();
        } catch (error) {
          console.error('Error cleaning up socket:', error);
        }
      }
    };
  }, [refetchNamaz, refetchBanners, refetchMasjidConfig, refetchIqamah, refetchPages, masjidConfig?.data?.announcement]);

  const handleLastImageComplete = () => {
    // Check if pages data has length
    const hasPages = pagesData && pagesData.length > 0;
    console.log('Pages data:', pagesData);

    if (!hasPages) {
      console.log('No pages data, continuing carousel loop');
      return; // Just loop the carousel
    }
    
    console.log(`Pages data exists (${pagesData.length} pages), switching to secondary screen`);
    
    // Start showing pages from index 0
    setCurrentPageIndex(0);
    setShowSecondaryScreen(true);
    
    // Start the page cycling logic
    cyclePages(0);
  };

  const cyclePages = (pageIndex: number) => {
    if (!pagesData || pageIndex >= pagesData.length) {
      // All pages shown, return to main screen
      console.log('All pages shown, returning to main screen');
      setShowSecondaryScreen(false);
      setCurrentPageIndex(0);
      return;
    }

    const currentPage = pagesData[pageIndex];
    const pageDuration = (currentPage.pageDuration || 10) * 1000; // Convert to milliseconds, default 10 seconds
    
    console.log(`Showing page ${pageIndex + 1}/${pagesData.length} for ${currentPage.pageDuration} seconds`);

    setTimeout(() => {
      const nextIndex = pageIndex + 1;
      
      if (nextIndex < pagesData.length) {
        // Move to next page without transition
        setCurrentPageIndex(nextIndex);
        cyclePages(nextIndex);
      } else {
        // Last page, return to main screen
        cyclePages(nextIndex);
      }
    }, pageDuration);
  };

  const extractDate = () => {
    const day = getNow().date();
    return Math.max(day - 1, 0);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';

    const clean = timeString.split(' ')[0];
    const [h, m] = clean.split(':').map(Number);

    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;

    return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const parseNamazTime = (time: string) => {
    const clean = time.split(' ')[0];
    const [hour, minute] = clean.split(':').map(Number);

    return getNow().hour(hour).minute(minute).second(0).millisecond(0);
  };

  const parseIqamahTime = (date: string, time?: string) => {
    if (!time || time === '--:--') return null;
    const [hour, minute] = time.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    const base = dayjs(date);
    return base.hour(hour).minute(minute).second(0).millisecond(0);
  };

  const formatDisplayTime = (value?: string | null, fallback = '--:--') => {
    if (!value || value === '--:--') return fallback;
    return formatTime(value);
  };

  const formatDisplayFromDayjs = (
    value?: dayjs.Dayjs | null,
    fallback = '--:--'
  ) => {
    if (!value) return fallback;
    return value.format('hh:mm A');
  };

  const parseTimeString = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return getNow().hour(hour).minute(minute).second(0).millisecond(0);
  };

  // Calculate zawal times based on sunrise, sunset, and dhuhr
  const calculateZawalTimes = () => {
    const timings = todayData?.timings;
    if (!timings?.Sunrise || !timings?.Sunset || !timings?.Dhuhr) {
      return null;
    }

    const sunrise = parseNamazTime(timings.Sunrise);
    const sunset = parseNamazTime(timings.Sunset);
    const dhuhr = parseNamazTime(timings.Dhuhr);

    // First zawal: After sunrise, lasts 15 minutes
    const firstZawalStart = sunrise;
    const firstZawalEnd = sunrise.add(15, 'minute');

    // Second zawal: Calculate midpoint from sunrise minus 15 minutes
    // sunset - sunrise = x (total day length)
    // x / 2 = y (half of the day)
    // sunrise + y = z
    // z - 15 = second zawal start time, end is Dhuhr
    const sunriseSunsetDiff = sunset.diff(sunrise, 'minute');
    const halfTime = Math.floor(sunriseSunsetDiff / 2);
    const secondZawalStart = sunrise.add(halfTime, 'minute').subtract(15, 'minute');
    const secondZawalEnd = dhuhr;

    console.log('===== Zawal Times Calculated =====');
    console.log('Sunrise:', sunrise.format('hh:mm A'));
    console.log('Sunset:', sunset.format('hh:mm A'));
    console.log('Dhuhr:', dhuhr.format('hh:mm A'));
    console.log('Half Time (y):', halfTime, 'minutes');
    console.log('---');
    console.log('1st Zawal Start:', firstZawalStart.format('hh:mm A'));
    console.log('1st Zawal End:', firstZawalEnd.format('hh:mm A'));
    console.log('2nd Zawal Start:', secondZawalStart.format('hh:mm A'));
    console.log('2nd Zawal End:', secondZawalEnd.format('hh:mm A'));
    console.log('==================================');

    return {
      first: { start: firstZawalStart, end: firstZawalEnd },
      second: { start: secondZawalStart, end: secondZawalEnd },
    };
  };

  const getNamazSchedule = useMemo(() => {
    const timings = namazData?.data?.[extractDate()]?.timings;
    if (!timings) return [];

    return [
      { name: 'Fajr', time: parseNamazTime(timings.Fajr) },
      { name: 'Dhuhr', time: parseNamazTime(timings.Dhuhr) },
      { name: 'Asr', time: parseNamazTime(timings.Asr) },
      { name: 'Maghrib', time: parseNamazTime(timings.Maghrib) },
      { name: 'Isha', time: parseNamazTime(timings.Isha) },
    ];
  }, [namazData]);

  const getCurrentNamaz = () => {
    if (!getNamazSchedule.length) return null;

    const now = getNow();

    for (let i = 0; i < getNamazSchedule.length; i++) {
      const current = getNamazSchedule[i];
      const next = getNamazSchedule[i + 1];

      if (!next && now.isAfter(current.time)) {
        return current.name;
      }

      if (
        next &&
        (now.isSame(current.time) || now.isAfter(current.time)) &&
        now.isBefore(next.time)
      ) {
        return current.name;
      }
    }

    return null;
  };

  const [activeNamaz, setActiveNamaz] = useState<string | null>(null);

  const todayData = namazData?.data?.[extractDate()];
  const todayDateString = getNow().format('YYYY-MM-DD');
  const todayIqamah = iqamahData?.data?.find(
    (item) => item.date === todayDateString
  );
  const iqamahTimes = {
    Fajr: todayIqamah?.fajr,
    Dhuhr: todayIqamah?.dhuhr,
    Asr: todayIqamah?.asr,
    Maghrib: todayIqamah?.maghrib,
    Isha: todayIqamah?.isha,
  } as const;
  const maghribAdditionMinutesRaw = Number(
    masjidConfig?.data?.maghribSunsetAdditionMinutes
  );
  const maghribAdditionMinutes = Number.isFinite(maghribAdditionMinutesRaw)
    ? maghribAdditionMinutesRaw
    : 0;
  const sunsetTime = todayData?.timings?.Sunset;
  const maghribIqamahTime = sunsetTime
    ? parseNamazTime(sunsetTime).add(maghribAdditionMinutes, 'minute')
    : null;
  const iqamahSchedule = useMemo(() => {
    const namazTimings = todayData?.timings;
    if (!namazTimings) return [];

    return [
      {
        name: 'Fajr',
        namazTime: parseNamazTime(namazTimings.Fajr),
        iqamahTime: parseIqamahTime(todayDateString, iqamahTimes.Fajr),
      },
      {
        name: 'Dhuhr',
        namazTime: parseNamazTime(namazTimings.Dhuhr),
        iqamahTime: parseIqamahTime(todayDateString, iqamahTimes.Dhuhr),
      },
      {
        name: 'Asr',
        namazTime: parseNamazTime(namazTimings.Asr),
        iqamahTime: parseIqamahTime(todayDateString, iqamahTimes.Asr),
      },
      {
        name: 'Maghrib',
        namazTime: parseNamazTime(namazTimings.Maghrib),
        iqamahTime: maghribIqamahTime,
      },
      {
        name: 'Isha',
        namazTime: parseNamazTime(namazTimings.Isha),
        iqamahTime: parseIqamahTime(todayDateString, iqamahTimes.Isha),
      },
    ];
  }, [
    todayData,
    todayDateString,
    iqamahTimes.Fajr,
    iqamahTimes.Dhuhr,
    iqamahTimes.Asr,
    iqamahTimes.Isha,
    maghribIqamahTime,
  ]);

  useEffect(() => {
    if (!namazData?.data?.length) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const now = getNow();
      setCurrentTime(now.format('hh:mm:ss A'));
      setActiveNamaz(getCurrentNamaz());
      
      // Calculate zawal countdown
      const zawalTimes = calculateZawalTimes();
      
      if (zawalTimes) {
        const { first, second } = zawalTimes;
        
        // Check first zawal (after sunrise for 15 minutes)
        if (now.isAfter(first.start) && now.isBefore(first.end)) {
          const secondsLeft = first.end.diff(now, 'second');
          const minutes = Math.floor(secondsLeft / 60);
          const seconds = secondsLeft % 60;
          const countdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          console.log('First Zawal Active - Countdown:', countdown);
          setZawalCountdown(countdown);
        }
        // Check second zawal (midpoint before Dhuhr)
        else if (now.isAfter(second.start) && now.isBefore(second.end)) {
          const secondsLeft = second.end.diff(now, 'second');
          const minutes = Math.floor(secondsLeft / 60);
          const seconds = secondsLeft % 60;
          const countdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          console.log('Second Zawal Active - Countdown:', countdown);
          setZawalCountdown(countdown);
        }
        else {
          setZawalCountdown('');
        }
      } else {
        setZawalCountdown('');
      }
      
      // Check if any Iqamah is within 30 seconds
      
      // console.log('Checking Iqamah schedule:', iqamahSchedule.length, 'items');
      
      for (const item of iqamahSchedule) {
        const { iqamahTime } = item;
        if (!iqamahTime) {
          // console.log(`${item.name} has no iqamah time`);
          continue;
        }
        
        const secondsUntilIqamah = iqamahTime.diff(now, 'second');
        
        // console.log(`${item.name} Iqamah in ${secondsUntilIqamah} seconds`);
        
        if (secondsUntilIqamah > 0 && secondsUntilIqamah <= 30) {
          // console.log(`SHOWING COUNTDOWN for ${item.name}!`);
          setShowIqamahCountdown(true);
          setIqamahCountdownData({
            name: item.name,
            secondsRemaining: secondsUntilIqamah,
          });
          return;
        }
      }
      
      // If no Iqamah within 30 seconds, hide countdown
      if (showIqamahCountdown) {
        // console.log('Hiding countdown - no Iqamah within 30 seconds');
        setShowIqamahCountdown(false);
        setIqamahCountdownData(null);
      }
    };

    const start = () => {
      tick();
      const delay = 1000 - (Date.now() % 1000);
      timeoutId = setTimeout(() => {
        tick();
        intervalId = setInterval(tick, 1000);
      }, delay);
    };

    start();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [namazData, iqamahSchedule, showIqamahCountdown]);

  const getNextIqamah = () => {
    const now = getNow();

    for (const item of iqamahSchedule) {
      const { namazTime, iqamahTime } = item;
      const nextIqamahTime = iqamahTime ?? namazTime;
      if (!nextIqamahTime) continue;

      if (now.isBefore(namazTime)) {
        return { name: item.name, time: nextIqamahTime };
      }

      if (
        iqamahTime &&
        (now.isSame(namazTime) || now.isAfter(namazTime)) &&
        now.isBefore(iqamahTime)
      ) {
        return { name: item.name, time: iqamahTime };
      }

      if (iqamahTime && now.isBefore(iqamahTime)) {
        return { name: item.name, time: iqamahTime };
      }
    }

    // If no iqamah found for today, return tomorrow's Fajr
    const tomorrowDateString = getNow().add(1, 'day').format('YYYY-MM-DD');
    const tomorrowIqamah = iqamahData?.data?.find(
      (item) => item.date === tomorrowDateString
    );

    if (tomorrowIqamah?.fajr) {
      const tomorrowFajrTime = parseIqamahTime(
        tomorrowDateString,
        tomorrowIqamah.fajr
      );
      if (tomorrowFajrTime) {
        return { name: 'Fajr', time: tomorrowFajrTime };
      }
    }

    return null;
  };

  const nextIqamah = getNextIqamah();
  const nextIqamahIn = nextIqamah
    ? dayjs.duration(nextIqamah.time.diff(getNow()))
    : null;
  const nextIqamahInText = nextIqamahIn
    ? `${String(nextIqamahIn.hours()).padStart(2, '0')}:${String(nextIqamahIn.minutes()).padStart(2, '0')}:${String(nextIqamahIn.seconds()).padStart(2, '0')}`
    : '--:--';

  const bannerImages = bannersData?.data ?? [];

  // console.log('Banners Data:', bannerImages);
  const sliderImages = bannerImages.length ? bannerImages : [];
  const fallbackTickerText = '•';
  const parseTickerText = (text?: string | null) => {
    const raw = text?.trim() + '     •     ';
    if (!raw) return null;
    return raw
      .split('|||')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('     •     ');
  };
  const tickerFromConfig = parseTickerText(masjidConfig?.data?.tickerText);
  // const tickerFromApi = tickersData?.data
  //   ?.map((item) => parseTickerText(item.text))
  //   .filter(Boolean)
  //   .join('     •     ');
  const tickerText =tickerFromConfig || fallbackTickerText;

  const nextIqamahChange = useMemo(() => {
    const data = iqamahData?.data;
    if (!data?.length) return null;
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    let previous: (typeof sorted)[number] | null = null;

    for (const item of sorted) {
      if (item.date < todayDateString) {
        previous = item;
        continue;
      }

      if (!previous) {
        previous = item;
        continue;
      }

      const changes = {
        fajr: item.fajr !== previous.fajr,
        dhuhr: item.dhuhr !== previous.dhuhr,
        asr: item.asr !== previous.asr,
        maghrib: item.maghrib !== previous.maghrib,
        isha: item.isha !== previous.isha,
      };

      if (Object.values(changes).some(Boolean)) {
        return { date: item.date, times: item, changes };
      }

      previous = item;
    }

    return null;
  }, [iqamahData, todayDateString]);

  const changeDateLabel = nextIqamahChange
    ? dayjs(nextIqamahChange.date).format('MMM D, YYYY')
    : '--';

  const maghribChangeText = `Sunset + ${maghribAdditionMinutes} min`;

  const getCardStyle = (namaz: string) => ({
    backgroundColor: activeNamaz === namaz ? '#ff9800' : '#051842',
  });

  // Determine if we should display the iqamah change screen
  const shouldDisplayChangeTime = useMemo(() => {
    const alwaysDisplayIqamaahTime = masjidConfig?.data?.alwaysDisplayIqamaahTime;
    const displayTimerDuration = masjidConfig?.data?.displayTimerDuration; // in days
    
    // If alwaysDisplayIqamaahTime is true, always display
    if (alwaysDisplayIqamaahTime === true) {
      console.log('Display change time: ALWAYS (alwaysDisplayIqamaahTime = true)');
      return true;
    }
    
    // If displayTimerDuration is set and we have a next iqamah change
    if (displayTimerDuration && nextIqamahChange) {
      const now = getNow().startOf('day'); // Compare dates only, not time
      const changeDate = dayjs(nextIqamahChange.date).startOf('day');
      const daysUntilChange = changeDate.diff(now, 'day');
      
      console.log(`Display change time check: ${daysUntilChange} days until change, threshold: ${displayTimerDuration} days`);
      
      // Display if we're within the displayTimerDuration days BUT NOT on the change day itself
      // Because on the change day, the times will auto-update, so no need to show
      const shouldDisplay = daysUntilChange <= displayTimerDuration && daysUntilChange > 0;
      console.log(`Display change time: ${shouldDisplay ? 'YES' : 'NO'} (excluding change day itself)`);
      return shouldDisplay;
    }
    
    // Default: don't display
    console.log('Display change time: NO (no conditions met)');
    return false;
  }, [masjidConfig?.data?.alwaysDisplayIqamaahTime, masjidConfig?.data?.displayTimerDuration, nextIqamahChange]);

  // Alternate between a21 and a22+a23 every 10 seconds when shouldDisplayChangeTime is true
  useEffect(() => {
    if (!shouldDisplayChangeTime) {
      setShowA21(true);
      return;
    }

    const interval = setInterval(() => {
      setShowA21((prev) => !prev);
    }, 10000);

    return () => clearInterval(interval);
  }, [shouldDisplayChangeTime]);

  // const tickerTextF = () => {
  //   const text =

  // }

  return (
    <View style={styles.container}>
      {showSecondaryScreen ? (
        <View style={styles.animatedContainer}>
          <SecondaryScreen 
            todayData={todayData}
            iqamahTimes={iqamahTimes}
            maghribIqamahTime={maghribIqamahTime}
            activeNamaz={activeNamaz}
            formatTime={formatTime}
            formatDisplayTime={formatDisplayTime}
            formatDisplayFromDayjs={formatDisplayFromDayjs}
            getCardStyle={getCardStyle}
            currentPage={pagesData?.[currentPageIndex]}
            pageNumber={currentPageIndex + 1}
            totalPages={pagesData?.length || 0}
          />
          <View style={styles.ticker}>
            <Image
              source={require('@/assets/logo-bis-black.png')}
              style={styles.tickerLogo}
              resizeMode="contain"
            />
            <TextTicker
              style={styles.tickerText}
              loop
              scroll
              bounce={false}
              scrollSpeed={15}
              repeatSpacer={15}
              marqueeDelay={0}
              animationType="scroll"
            >
              {tickerText}
            </TextTicker>
          </View>
        </View>
      ) : (
        <View style={styles.animatedContainer}>
        <>
      <View style={styles.content}>
        <View style={styles.aBox}>
          <View style={styles.a1}>
            <ImageSlider 
              images={sliderImages} 
              secondaryText={zawalCountdown ? `Zawal time ends in: ${zawalCountdown}` : undefined}
              onLastImageComplete={handleLastImageComplete}
            />
          </View>
          <View style={styles.a2}>
            {showA21 ? (
            <View style={styles.a21}>
              <View style={[styles.a21FiveCard, getCardStyle('Fajr')]}>
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Fajr)}
                </Text>
                <Text style={styles.namazLabel}>FAJAR</Text>
                <Text style={styles.iqamahTime}>
                  {formatDisplayTime(iqamahTimes.Fajr)}
                </Text>
              </View>

              <View style={[styles.a21FiveCard, getCardStyle('Dhuhr')]}>
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Dhuhr)}
                </Text>
                <Text style={styles.namazLabel}>DEHUHR</Text>
                <Text style={styles.iqamahTime}>
                  {formatDisplayTime(iqamahTimes.Dhuhr)}
                </Text>
              </View>

              <View style={[styles.a21FiveCard, getCardStyle('Asr')]}>
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Asr)}
                </Text>
                <Text style={styles.namazLabel}>ASR</Text>
                <Text style={styles.iqamahTime}>
                  {formatDisplayTime(iqamahTimes.Asr)}
                </Text>
              </View>

              <View style={[styles.a21FiveCard, getCardStyle('Maghrib')]}>
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Maghrib)}
                </Text>
                <Text style={styles.namazLabel}>MAGHRIB</Text>
                <Text style={styles.iqamahTime}>
                  {formatDisplayFromDayjs(maghribIqamahTime)}
                </Text>
              </View>

              <View style={[styles.a21FiveCard, getCardStyle('Isha')]}>
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Isha)}
                </Text>
                <Text style={styles.namazLabel}>ISHA</Text>
                <Text style={styles.iqamahTime}>
                  {formatDisplayTime(iqamahTimes.Isha)}
                </Text>
              </View>
              {/* <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Fajr)}
                </Text>
                <Text style={styles.namazLabel}>Fajr</Text>
                <Text style={styles.iqamahTime}>1:00 AM</Text>
              </View> */}

              {/* <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Dhuhr)}
                </Text>
                <Text style={styles.namazLabel}>Duhur</Text>
                <Text style={styles.iqamahTime}>2:00 PM</Text>
              </View>

              <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Asr)}
                </Text>
                <Text style={styles.namazLabel}>Asr</Text>
                <Text style={styles.iqamahTime}>3:00 PM</Text>
              </View>

              <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Maghrib)}
                </Text>
                <Text style={styles.namazLabel}>Maghrib</Text>
                <Text style={styles.iqamahTime}>7:00 PM</Text>
              </View>

              <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Isha)}
                </Text>
                <Text style={styles.namazLabel}>Isha</Text>
                <Text style={styles.iqamahTime}>9:00 PM</Text>
              </View> */}
            </View>
            ) : (
            <>
            <View style={[styles.a22]}>
              <Text style={styles.changeLabel}>
                Iqamah times starting from{' '}
                <Text style={{ fontWeight: '900' }}>{changeDateLabel}</Text>{' '}
                will be as follows{' '}
              </Text>
            </View>
            <View style={styles.a23}>
              <View style={styles.a23FiveCard}>
                <Text style={styles.changeLabelBold}>Fajr</Text>
                <Text
                  style={
                    nextIqamahChange?.changes.fajr
                      ? styles.changeTimeBold
                      : styles.changeTime
                  }
                >
                  {formatDisplayTime(nextIqamahChange?.times.fajr)}
                </Text>
              </View>
              <View style={styles.a23FiveCard}>
                <Text style={styles.changeLabelBold}>Dhuhr</Text>
                <Text
                  style={
                    nextIqamahChange?.changes.dhuhr
                      ? styles.changeTimeBold
                      : styles.changeTime
                  }
                >
                  {formatDisplayTime(nextIqamahChange?.times.dhuhr)}
                </Text>
              </View>
              <View style={styles.a23FiveCard}>
                <Text style={styles.changeLabelBold}>Asr</Text>
                <Text
                  style={
                    nextIqamahChange?.changes.asr
                      ? styles.changeTimeBold
                      : styles.changeTime
                  }
                >
                  {formatDisplayTime(nextIqamahChange?.times.asr)}
                </Text>
              </View>
              <View style={styles.a23FiveCard}>
                <Text style={styles.changeLabelBold}>Maghrib</Text>
                <Text
                  style={
                    nextIqamahChange?.changes.maghrib
                      ? styles.changeTimeBold
                      : styles.changeTime
                  }
                >
                  {maghribChangeText}
                </Text>
              </View>
              <View style={styles.a23FiveCard}>
                <Text style={styles.changeLabelBold}>Isha</Text> 
                <Text
                  style={
                    nextIqamahChange?.changes.isha
                      ? styles.changeTimeBold
                      : styles.changeTime
                  }
                >
                  {formatDisplayTime(nextIqamahChange?.times.isha)}
                </Text>
              </View>
            </View>
            </>
            )}
          </View>
        </View>
        <View style={styles.bBox}>
          <View style={styles.b1}>
            <View style={styles.b11}>
              {' '}
              <Text style={styles.b11Text}>
                {todayData?.date?.hijri?.month?.en}{' '}
                {todayData?.date?.hijri?.day}, {todayData?.date?.hijri?.year}
              </Text>{' '}
            </View>
            <View style={styles.b12}>
              {' '}
              <Text style={styles.b12Text}>
                {todayData?.date?.gregorian?.weekday?.en},{' '}
                {todayData?.date?.gregorian?.month?.en}{' '}
                {todayData?.date?.gregorian?.day},{' '}
                {todayData?.date?.gregorian?.year}
              </Text>{' '}
            </View>
            <Divider style={styles.divider} />
            <View style={styles.b13}>
              {' '}
              <Text style={styles.b13Text}>{currentTime}</Text>
              {/* <Text style={styles.zawalText}>Zawal time ends in {currentTime}</Text> */}
            </View>
            <Divider style={styles.divider} />
            <View style={styles.b14}>
              <Text style={styles.b14Text}>Next Iqamah In</Text>{' '}
            </View>
            <View style={styles.b15}>
              {' '}
              <Text style={styles.b15Text}>{nextIqamahInText} </Text>{' '}
            </View>
            <Divider style={styles.divider} />
            <View style={styles.b16}>
              {' '}
              <Text style={styles.b16Text}>Juma'ah Timings</Text>{' '}
            </View>
            <View style={styles.b17}>
              <Text style={styles.b17Text}>
                {formatDisplayTime(todayIqamah?.jumuah?.[0])}
              </Text>
              <Text style={styles.divText}>|</Text>
              <Text style={styles.b18Text}>
                {formatDisplayTime(todayIqamah?.jumuah?.[1])}
              </Text>
            </View>
          </View>
          <View style={styles.b2}>
            <View style={styles.b21}>
              {/* <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Sunrise)}
                </Text>
                <Text style={styles.namazLabel}>Sunrise</Text>
              </View> */}
              {/* <View style={styles.a21FiveCard}>
                <Text style={styles.namazTime}>
                  {formatTime(namazData?.data[extractDate()].timings.Sunset)}
                </Text>
                <Text style={styles.namazLabel}>Sunset</Text>
              </View> */}


              <View style={[styles.a212FiveCard]}>
                <Image
                  source={require('@/assets/sunrise.png')}
                  style={styles.sunIcon}
                  resizeMode="contain"
                />
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Sunrise)}
                </Text>
                <Text style={styles.namazLabel}>Sunrise</Text>
              </View>


              <View style={[styles.a212FiveCard]}>
                <Image
                  source={require('@/assets/sunset.png')}
                  style={styles.sunIcon}
                  resizeMode="contain"
                />
                <Text style={styles.namazTime}>
                  {formatTime(todayData?.timings?.Sunset)}
                </Text>
                <Text style={styles.namazLabel}>Sunset</Text>
              </View>
            </View>
            <View style={styles.b22}>
              <View style={styles.qrCodeContainer}>
                <SimpleQRCode
                  link={masjidConfig?.data?.qrLink || ''}
                  size={80}
                />
              </View>
              <Text style={styles.b22Text}>Scan to Donate</Text>
              {/* <Text style={styles.b22Text}>BIS Masjid</Text> */}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.ticker}>
        <Image
          source={require('@/assets/logo-bis-black.png')}
          style={styles.tickerLogo}
          resizeMode="contain"
        />
        {/* <Text style={styles.tickerText}>
          Iqamaah timings are changing from January 01 2025 Iqamaah timings are changing from January 01 2025 Iqamaah timin
        </Text> */}
        {/* <ContinuousTicker text="Breaking News: React Native is awesome! I am good boy i am also gong there and here and also working hard with it. 🚀🔥" speed={50} /> */}
        {/* <TickerText text={"Please park appropriately and don't block any other cars or exits. In case you parked parallel please go out ASAP after prayers to move your vehicle|||Donate generously and become part of Mohsineen program by setting up monthly donations."} /> */}
        {/* <Ticker 
  text="This is a very long paragraph that will scroll continuously across the screen like a news ticker or headline banner as seen on television broadcasts and websites and other media outlets to grab attention and convey important information in a dynamic way."
  speed={60}
  style={{ backgroundColor: '#f0f0f0', padding: 10 }}
  textStyle={{ fontSize: 18, color: '#333' }}
/>  */}

        <TextTicker
          style={styles.tickerText}
          loop // infinite loop
          scroll // enable automatic scrolling
          bounce={false} // disable bounce
          scrollSpeed={15} // pixels per second (adjust for desired speed)
          repeatSpacer={15} // no space between repeats
          marqueeDelay={0} // start immediately
          animationType="scroll" // linear scroll
        >
          {tickerText}
        </TextTicker>
        {/* <Ticker textStyle={styles.tickerText} duration={2}>
          {tickerText}
</Ticker>; */}
      </View>
      </>
        </View>
      )}

      {/* Loading Overlay for Data Refresh */}
      {loadingStates.visible && (
        <Animated.View style={[styles.loadingOverlay, { opacity: loadingFadeAnim }]}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingTitle}>Refreshing Data...</Text>
            <View style={styles.loadingList}>
              {loadingStates.apis.map((api, index) => (
                <View key={index} style={styles.loadingItem}>
                  <View style={styles.loadingCheckbox}>
                    {api.completed ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : api.loading ? (
                      <ActivityIndicator size="small" color="#ff9800" />
                    ) : null}
                  </View>
                  <Text style={[
                    styles.loadingText,
                    api.completed && styles.loadingTextCompleted
                  ]}>
                    {api.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Announcement Overlay */}
      {/* Announcement Overlay - Must be last to show on top */}
      {showAnnouncement && (
        <View style={styles.announcementOverlay}>
          <BlurView
            style={styles.blurView}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
          />
          <View style={styles.announcementContainer}>
            <Text style={styles.announcementTitle}>ANNOUNCEMENT</Text>
            <Text style={styles.announcementText}>{announcementText}</Text>
          </View>
        </View>
      )}

      {/* Iqamah Countdown Overlay - Shows on top of everything */}
      {showIqamahCountdown && iqamahCountdownData && (
        <View style={styles.iqamahOverlay}>
          <BlurView
            style={styles.blurView}
            blurType="dark"
            blurAmount={10}
            reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.8)"
          />
          <View style={styles.iqamahCountdownContainer}>
            <View style={styles.clockCircle}>
              <Text style={styles.iqamahCountdownTime}>
                {iqamahCountdownData.secondsRemaining}
              </Text>
              <Text style={styles.secondsLabel}>SEC</Text>
            </View>
            <Text style={styles.iqamahCountdownTitle}>
              {iqamahCountdownData.name.toUpperCase()}
            </Text>
            <Text style={styles.iqamahCountdownLabel}>IQAMAH STARTING</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default Screen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },

  animatedContainer: {
    flex: 1,
  },

  content: {
    flex: 9,
    flexDirection: 'row',
  },

  aBox: {
    flex: 7,
    backgroundColor: '#ffffff',
  },

  a1: {
    flex: 8,
  },

  a2: {
    flex: 2,
  },
  a21: {
    flex: 5,

    flexDirection: 'row',
  },
  a21FiveCard: {
    flex: 2,
    padding: 10,
    backgroundColor: '#051842',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  a212FiveCard: {
    flex: 2,
    padding: 10,
    backgroundColor: '#005231',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  a22: {
    flex: 2,
    backgroundColor: '#051842',
    justifyContent: 'center',
    alignItems: 'center',
  },
  a23: {
    // backgroundColor: '#f26d6d',
    flex: 3,
    flexDirection: 'row',
  },
  a23FiveCard: {
    flex: 2,
    backgroundColor: '#051842',
    // backgroundColor: '#e82727',
    justifyContent: 'center',
    alignItems: 'center',
  },

  namazTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fdfdfd',
  },

  namazLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },

  iqamahTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  changeLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
  },

  changeTimeCut: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f0f0f0',
    textDecorationLine: 'line-through',
  },

  changeTime: {
    fontSize: 18,
    fontWeight: '400',
    color: '#ffffff',
  },
 changeLabelBold: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  changeTimeBold: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ff9800',
  },
  bBox: {
    flex: 3,
  },

  b1: {
    flex: 6,
    backgroundColor: '#f0f0f0',
  },
  b11: {
    paddingTop: 20,
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  b11Text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
  },
  b12: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  b12Text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
    paddingBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#c9c9c9',
  },
  b13: {
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  b13Text: {
    fontSize: 24,
    fontWeight: '700',
    color: '#131313',
  },
  zawalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff0000',
  },
  b14: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  b14Text: {
    paddingTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
  },
  b15: {
    justifyContent: 'center',
    paddingBottom: 10,
    alignItems: 'center',
  },
  b15Text: {
    fontSize: 24,
    fontWeight: '700',
    color: '#131313',
  },

  b16: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 13,
  },

  b16Text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
  },

  b17: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
    flexDirection: 'row',
  },

  b17Text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
  },

  divText: {
    paddingHorizontal: 5,
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
  },

  b18Text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#131313',
  },

  b2: {
    flex: 4,
    flexDirection: 'column',
  },

  b21: {
    flex: 5,
    flexDirection: 'row',
  },

  b22: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  qrCodeContainer: {
    flex: 3.5,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  b22Text: {
    flex: 5.5,
    fontSize: 16,
    fontWeight: '700',
    color: '#080808',
    textAlign: 'center',
  },

  ticker: {
    padding: 10,
    // flex: 0.5,
    backgroundColor: '#fdfdfd',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
  },

  tickerLogo: {
    position: 'absolute',
    right: 5,
    width: 110,
    height: 30,
    zIndex: 10,
    paddingRight: 10,
    paddingLeft: 10,
    backgroundColor: '#ffffff',
  },

  b281: {
    flex: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },

  sunIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
  },

  tickerText: {
    color: 'rgb(0, 0, 0)',
    fontSize: 22,
    fontWeight: '700',
  },

  iqamahOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  iqamahCountdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 40,
    paddingHorizontal: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    borderWidth: 1,
    borderColor: 'rgba(5, 24, 66, 0.1)',
  },

  clockCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#ff9800',
    shadowColor: '#ff9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  iqamahCountdownTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#051842',
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  iqamahCountdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  iqamahCountdownTime: {
    fontSize: 64,
    fontWeight: '700',
    color: '#ff9800',
  },

  secondsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    marginTop: 2,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },

  loadingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },

  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051842',
    marginBottom: 16,
    textAlign: 'center',
  },

  loadingList: {
    gap: 10,
  },

  loadingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  loadingCheckbox: {
    width: 24,
    height: 24,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },

  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },

  loadingTextCompleted: {
    color: '#333333',
  },

  announcementContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingVertical: 40,
    paddingHorizontal: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 300,
    maxWidth: 600,
    borderWidth: 3,
    borderColor: '#ff9800',
  },

  announcementTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#051842',
    marginBottom: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  announcementText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 32,
  },

  announcementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
