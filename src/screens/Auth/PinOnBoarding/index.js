import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";

const PinOnBoarding = ({ route }) => {
  const state = route?.params?.state;
  const navigation = useNavigation();
  return (
    <ScreenWrapper
      footerUnScrollable={() => (
        <View style={{ padding: 14, marginBottom: 20 }}>
          <CustomButton
            title="Create a PIN Code"
            marginBottom={8}
            rightIcon={Images.lock}
            onPress={() => navigation.navigate("PinCode", { state })}
            secondBorderColor={COLORS.gray2}
            isBoarder
          />
          <CustomButton
            title="Later"
            backgroundColor={COLORS.lightGray}
            color={COLORS.primaryColor}
            onPress={() => navigation.navigate("AllowNotification")}
          />
        </View>
      )}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 30,
        }}
      >
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name="pin"
          size={80}
          color="#8C8C8C"
        />
        <CustomText
          label="PIN Code"
          fontSize={32}
          lineHeight={32 * 1.4}
          marginTop={26}
          fontFamily={fonts.semiBold}
        />
        <CustomText
          label="Would you like to make your next login fast and highly secured?"
          color={COLORS.gray1}
          textAlign="center"
          marginTop={12}
          lineHeight={14 * 1.4}
        />
      </View>
    </ScreenWrapper>
  );
};

export default PinOnBoarding;
