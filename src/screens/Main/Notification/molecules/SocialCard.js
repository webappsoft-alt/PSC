import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";

const SocialCard = ({ day }) => {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <CustomText
          label={day || "Today"}
          fontFamily={fonts.medium}
          fontSize={18}
          lineHeight={18 * 1.4}
        />
        <Icons
          family="Ionicons"
          name="chevron-down-outline"
          size={12}
          marginLeft={4}
          color={COLORS.gray64}
        />
      </View>
    </View>
  );
};

export default SocialCard;

const styles = StyleSheet.create({});
