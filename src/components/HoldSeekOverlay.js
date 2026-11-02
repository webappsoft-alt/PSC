import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import fonts from "../assets/fonts";
import CustomText from "./CustomText";
import Icons from "./Icons";
import { HOLD_SEEK_RATE } from "../hooks/useHoldSeek";

/**
 * Viral's hold-to-seek hint (components/HoldSeekOverlay.tsx): a pulsing
 * double arrow + "1.5×" centred in the half being held.
 */
const HoldSeekOverlay = ({ side }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!side) return undefined;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, side]);

  if (!side) return null;
  const backward = side === "backward";
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.half, backward ? styles.left : styles.right]}>
        <Animated.View style={[styles.cluster, { transform: [{ scale }] }]}>
          <Icons
            family="MaterialSymbolsRounded"
            name={backward ? "keyboard_double_arrow_left" : "keyboard_double_arrow_right"}
            size={28}
            color="#FFFFFF"
          />
          <CustomText
            label={`${HOLD_SEEK_RATE}×`}
            fontSize={13}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.2}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default HoldSeekOverlay;

const styles = StyleSheet.create({
  half: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  left: { left: 0 },
  right: { right: 0 },
  cluster: { alignItems: "center", gap: 2 },
});
