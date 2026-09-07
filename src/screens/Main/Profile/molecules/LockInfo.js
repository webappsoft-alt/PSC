import { BlurView } from "@react-native-community/blur";
import { Image, StyleSheet, View } from "react-native";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";
import { LockSvg } from "../../../../assets/svgs";
import { useTheme } from "../../../../contexts/ThemeContext";

const LockInfo = ({ coverImage }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? "dark" : "light"}
        blurAmount={1}
        reducedTransparencyFallbackColor={isDark ? "black" : "white"}
      />

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? COLORS.white16 : colors.surfaceAlt }]}>
          <LockSvg width={44} height={44} color={isDark ? COLORS.white : colors.text} />
        </View>

        <CustomText
          label="This Account is Private"
          fontSize={24}
          color={isDark ? COLORS.white : colors.text}
          fontFamily={fonts.semiBold}
          marginTop={18}
          textAlign="center"
        />

        <CustomText
          label="Follow this account to see their posts and photos."
          fontSize={14}
          color={isDark ? COLORS.gray64 : colors.textSecondary}
          marginTop={12}
          textAlign="center"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 500,
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 99,
    backgroundColor: COLORS.white16,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LockInfo;
