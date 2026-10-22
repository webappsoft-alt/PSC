import { useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import CustomText from "../CustomText";
import Icons from "../Icons";
import fonts from "../../assets/fonts";
import { useAuthPalette } from "./AuthKit";

/**
 * Masked PIN cells + on-screen keypad (ported from Viral's PinPad), with the
 * PSC "Define-A-PIN-Code" values:
 *  cells  — 6 × (Fill × 80), gap 8, radius 12, FFFFFF 4%, focused 2px white,
 *           "*" Medium 32 (64% empty, white filled)
 *  keypad — 40 below, keys 75 × 72 radius 100 FFFFFF 8% (Glass), columns
 *           22 apart, rows 20 apart, digits Medium 32, delete_forever 32 EE1045.
 */
const CELL_HEIGHT = 80;
const CELL_GAP = 8;
const CELL_RADIUS = 12;
const KEY_W = 75;
const KEY_H = 72;
const KEY_COL_GAP = 22;
const KEY_ROW_GAP = 20;
const KEYPAD_TOP = 40;

const FOCUS_SPRING = { damping: 20, stiffness: 260, mass: 0.6 };
const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

const haptic = (type = "impactLight") => {
  try {
    ReactNativeHapticFeedback.trigger(type, {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
  } catch (e) {}
};

/**
 * Figma gives the keys a Glass effect; on a flat background what reads is the
 * lit rim — a hairline gradient bright at the top-left — over the 8% fill.
 */
const KeySurface = ({ bg, tint }) => (
  <LinearGradient
    colors={[
      "rgba(255, 255, 255, 0.5)",
      "rgba(255, 255, 255, 0.07)",
      "rgba(255, 255, 255, 0.22)",
    ]}
    locations={[0, 0.55, 1]}
    start={{ x: 0.1, y: 0 }}
    end={{ x: 0.9, y: 1 }}
    pointerEvents="none"
    style={styles.keySurface}
  >
    <View style={[styles.keyFill, { backgroundColor: bg }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0.14)",
          "rgba(255, 255, 255, 0.035)",
          "rgba(255, 255, 255, 0)",
        ]}
        locations={[0, 0.4, 0.75]}
        start={{ x: 0.35, y: 0 }}
        end={{ x: 0.65, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
    </View>
  </LinearGradient>
);

const PinPad = ({ value, onChange, length = 6, error = false, disabled }) => {
  const p = useAuthPalette();
  const [rowWidth, setRowWidth] = useState(0);
  const cellWidth =
    rowWidth > 0 ? (rowWidth - CELL_GAP * (length - 1)) / length : 0;
  const focusIndex = Math.min(value.length, length - 1);
  const focusVisible = !error && value.length < length && cellWidth > 0;

  const focusX = useSharedValue(0);
  const focusOpacity = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!cellWidth) return;
    const x = focusIndex * (cellWidth + CELL_GAP);
    if (!placed.current) {
      placed.current = true;
      focusX.value = x;
    } else {
      focusX.value = withSpring(x, FOCUS_SPRING);
    }
  }, [cellWidth, focusIndex]);

  useEffect(() => {
    focusOpacity.value = withTiming(focusVisible ? 1 : 0, { duration: 160 });
  }, [focusVisible]);

  useEffect(() => {
    if (error) haptic("notificationError");
  }, [error]);

  const focusStyle = useAnimatedStyle(() => ({
    opacity: focusOpacity.value,
    transform: [{ translateX: focusX.value }],
  }));

  const press = (key) => {
    if (disabled) return;
    if (key === "del") {
      if (!value.length) return;
      haptic();
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= length) return;
    haptic();
    onChange(value + key);
  };

  return (
    <View>
      <View
        style={styles.cellRow}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w !== rowWidth) setRowWidth(w);
        }}
      >
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  backgroundColor: p.t04,
                  borderColor: error ? p.error : "transparent",
                },
              ]}
            >
              <CustomText
                label="*"
                fontSize={32}
                fontFamily={fonts.medium}
                color={error ? p.error : filled ? p.text : p.t64}
              />
            </View>
          );
        })}
        {cellWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.focus,
              { width: cellWidth, borderColor: p.text },
              focusStyle,
            ]}
          />
        ) : null}
      </View>

      <View style={styles.keypad}>
        {ROWS.map((row, r) => (
          <View key={r} style={styles.keyRow}>
            {row.map((key, c) =>
              key ? (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.6}
                  disabled={disabled || (key === "del" && !value.length)}
                  onPress={() => press(key)}
                  style={styles.key}
                  accessibilityLabel={key === "del" ? "Delete last digit" : key}
                >
                  <KeySurface bg={p.deep} tint={p.t08} />
                  {key === "del" ? (
                    <Icons
                      family="MaterialSymbolsRoundedFilled"
                      name="delete_forever"
                      size={26}
                      color={p.error}
                    />
                  ) : (
                    <CustomText
                      label={key}
                      fontSize={32}
                      fontFamily={fonts.medium}
                      color={p.text}
                    />
                  )}
                </TouchableOpacity>
              ) : (
                <View key={`s${c}`} style={styles.key} />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default PinPad;

const styles = StyleSheet.create({
  cellRow: {
    flexDirection: "row",
    gap: CELL_GAP,
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    borderRadius: CELL_RADIUS,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  focus: {
    position: "absolute",
    left: 0,
    top: 0,
    height: CELL_HEIGHT,
    borderRadius: CELL_RADIUS,
    borderWidth: 2,
  },
  keypad: {
    marginTop: KEYPAD_TOP,
    alignItems: "center",
    rowGap: KEY_ROW_GAP,
  },
  keyRow: {
    flexDirection: "row",
    columnGap: KEY_COL_GAP,
  },
  key: {
    width: KEY_W,
    height: KEY_H,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  keySurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
    padding: 1,
  },
  keyFill: {
    flex: 1,
    borderRadius: 100,
    overflow: "hidden",
  },
});
