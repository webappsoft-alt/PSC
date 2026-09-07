import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { put } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const PRIVACY_OPTIONS = [
  { key: "public", title: "Public", subtitle: "Everyone" },
  {
    key: "private",
    title: "Private",
    subtitle: "Privately explore and enjoy the app.",
  },
  // { key: "premium", title: "Premium", subtitle: "First Monday of the month" },
  // { key: "premiumPlus", title: "Premium Plus", subtitle: "First Monday of the month" },
];

const ProfilePrivacy = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [selected, setSelected] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    const res = await put("user/profile", {
      profilePrivacy: selected,
    });
    if (res?.data) {
      navigation.reset({
        index: 0,
        routes: [{ name: "MainStack" }],
      });
    }
    setLoading(false);
  };

  const renderOption = (opt) => {
    const isSelected = selected === opt.key;
    return (
      <TouchableOpacity
        key={opt.key}
        activeOpacity={0.8}
        onPress={() => setSelected(opt.key)}
        style={[
          styles.optionCard,
          {
            backgroundColor: isDark ? "#1B1B1B" : colors.surfaceAlt,
            borderColor: isDark ? "#2A2A2A" : colors.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <CustomText
            label={opt.title}
            color={isDark ? COLORS.white : colors.text}
            fontFamily={fonts.medium}
            fontSize={16}
            lineHeight={16 * 1.4}
          />
          <CustomText
            label={opt.subtitle}
            color={isDark ? COLORS.gray2 : colors.textSecondary}
            fontSize={12}
            lineHeight={12 * 1.4}
          />
        </View>
        <View
          style={[styles.radioOuter, isSelected && styles.radioOuterActive]}
        >
          <View
            style={[styles.radioInner, isSelected && styles.radioInnerActive]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper
      paddingHorizontal={24}
      backgroundImage={isDark ? Images.authBg : undefined}
      imageBottom={0}
      footerUnScrollable={() => (
        <View style={{ padding: 14, marginBottom: 20 }}>
          <CustomButton
            title="Continue"
            isBoarder
            secondBorderColor={isDark ? COLORS.gray2 : colors.border}
            marginBottom={12}
            onPress={handleContinue}
            loading={loading}
          />
          {/* <CustomButton
            title="Maybe Later"
            backgroundColor="#FFFFFF29"
            color={COLORS.white}
          /> */}
        </View>
      )}
    >
      <View style={{ justifyContent: "center", flex: 1 }}>
        <CustomText
          label="Profile Privacy"
          color={isDark ? COLORS.white : colors.text}
          fontFamily={fonts.semiBold}
          fontSize={18}
          lineHeight={18 * 1.4}
        />
        <CustomText
          label="Choose who can see your profile."
          color={isDark ? COLORS.gray2 : colors.textSecondary}
          lineHeight={14 * 1.4}
        />
        <View style={{ marginTop: 16 }}>
          {PRIVACY_OPTIONS.map(renderOption)}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ProfilePrivacy;

const styles = StyleSheet.create({
  optionCard: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#6D6D6D",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: {
    borderColor: COLORS.buttonColor,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "transparent",
  },
  radioInnerActive: {
    backgroundColor: COLORS.buttonColor,
  },
});
