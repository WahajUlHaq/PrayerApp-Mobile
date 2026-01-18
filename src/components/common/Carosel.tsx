import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, Image, StyleSheet, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

interface BannerCarouselProps {
  images: string[];
  autoScrollInterval?: number;
  width?: number;
  height?: number;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
  images,
  autoScrollInterval = 10000,
  width: carouselWidth = 690,
  height: carouselHeight = 290,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll effect
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
      progressAnim.setValue(0); // reset progress
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: autoScrollInterval,
        useNativeDriver: false,
      }).start();
    }, autoScrollInterval);

    // start first progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: autoScrollInterval,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, [currentIndex, images.length, autoScrollInterval]);

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
              source={{ uri: item }}
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
    bottom: 16,
    right: 16,
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
