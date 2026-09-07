import Slider from "@react-native-community/slider";
import {StyleSheet, View} from "react-native";
import fonts from "../../../../assets/fonts";
import CustomInput from "../../../../components/CustomInput";
import CustomText from "../../../../components/CustomText";
import Divider from "../../../../components/Divider";
import ErrorComponent from "../../../../components/ErrorComponent";
import { COLORS } from "../../../../utils/COLORS";
import Text from "../../../../components/ScaledText";

const AgreementCard = () => {
  return (
    <View>
      <Divider marginVertical={32} />
      <CustomText
        label={"Contractual Agreement"}
        fontFamily={fonts.semiBold}
        fontSize={24}
      />

      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 12,
          color: "rgba(255, 255, 255, 0.64)",
        }}
      >
        You will find below all information regarding the following contract
        between
        <Text
          style={{ fontFamily: fonts.medium, fontSize: 12, color: "white" }}
        >
          {" Sola Group "}
        </Text>
        and
        <Text
          style={{ fontFamily: fonts.medium, fontSize: 12, color: "white" }}
        >
          {" Yourself."}
        </Text>
      </Text>

      <CustomInput
        withLabel={"INVESTMENT AMOUNT"}
        value={"$2’000"}
        marginTop={32}
        marginBottom={0.1}
        // error={"Average investments amount: $5,902.30"}
      />
      <ErrorComponent
        errorTitle={"Average investments amount: "}
        highlight={"$5,902.30"}
        marginTop={6}
      />
      <Divider marginVertical={32} />

      <CustomText
        label={"Duration"}
        fontFamily={fonts.medium}
        fontSize={14}
        color={"rgba(255, 255, 255, 0.64)"}
      />
      <View style={{ marginTop: 16 }}>
        <Slider
          value={1}
          onValueChange={() => {}}
          minimumValue={0}
          maximumValue={4}
          step={1}
          minimumTrackTintColor={COLORS.buttonColor}
          maximumTrackTintColor={"#2A2A2A"}
          thumbTintColor={COLORS.buttonColor}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <CustomText label={"6mo"} fontFamily={fonts.semiBold} fontSize={16} />
          <CustomText label={"1y"} fontFamily={fonts.semiBold} fontSize={16} />
          <CustomText label={"2y"} fontFamily={fonts.semiBold} fontSize={16} />
          <CustomText label={"3y"} fontFamily={fonts.semiBold} fontSize={16} />
          <CustomText label={"5y"} fontFamily={fonts.semiBold} fontSize={16} />
        </View>
      </View>
      <Divider marginVertical={32} />

      <CustomText label={"5%"} fontFamily={fonts.semiBold} fontSize={32} />

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <CustomText label={"PSC's"} fontFamily={fonts.semiBold} fontSize={12} />
        <CustomText
          label={" interest rate based on the amount invested."}
          fontFamily={fonts.semiBold}
          fontSize={12}
          color={"rgba(255, 255, 255, 0.64)"}
        />
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}
      >
        <CustomText
          label={"$105’000"}
          fontFamily={fonts.semiBold}
          fontSize={32}
        />
        <CustomText
          label={".00"}
          fontFamily={fonts.semiBold}
          fontSize={32}
          color={"rgba(255, 255, 255, 0.64)"}
        />
      </View>

      <CustomText
        label={"Amount returned"}
        color={"rgba(255, 255, 255, 0.64)"}
      />

      <CustomInput
        withLabel={"LENDER FULLNAME"}
        value={"Viktor Sola"}
        marginTop={32}
        marginBottom={0.1}
        // error={"Average investments amount: $5,902.30"}
      />
      <ErrorComponent
        errorTitle={"Should be matching your ID."}
        marginTop={6}
      />

      <Divider marginVertical={32} />
    </View>
  );
};

export default AgreementCard;

const styles = StyleSheet.create({});
