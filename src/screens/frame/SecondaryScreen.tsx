import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import TextTicker from 'react-native-text-ticker';
import dayjs from 'dayjs';
import { activateKeepAwake, deactivateKeepAwake } from "@sayem314/react-native-keep-awake";

interface SecondaryScreenProps {
  todayData: any;
  iqamahTimes: {
    Fajr?: string;
    Dhuhr?: string;
    Asr?: string;
    Maghrib?: string;
    Isha?: string;
  };
  maghribIqamahTime: dayjs.Dayjs | null;
  activeNamaz: string | null;
  formatTime: (timeString?: string) => string;
  formatDisplayTime: (value?: string | null, fallback?: string) => string;
  formatDisplayFromDayjs: (value?: dayjs.Dayjs | null, fallback?: string) => string;
  getCardStyle: (namaz: string) => { backgroundColor: string };
  currentPage?: {
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
  };
  pageNumber: number;
  totalPages: number;
}

const SecondaryScreen: React.FC<SecondaryScreenProps> = ({
  todayData,
  iqamahTimes,
  maghribIqamahTime,
  activeNamaz,
  formatTime,
  formatDisplayTime,
  formatDisplayFromDayjs,
  getCardStyle,
  currentPage,
  pageNumber,
  totalPages,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('SecondaryScreen mounted');
    activateKeepAwake();
    return () => {
      deactivateKeepAwake();
    };
  }, []);

  useEffect(() => {
    if (!currentPage) return;

    const duration = (currentPage.pageDuration || 10) * 1000;

    // Reset and start progress animation
    progressAnim.setValue(0);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });
    animation.start();

    return () => {
      animation.stop();
    };
  }, [currentPage, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {currentPage && (
          <View style={styles.pageContent}>
            {currentPage.pageType === 'text' && (
              <>
                <Text style={styles.pageTitle}>{currentPage.title}</Text>
                <Text style={styles.pageText}>{currentPage.content}</Text>
              </>
            )}
            
            {currentPage.pageType === 'image' && currentPage.imageUrl && (
              <Image
                source={{ uri: currentPage.imageUrl }}
                style={styles.pageImage}
                resizeMode="stretch"
              />
            )}
            
            {currentPage.pageType === 'image-text' && (
              <>
                {currentPage.imageUrl && (
                  <Image
                    source={{ uri: currentPage.imageUrl }}
                    style={styles.pageImage}
                resizeMode="contain"
                  />
                )}
                {currentPage.content && (
                  <View style={styles.textOverlay}>
                    <Text style={styles.overlayText}>{currentPage.content}</Text>
                  </View>
                )}
              </>
            )}
            
            {/* Progress bar overlay */}
            <View style={styles.progressWrapper}>
              <View style={styles.progressBackdrop} />
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </View>
        )}
        
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
             {/* <View style={[styles.a21FiveCard, getCardStyle('Isha')]}>
            <Text style={styles.namazTime}>
              {formatTime(todayData?.timings?.Isha)}
            </Text>
            <Text style={styles.namazLabel}>ISHA</Text>
            <Text style={styles.iqamahTime}>
              {formatDisplayTime(iqamahTimes.Isha)}
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
          </View> */}
        </View>
      </View>
  );
};

export default SecondaryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 10,
    justifyContent: 'flex-end',
  },  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#051842',
    marginBottom: 20,
    textAlign: 'center',
  },
  pageText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 32,
  },
  pageImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
 sunIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
  },  
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000ac',
    padding: 8,
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  a21: {
    height: 90,
    flexDirection: 'row',
  },
  a21FiveCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#051842',
    justifyContent: 'space-around',
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
  ticker: {
    padding: 10,
       flex: 0.5,

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
  tickerText: {
    color: 'rgb(0, 0, 0)',
    fontSize: 16,
    fontWeight: '700',
  },
  a212FiveCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#005231',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  progressWrapper: {
    // position: 'absolute',
    // bottom: 10,
    // right: 16,
    // width: 50,
    // height: 10,
    // borderRadius: 2,
    // overflow: 'hidden',
    position: 'absolute',
    bottom: 5,
    right: 15,
    width: 50,
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4af37',
  },
});
