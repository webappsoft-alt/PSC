import { StyleSheet, View } from "react-native";
import fonts from "../../../assets/fonts";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import AgreementCard from "./molecules/AgreementCard";
import ConditionCard from "./molecules/ConditionCard";
import CountrySelectionCard from "./molecules/CountrySelectionCard";

const InvestmentScreen = () => {
  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title={"Invest in PSC"} />}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <CustomButton
            title={"I understand and Want To Invest"}
            width="95%"
            marginBottom={12}
          />
        </View>
      )}
    >
      <CustomText
        label={"Define how much you want to invest below"}
        fontSize={24}
        fontFamily={fonts.semiBold}
        marginTop={8}
      />
      <CustomText
        label={
          "This is what you would get if you save your money in these banks. (APY Comparison)"
        }
        fontSize={14}
        color={"rgba(255, 255, 255, 0.64)"}
        marginTop={8}
      />

      <CountrySelectionCard />
      <AgreementCard />
      <ConditionCard />
    </ScreenWrapper>
  );
};

export default InvestmentScreen;

const styles = StyleSheet.create({});
