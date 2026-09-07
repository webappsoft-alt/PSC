import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { COLORS } from "../../../utils/COLORS";
import SocialCard from "./molecules/SocialCard";

const AddSocials = () => {
  return (
    <ScreenWrapper
      headerUnScrollable={() => (
        <Header title={"Add Your Socials"} fontFamily={fonts.abril} />
      )}
    >
      <View style={styles.row}>
        <TopTab rounded tabNames={["General", "General"]} />
        <TouchableOpacity style={styles.readAllBtn}>
          <CustomText
            label="Read All"
            fontSize={14}
            lineHeight={14 * 1.4}
            color={COLORS.primaryColor}
            fontFamily={fonts.medium}
            marginRight={4}
          />
          <Image
            source={Images.msg}
            style={{ height: 16, width: 16, tintColor: COLORS.white }}
          />
        </TouchableOpacity>
      </View>

      <SocialCard />
    </ScreenWrapper>
  );
};

export default AddSocials;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  readAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF14",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
  },
});
