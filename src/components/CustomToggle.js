import { TouchableOpacity, View, StyleSheet, Animated } from "react-native";
import React, { useState, useEffect } from "react";
import { COLORS } from "../utils/COLORS";

const CustomToggle = ({
  value = false,
  setValue,
  activeColor,
  inactiveColor,
}) => {
  const [isToggled, setIsToggled] = useState(value);
  const [animation] = useState(new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    if (value !== isToggled) {
      setIsToggled(value);
      Animated.spring(animation, {
        toValue: value ? 1 : 0,
        useNativeDriver: true,
      }).start();
    }
  }, [value]);

  const handleToggle = () => {
    Animated.spring(animation, {
      toValue: isToggled ? 0 : 1,
      useNativeDriver: true,
    }).start();
    setIsToggled(!isToggled);
    if (setValue) {
      setValue(!isToggled);
    }
  };

  const toggleStyle = {
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 20],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
      <View
        style={[
          styles.toggleContainer,
          isToggled
            ? { backgroundColor: activeColor || "#2b8355" }
            : { backgroundColor: inactiveColor || "#a81735" },
        ]}
      >
        <Animated.View style={[styles.toggleCircle, toggleStyle]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    width: 51,
    height: 30,
    borderRadius: 100,
    justifyContent: "center",
    padding: 2,
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 100,
    backgroundColor: COLORS.white,
  },
});

export default CustomToggle;
