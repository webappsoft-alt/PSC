import { StatusBar, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import QRCode from "react-native-qrcode-svg";

import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const LoginQRCode = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const userData = useSelector((state) => state?.users?.userData);
  const userId = userData?._id || userData?.user?._id;

  // Login QR payload. When the backend issues a one-time QR login token this
  // value should be replaced with that token / deep-link.
  const qrValue = userId
    ? `psc://login?u=${userId}`
    : "psc://login";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor="transparent"
        translucent
      />

      <Header title="Using QR-Code" textTransform="none" />

      <View style={styles.content}>
        <CustomText
          label="Login with QR-Code"
          fontFamily={fonts.semiBold}
          fontSize={24}
          lineHeight={24 * 1.4}
          marginTop={10}
          marginBottom={8}
          color={isDark ? COLORS.white : colors.text}
        />
        <CustomText
          label="If you already have a Sola account, scan this QR-Code while in another Sola App and easily regain access to your account by scanning this QR-Code."
          fontFamily={fonts.regular}
          fontSize={14}
          lineHeight={14 * 1.4}
          color={isDark ? COLORS.gray64 : colors.textSecondary}
          marginBottom={32}
        />

        <View
          style={[
            styles.qrBox,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(18,18,18,0.04)",
            },
          ]}
        >
          <QRCode
            value={qrValue}
            size={208}
            color={isDark ? COLORS.white : COLORS.primaryColor}
            backgroundColor="transparent"
          />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <CustomButton
          title="Use Email Address"
          backgroundColor={isDark ? COLORS.white : colors.text}
          color={isDark ? COLORS.primaryColor : colors.background}
          onPress={() => navigation.navigate("Login", { tab: "email" })}
          marginBottom={12}
        />
        <CustomButton
          title="Use Phone Number"
          backgroundColor={isDark ? COLORS.white04 : colors.surfaceAlt}
          color={isDark ? COLORS.white : colors.text}
          onPress={() => navigation.navigate("Login", { tab: "phone" })}
        />
      </View>
    </View>
  );
};

export default LoginQRCode;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  qrBox: {
    width: 272,
    height: 272,
    borderRadius: 12,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
});
