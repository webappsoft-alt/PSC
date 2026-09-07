import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { useState } from "react";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import ImageFast from "../../../components/ImageFast";

import { put } from "../../../services/ApiRequest";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";
import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const PersonalAds = ({ route }) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const push = route.params?.push;
  const [loadingButton, setLoadingButton] = useState(null);

  const handleSelection = async (allowAds, buttonType) => {
    setLoadingButton(buttonType);
    const res = await put("user/profile", {
      notificationPreferences: {
        push: push,
        email: false,
        sms: false,
      },
      enhancedTailoredAds: allowAds,
    });
    if (res?.data) {
      navigation.navigate("ProfilePrivacy");
    }
    setLoadingButton(null);
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
            marginBottom={8}
            onPress={() => handleSelection(true, "continue")}
            loading={loadingButton === "continue"}
            isBoarder
            secondBorderColor={isDark ? COLORS.gray2 : colors.border}
          />
          <CustomButton
            title="Maybe Later"
            backgroundColor={isDark ? "#FFFFFF29" : colors.surfaceAlt}
            color={isDark ? COLORS.white : colors.text}
            onPress={() => handleSelection(false, "maybe")}
            loading={loadingButton === "maybe"}
            bgBlur={isDark}
          />
        </View>
      )}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ImageFast
          source={Images.Switch}
          style={{ height: 80, width: 80 }}
          resizeMode="contain"
          tintColor={isDark ? undefined : colors.text}
        />
        <CustomText
          label={`Enhanced &\n tailored ads`}
          fontSize={32}
          lineHeight={28 * 1.4}
          marginTop={12}
          color={isDark ? COLORS.white : colors.text}
          fontFamily={fonts.semiBold}
          textAlign="center"
        />
        <View style={{ width: "80%" }}>
          <CustomText
            label={
              "We care about your privacy and want to maximize your chances of coming across products or services that appeal to you."
            }
            color={isDark ? COLORS.subtitle : colors.textSecondary}
            textAlign="center"
            marginTop={10}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default PersonalAds;

const styles = StyleSheet.create({});
