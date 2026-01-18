import ImageSlider from '@/components/common/Carosel';
import SimpleQRCode from '@/components/common/qr';
import TextTicker from 'react-native-text-ticker'

import {
  useBanners,
  useIqamahTimes,
  useMasjidConfig,
  useNamazTimings,
  useTickers,
} from '@/api/hooks/use-frame-data';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text, Animated, Image } from 'react-native';
import { Divider } from 'react-native-paper';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';

// dayjs.extend(utc);
// dayjs.extend(timezone);
dayjs.extend(duration);

const Screen = () => {
  const [currentTime, setCurrentTime] = useState('--:--');
  const animation = useRef(new Animated.Value(0)).current;
  const { data: namazData } = useNamazTimings();
  const { data: bannersData } = useBanners();
  const { data: masjidConfig } = useMasjidConfig();
  const { data: tickersData } = useTickers();
  const timeZone = masjidConfig?.data?.timeZone;
  const getNow = () =>  dayjs()
  const iqamahYear = masjidConfig?.data?.year ?? getNow().year();
  const iqamahMonth = masjidConfig?.data?.month ?? getNow().month() + 1;
  const { data: iqamahData } = useIqamahTimes(iqamahYear, iqamahMonth);

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [animation]);

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

  useEffect(() => {
    if (!namazData?.data?.length) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setCurrentTime(getNow().format('hh:mm:ss A'));
      setActiveNamaz(getCurrentNamaz());
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
  }, [namazData]);

  const backgroundColor1 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#c51111', '#840202'],
  });
  const backgroundColor2 = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#840202', '#c51111'],
  });

  const animatedStyle1 = { backgroundColor: backgroundColor1 } as const;
  const animatedStyle2 = { backgroundColor: backgroundColor2 } as const;
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

    return null;
  };

  const nextIqamah = getNextIqamah();
  const nextIqamahIn = nextIqamah
    ? dayjs.duration(nextIqamah.time.diff(getNow()))
    : null;
  const nextIqamahInText = nextIqamahIn
    ? `${String(nextIqamahIn.hours()).padStart(2, '0')}:${String(nextIqamahIn.minutes()).padStart(2, '0')}:${String(nextIqamahIn.seconds()).padStart(2, '0')}`
    : '--:--';
  const bannerImages = bannersData?.data?.map((banner) => banner.url) ?? [];

  const sliderImages = bannerImages.length ? bannerImages : [];
  const fallbackTickerText =
    'Announcement: Timings are changing from Jan 1 • Please check the latest schedule •';
  const parseTickerText = (text?: string | null) => {
    const raw = text?.trim();
    if (!raw) return null;
    return raw
      .split('|||')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('     •     ');
  };
  const tickerFromConfig = parseTickerText(masjidConfig?.data?.tickerText);
  const tickerFromApi = tickersData?.data
    ?.map((item) => parseTickerText(item.text))
    .filter(Boolean)
    .join( '     •     ');
  const tickerText = tickerFromApi || tickerFromConfig || fallbackTickerText;

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

  const maghribChangeText = 
    `Sunset+${maghribAdditionMinutes}`

  const getCardStyle = (namaz: string) => ({
    backgroundColor: activeNamaz === namaz ? '#ff9800' : '#051842',
  });

  // const tickerTextF = () => {
  //   const text =

  // }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.aBox}>
          <View style={styles.a1}>
            <ImageSlider images={sliderImages} />
          </View>
          <View style={styles.a2}>
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
                <Text style={styles.namazLabel}>DHUHR</Text>
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
            <Animated.View style={[styles.a22]}>
              <Text style={styles.changeLabel}>
                Iqamah times starting from <Text style={{ fontWeight: '900' }}>{changeDateLabel}</Text> will be as
                follows{' '}
              </Text>
            </Animated.View>
            <Animated.View style={[styles.a23]}>
              <View style={styles.a23FiveCard}>
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
            </Animated.View>
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
              <Text style={styles.b13Text}>{currentTime}</Text>{' '}
            </View>
            <Divider style={styles.divider} />
            <View style={styles.b14}>
              {' '}
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
          duration={15000}
          loop
          bounce
          repeatSpacer={50}
          marqueeDelay={1000}
        >
{tickerText}
        </TextTicker>

      </View>
    </View>
  );
};

export default Screen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
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
    flex: 6,
  },

  a2: {
    flex: 4,
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
    backgroundColor: '#909090',
    justifyContent: 'center',
    alignItems: 'center',
  },
  a23: {
    backgroundColor: '#686868',
    flex: 3,
    flexDirection: 'row',
  },
  a23FiveCard: {
    flex: 2,
    backgroundColor: '#909090',
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
    fontWeight: '300',
    color: '#ffffff',
  },

  changeTimeBold: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  bBox: {
    flex: 3,
  },

  b1: {
    flex: 6,
    backgroundColor: '#e0e0e0',
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
    backgroundColor: '#131313',
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
    flex: 1,
    backgroundColor: '#fdfdfd',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
  },

  tickerLogo: {
    position: 'absolute',
    right: 0,
    width: 90,
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
    fontSize: 13,
    fontWeight: '700',
  },
});
