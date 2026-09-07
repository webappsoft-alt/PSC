import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import { Alert, View } from "react-native";
import fonts from "../../../assets/fonts";
import AuthSlider from "../../../components/Auth/AuthSlider";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import PhotosCover from "./molecules/PhotosCover";

const Branding = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const route = useRoute();
  const { eventData } = route?.params;
  const [media, setMedia] = useState([]);
  const { colors } = useTheme();

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);

  const handleContinue = () => {
    if (media.length === 0) {
      Alert.alert("Add at least one photo", "Please upload a cover photo.");
      return;
    }
    navigation.navigate("FoodBeverage", { media, isMedia: true, eventData });
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => (
        <>
          <Header title={"New event"} />
          <View style={{ marginHorizontal: 12 }}>
            <AuthSlider
              min={2}
              max={3}
              gap={4}
              marginTop={8}
              marginBottom={7}
              selectedColor={COLORS.buttonColor}
            />
          </View>
        </>
      )}
      footerUnScrollable={() => (
        <View style={{ padding: 12, marginBottom: 24 }}>
          <CustomButton
            title="Continue"
            marginBottom={8}
            onPress={handleContinue}
          />
        </View>
      )}
      scrollEnabled
    >
      <CustomText
        label={"Branding"}
        fontSize={24}
        fontFamily={fonts.semiBold}
        lineHeight={24 * 1.4}
        marginTop={8}
      />

      <CustomText
        label={
          "Please inform your Event’s details as accurately as possible here below:"
        }
        fontSize={14}
        lineHeight={14 * 1.4}
        color={colors.iconMuted}
        marginBottom={16}
      />

      <PhotosCover media={media} setMedia={setMedia} />
    </ScreenWrapper>
  );
};

export default Branding;
