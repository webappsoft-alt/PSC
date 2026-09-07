import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated } from "react-native";

const SimpleProgressBar = ({ min, max, marginTop, bg }) => {
  const progressRefs = useRef(
    Array.from({ length: max }, () => new Animated.Value(0))
  );

  useEffect(() => {
    // Reset all animations when min changes
    progressRefs.current.forEach((animValue) => {
      animValue.setValue(0);
    });

    const animateSequentially = (index) => {
      if (index >= min) return;

      Animated.timing(progressRefs.current[index], {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      }).start(() => {
        animateSequentially(index + 1);
      });
    };

    // Start animation from beginning
    animateSequentially(0);
  }, [min, max]); // Adding max as dependency for safety

  return (
    <View style={[styles.container, { marginTop: marginTop || 20 }]}>
      <View style={styles.sliderTrack}>
        {Array.from({ length: max }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.block,
              {
                backgroundColor: bg || "#FFFFFF29",
                overflow: "hidden",
              },
            ]}
          >
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: "#FFFFFF", // Fixed color (removed extra #)
                width: progressRefs.current[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default SimpleProgressBar;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  sliderTrack: {
    width: "95%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  block: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});
