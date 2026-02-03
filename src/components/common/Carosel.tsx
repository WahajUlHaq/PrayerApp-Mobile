import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Image, StyleSheet, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

interface Banner {
  url: string;
  duration?: number;
  filename?: string;
  size?: number;
  mimeType?: string;
  order?: number;
}

interface BannerCarouselProps {
  images: Banner[];
  autoScrollInterval?: number;
  width?: number;
  height?: number;
  onLastImageComplete?: () => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  images,
  autoScrollInterval = 10000,
  width: carouselWidth = 680,
  height: carouselHeight = 300,
  onLastImageComplete,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Auto-scroll effect with individual durations
  useEffect(() => {
    if (images.length <= 1) return;

    const currentBanner = images[currentIndex];
    const duration = (currentBanner?.duration || autoScrollInterval / 1000) * 1000; // Convert to milliseconds
    
    console.log(`Banner ${currentIndex} duration: ${duration}ms`);
    
    // Clear any existing timer and animation
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }

    // Start progress animation for current slide
    progressAnim.setValue(0);
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });
    animationRef.current.start();

    // Schedule next slide
    timerRef.current = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      
      // Check if we're completing the last image
      if (currentIndex === images.length - 1 && onLastImageComplete) {
        console.log('Last image completed, triggering callback');
        onLastImageComplete();
      }
      
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [currentIndex, images, autoScrollInterval, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { width: carouselWidth, height: carouselHeight }]}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={[styles.list, { width: carouselWidth, height: carouselHeight }]}
        contentContainerStyle={styles.listContent}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: carouselWidth, height: carouselHeight }]}
          >
            <Image
              source={{ uri: item.url }}
              style={[styles.image, { width: carouselWidth, height: carouselHeight }]}
              resizeMode="stretch"
            />
          </View>
        )}
        onScrollToIndexFailed={() => {}}
      />

      {/* Progress bar overlay */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressBackdrop} />
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    height: '100%',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  progressWrapper: {
    position: 'absolute',
    bottom: 15,
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

export default BannerCarousel;
