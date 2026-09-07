import { StyleSheet, View } from "react-native";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";

import { Images } from "../../../assets/images";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomText from "../../../components/CustomText";

import { useNavigation, useRoute } from "@react-navigation/native";
import fonts from "../../../assets/fonts";
import ImageFast from "../../../components/ImageFast";
import { useTheme } from "../../../contexts/ThemeContext";

const TakeSelfi = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { frontSide, backSide, subscription, fromProfile } = route.params || {};

  const onPress = () => {
    navigation.navigate("CaptureSelfi", {
      backSide,
      frontSide,
      subscription,
      fromProfile,
    });
  };

  return (
    <ScreenWrapper
      barStyle={"dark-content"}
      headerUnScrollable={() => <Header title="Verifying Your Identity " />}
      footerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          <AuthFooter onPress={onPress} />
        </View>
      )}
    >
      <View
        style={{
          height: 344,
          width: 343,
          alignSelf: "center",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <ImageFast
          source={Images.selfi}
          style={styles.img}
          resizeMode="contain"
        />
      </View>
      <CustomText
        fontSize={32}
        marginTop={30}
        alignSelf="center"
        label="Take a selfie"
        fontFamily={fonts.semiBold}
      />
      <CustomText
        fontSize={14}
        alignSelf="center"
        textAlign="center"
        color={isDark ? COLORS.gray64 : colors.textSecondary}
        label="We use your selfie to compare your identity photo"
      />
    </ScreenWrapper>
  );
};

export default TakeSelfi;

const styles = StyleSheet.create({
  img: {
    height: "100%",
    width: "100%",
    borderRadius: 16,
  },
});
