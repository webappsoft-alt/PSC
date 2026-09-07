import { StyleSheet, View } from "react-native";
import fonts from "../../assets/fonts";
import { COLORS } from "../../utils/COLORS";
import CustomText from "../CustomText";
import Icons from "../Icons";
import AuthSlider from "./AuthSlider";
import { useTheme } from "../../contexts/ThemeContext";

const AuthHeader = ({
  title = "Registration",
  subtitle = "Choose your user type",
  step = 1,
  totalSteps = 6,
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: isDark ? COLORS.primaryColor : colors.background }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <CustomText
            label={title}
            fontFamily={fonts.semiBold}
            fontSize={20}
            color={isDark ? COLORS?.white : colors.text}
          />
          <CustomText
            label={subtitle}
            fontFamily={fonts.regular}
            fontSize={14}
            color={isDark ? COLORS.gray64 : colors.textSecondary}
          />
        </View>
        <View style={styles.right}>
          <CustomText
            label={`${step}/${totalSteps}`}
            fontFamily={fonts.semiBold}
            fontSize={16}
            lineHeight={16 * 1.4}
            marginRight={10}
            color={isDark ? COLORS.white : colors.text}
          />
          <View style={[styles.infoCircle, { backgroundColor: isDark ? "#FFFFFF14" : "rgba(18, 18, 18, 0.06)" }]}>
            <Icons
              family="MaterialIcons"
              name="info-outline"
              size={24}
              color={isDark ? COLORS.white : colors.text}
            />
          </View>
        </View>
      </View>
      <AuthSlider min={step || 1} max={totalSteps || 6} marginTop={12} />
    </View>
  );
};

export default AuthHeader;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: COLORS.primaryColor,
    paddingTop: 24,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    // alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: "row",
    // alignItems: "center",
  },
  infoCircle: {
    width: 44,
    height: 44,
    borderRadius: 99,
    backgroundColor: "#FFFFFF14",
    alignItems: "center",
    justifyContent: "center",
  },
});
