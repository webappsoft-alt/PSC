import { StyleSheet, View } from "react-native";
import { COLORS } from "../../utils/COLORS";
import { useTheme } from "../../contexts/ThemeContext";
import { BlurView } from "@react-native-community/blur";

const AuthSlider = ({
  min,
  max,
  marginTop,
  marginBottom,
  gap,
  height = 4,
  width,
  selectedColor,
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { marginTop: marginTop || 20, marginBottom, width },
      ]}
    >
      <View style={[styles.sliderTrack, { gap }]}>
        {/* <BlurView
          blurType="light"
          blurAmount={32}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        /> */}
        {Array.from({ length: max }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.block,
              {
                backgroundColor:
                  index < min
                    ? selectedColor
                      ? selectedColor
                      : colors.text
                    : isDark
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(18, 18, 18, 0.12)",
                height,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default AuthSlider;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  sliderTrack: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 100,
    overflow: "hidden",
  },
  block: {
    flex: 1,
  },
});
