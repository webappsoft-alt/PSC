import { useNavigation, useRoute } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";

import fonts from "../../../assets/fonts";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const DOCUMENT_TYPES = ["ID Card", "Passport"];

const VerifyIdentity = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { subscription, fromProfile } = route.params || {};

  const [selectedDocument, setSelectedDocument] = useState("ID Card");

  const handleContinue = () => {
    navigation.navigate("TakeIDFront", { subscription, fromProfile });
  };

  return (
    <ScreenWrapper
      barStyle={"dark-content"}
      headerUnScrollable={() => <Header title="Verify Identify " />}
    >
      <CustomText
        fontSize={24}
        marginTop={16}
        fontFamily={fonts.semiBold}
        label="Choose a document to validate your identity"
      />

      <CustomText
        label="Please upload your document directly to the app. Scans and copies will not be accepted."
        fontSize={16}
        marginTop={4}
        marginBottom={35}
        color={isDark ? COLORS.gray64 : colors.textSecondary}
      />

      <View
        style={{ borderRadius: 16, backgroundColor: isDark ? COLORS.blackOpacity04 : colors.surfaceAlt }}
      >
        {DOCUMENT_TYPES.map((item, i) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.toggleCard,
              {
                borderBottomWidth: i === 0 ? 1 : 0,
                borderTopLeftRadius: i == 0 && 12,
                borderTopRightRadius: i == 0 && 12,
                borderBottomLeftRadius: i == 1 && 12,
                borderBottomRightRadius: i == 1 && 12,
                backgroundColor: isDark ? COLORS.inputBg : colors.surfaceAlt,
                borderBottomColor: isDark ? COLORS.white16 : colors.border,
              },
            ]}
            onPress={() => setSelectedDocument(item)}
            activeOpacity={0.8}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <Icons
                family="MaterialCommunityIcons"
                name={
                  selectedDocument === item
                    ? "radiobox-marked"
                    : "radiobox-blank"
                }
                size={20}
                color={
                  selectedDocument === item ? COLORS.buttonColor : (isDark ? COLORS.gray48 : colors.textSecondary)
                }
              />

              <ImageFast
                source={Images.idCard}
                style={styles.documentIcon}
                tintColor={isDark ? COLORS.primaryDark : colors.text}
              />

              <CustomText
                label={item}
                fontSize={18}
                fontFamily={fonts.medium}
              />
            </View>

            <Icons
              size={20}
              family="Feather"
              name={"chevron-right"}
              color={isDark ? COLORS.gray64 : colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionButtonsContainer}>
        <CustomButton
          title="Continue"
          onPress={handleContinue}
          backgroundColor={COLORS.background}
          isBoarder
          secondBorderColor={COLORS.buttonColor}
          marginBottom={8}
        />
        <CustomButton
          isBottom
          title="Pass"
          color={isDark ? COLORS.white : colors.text}
          backgroundColor={isDark ? COLORS.white04 : colors.surfaceAlt}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "PersonalAds" }] })
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default VerifyIdentity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white16,
  },
  documentIcon: {
    width: 32,
    height: 32,
    marginHorizontal: 12,
    resizeMode: "contain",
  },
  actionButtonsContainer: {
    marginTop: "auto",
  },
});
