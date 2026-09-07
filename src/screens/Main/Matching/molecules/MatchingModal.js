import { Image, StyleSheet, View } from "react-native";

import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";

import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";

const MatchingModal = ({
  isVisible,
  onDisable,
  imgSource,
  title,
  subtitle,
  btnTitle1,
  btnTitle2,
  btnSubtitle,
  onBtn1Press,
}) => {
  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.mainContainer}>
        <View style={styles.row}>
          <CustomText
            label={title || "Super likes"}
            fontFamily={fonts.semiBold}
            fontSize={40}
          />
          <Image source={imgSource} style={{ height: 32, width: 32 }} />
        </View>
        <CustomText
          label={
            subtitle ||
            "Stand out with Super Likes and get much more chance to connect with other like minded profiles."
          }
          color={"rgba(255, 255, 255, 0.64)"}
        />

        <View
          style={{
            alignItems: "center",
            marginTop: 20,
            gap: 8,
          }}
        >
          <CustomButton
            title={btnTitle1 || "Clear All"}
            secondText={btnSubtitle}
            height={56}
            backgroundColor={COLORS.lightGray}
            color={COLORS.primaryColor}
            onPress={onBtn1Press}
            fontFamily={fonts.semiBold}
          />
          <CustomButton
            title={btnTitle2 || "Confirm"}
            height={56}
            backgroundColor={"#FFFFFF0A"}
            color={COLORS.white}
          />
        </View>
      </View>
    </CustomModal>
  );
};

export default MatchingModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: COLORS.black, //#121212A3
    borderRadius: 22,
  },
  icon: {
    height: 16,
    width: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  filterIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedItem: {
    backgroundColor: "#f3f3f3",
  },
});
