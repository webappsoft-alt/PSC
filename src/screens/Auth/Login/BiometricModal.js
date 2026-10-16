import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BlurView } from "@react-native-community/blur";

import CustomButton from "../../../components/CustomButton";
import CustomModal from "../../../components/CustomModal";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";

import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const BiometricModal = ({
  isVisible,
  onDisable,
  biometricType,
  onLoginFirst,
}) => {
  const { colors, isDark } = useTheme();
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View
        style={{
          padding: 5,
          width: "95%",
          alignSelf: "center",
          borderRadius: 24,
          marginBottom: 12,
          maxHeight: "100%",
          borderWidth: 1,
          backgroundColor: isDark ? "#FFFFFF29" : "rgba(18, 18, 18, 0.08)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(18, 18, 18, 0.12)",
        }}
      >
        <BlurView
          style={{
            maxHeight: "100%",
            width: "100%",
            borderRadius: 24,
          }}
          blurType={isDark ? "dark" : "light"}
          blurAmount={26}
          reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "rgba(18, 18, 18, 0.08)"}
        />

        <View style={[styles.mainContainer, { backgroundColor: isDark ? COLORS.black : colors.background }]}>
          <View style={styles.row}>
            <CustomText
              label={`Setup ${
                biometricType === "TouchID"
                  ? "Touch ID"
                  : biometricType === "FaceID"
                  ? "Face ID"
                  : "Fingerprint"
              }`}
              fontFamily={fonts.semiBold}
              fontSize={24}
            />
            <TouchableOpacity
              onPress={onDisable}
              style={{
                height: 32,
                width: 32,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Icons
                family="MaterialSymbolsRounded"
                name="close"
                size={18}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <CustomText
            label={
              "You can use biometric authentication for quick and secure access to your account."
            }
            fontFamily={fonts.medium}
            color={isDark ? COLORS.gray1 : colors.textSecondary}
          />
          <View>
            <CustomButton
              title="Continue"
              marginTop={24}
              onPress={onLoginFirst}
              marginBottom={10}
            />
            <CustomButton
              title="Later"
              backgroundColor={isDark ? COLORS.lightGray : colors.surfaceAlt}
              onPress={onDisable}
              color={isDark ? COLORS.black : colors.text}
            />
          </View>
        </View>
      </View>
      <CustomText
        color={isDark ? COLORS.white : colors.text}
        label="Biometric authentication is used to secure your account."
        alignSelf="center"
        textAlign="center"
        fontSize={12}
        fontFamily={fonts.medium}
        marginBottom={20}
        width="90%"
        marginTop={4}
      />
    </CustomModal>
  );
};

export default BiometricModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    padding: 12,
    borderRadius: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
