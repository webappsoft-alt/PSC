import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const ChatHeader = ({ title, location, type, showIcons = false, user }) => {
  const navigation = useNavigation();
  const [isViewModal, setIsViewModal] = useState(false);
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  console.log("location====", typeof location);

  return (
    <View style={[styles.mainContainer]}>
      <TouchableOpacity
        activeOpacity={0.6}
        style={[styles.backIcon]}
        onPress={() => navigation.goBack()}
      >
        <Icons
          size={26}
          family="MaterialIcons"
          color={colors.text}
          name="keyboard-arrow-left"
        />
      </TouchableOpacity>

      {/* <ImageFast resizeMode="cover" source={source} style={styles.userImage} /> */}
      <View style={{ flex: 1 }}>
        <View style={styles.row}>
          {/* <View style={styles.onlineDot} /> */}
          <CustomText
            label={title || "Catie, 24"}
            fontSize={20}
            fontFamily={fonts.semiBold}
            onPress={() => navigation.navigate("UserProfile", { item: user })}
          />
        </View>
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          {location && (
            <>
              <ImageFast
                resizeMode="contain"
                source={Images.pindrop}
                tintColor={colors.textSecondary}
                style={{ height: 15, width: 15, marginLeft: -3 }}
              />
              <CustomText
                label={location ? location : "No Location Available"}
                fontFamily={fonts.semiBold}
                color={colors.textSecondary}
                fontSize={12}
              />
              {type && <View style={styles.sparator} />}
            </>
          )}
          {type && (
            <CustomText
              label={type}
              fontFamily={fonts.semiBold}
              color={colors.textSecondary}
              fontSize={12}
            />
          )}
        </View>
      </View>
      {showIcons && (
        <>
          <TouchableOpacity activeOpacity={0.6} style={[styles.backIcon]}>
            <ImageFast
              resizeMode="contain"
              source={Images.ChatSetting}
              style={{ height: 15, width: 15, marginLeft: -3 }}
            />
          </TouchableOpacity>
        </>
      )}

      <CustomModal
        isChange
        isVisible={isViewModal}
        onDisable={() => setIsViewModal(false)}
      >
        <View style={[styles.modalContainer]}>
          <View style={[styles.container]}>
            <CustomButton
              title="Block"
              marginBottom={10}
              indicatorcolor={"#fff"}
              customText={styles.txt}
              customStyle={styles.btn}
              backgroundColor="transparent"
            />
            <CustomButton
              title="Report"
              marginBottom={10}
              customText={styles.txt}
              customStyle={styles.btn}
              backgroundColor="transparent"
              onPress={() => {
                setIsViewModal(false);
                navigation.navigate("ReportChat");
              }}
            />
            <CustomButton
              height={50}
              title="Cancel"
              color={colors.background}
              marginBottom={10}
              backgroundColor={colors.text}
              onPress={() => setIsViewModal(false)}
              customText={{ fontFamily: fonts.medium }}
            />
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

export default ChatHeader;

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 15,
  },
  backIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.white04,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  userImage: {
    width: 24,
    height: 24,
    borderRadius: 50,
    marginRight: 10,
  },
  btn: {
    height: 47,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  txt: {
    fontFamily: fonts.medium,
    color: COLORS.red1,
  },
  modalContainer: {
    padding: 5,
    width: "95%",
    alignSelf: "center",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.card,
    borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : colors.border,
    overflow: "hidden",
    marginVertical: "auto",
  },
  container: {
    width: "100%",
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.background,
    paddingBottom: 0,
    overflow: "hidden",
    paddingTop: 20,
  },

  onlineDot: {
    backgroundColor: "#64CD75",
    width: 8,
    height: 8,
    marginRight: 3,
    borderRadius: 100,
  },

  sparator: {
    backgroundColor: colors.textSecondary,
    width: 4,
    height: 4,
    borderRadius: 100,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
