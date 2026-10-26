import { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { SECTION_PAD_H, SHOWS } from "./showsLayout";

/** Loading state for the Show-Feed: the section shapes, pulsing. */
const Box = ({ opacity, style }) => (
  <Animated.View style={[{ backgroundColor: SHOWS.white04, opacity }, style]} />
);

const SkeletonSection = ({ opacity, card }) => (
  <View style={styles.section}>
    <View style={styles.header}>
      <View style={{ gap: 6 }}>
        <Box opacity={opacity} style={{ width: 80, height: 8, borderRadius: 4 }} />
        <Box opacity={opacity} style={{ width: 140, height: 13, borderRadius: 4 }} />
      </View>
      <Box opacity={opacity} style={{ width: 78, height: 16, borderRadius: 8 }} />
    </View>
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ width: card.w, gap: 8 }}>
          <Box
            opacity={opacity}
            style={{ width: card.w, height: card.h, borderRadius: card.r }}
          />
          {card.lines ? (
            <>
              <Box opacity={opacity} style={{ width: card.w * 0.5, height: 12, borderRadius: 2 }} />
              <Box opacity={opacity} style={{ width: card.w, height: 36, borderRadius: 4 }} />
            </>
          ) : null}
        </View>
      ))}
    </ScrollView>
  </View>
);

const ShowsFeedSkeleton = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.list}>
      <SkeletonSection opacity={opacity} card={{ w: 240, h: 135, r: 12, lines: true }} />
      <SkeletonSection opacity={opacity} card={{ w: 140, h: 140, r: 12 }} />
      <SkeletonSection opacity={opacity} card={{ w: 96, h: 96, r: 48 }} />
      <SkeletonSection opacity={opacity} card={{ w: 108, h: 148, r: 12 }} />
    </View>
  );
};

export default ShowsFeedSkeleton;

const styles = StyleSheet.create({
  list: {
    gap: 1,
  },
  section: {
    backgroundColor: SHOWS.section,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SECTION_PAD_H,
  },
  row: {
    gap: 8,
    paddingHorizontal: SECTION_PAD_H,
  },
});
