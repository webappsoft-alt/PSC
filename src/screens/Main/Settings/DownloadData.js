import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const reasons = [
  {
    id: 1,
    title: "All Data",
    description: "Download everything",
    image: Images.settings_chat,
  },
  {
    id: 2,
    title: "Posts",
    description: "Your posts and captions",
    image: Images.settings_img,
  },
  {
    id: 3,
    title: "Videos",
    description: "Your video content",
    image: Images.settings_video,
  },
  {
    id: 4,
    title: "Messages",
    description: "Your conversations with others",
    image: Images.settings_chat,
  },
  {
    id: 5,
    title: "Profile Data",
    description: "Account information",
    image: Images.settings_file,
  },
];

const DownloadData = () => {
  const navigate = useNavigation();
  const { colors } = useTheme();

  const [selectedReason, setSelectedReason] = useState(reasons[0]);

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Request Data" />}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <CustomButton
            icon={Images.download}
            title={"Request Download"}
            backgroundColor={colors.text}
            color={colors.background}
            marginBottom={24}
          />
        </View>
      )}
    >
      <CustomText
        label={
          "Get insights into the type of information stored for you account. Select what data you would like to download."
        }
        fontSize={14}
        lineHeight={14 * 1.4}
        color={colors.textSecondary}
        marginBottom={12}
        marginTop={8}
      />
      <CustomText
        label="Why are you leaving?"
        fontSize={16}
        fontFamily={fonts.medium}
        marginBottom={12}
        marginTop={15}
      />

      {reasons.map((item, index) => {
        const active = selectedReason === item;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => setSelectedReason(item)}
            style={[
              styles.reasonItem,
              {
                backgroundColor: active ? colors.text : colors.surface,
                borderColor: colors.surfaceAlt,
              },
            ]}
            activeOpacity={0.8}
          >
            <Image
              source={item?.image}
              style={{
                height: 24,
                width: 24,
                resizeMode: "contain",
                tintColor: active ? colors.background : colors.textSecondary,
              }}
            />
            <View>
              <CustomText
                label={item?.title}
                fontSize={16}
                fontFamily={fonts.medium}
                color={active ? colors.background : colors.text}
              />
              <CustomText
                label={item?.description}
                fontSize={12}
                color={active ? colors.background : colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      <CustomText
        label="What To Expect"
        fontSize={16}
        fontFamily={fonts.medium}
        marginTop={24}
        marginBottom={10}
      />

      {[
        "Archive will be ready within 24-48 hours",
        "You will receive an email notification",
        "Download link will be valid for 7 days",
        "Data will be in JSON format",
        "Media files will be included",
      ].map((item, index) => (
        <View key={index} style={styles.infoItem}>
          <ErrorComponent errorTitle={item} />
        </View>
      ))}
    </ScreenWrapper>
  );
};

export default DownloadData;
const styles = StyleSheet.create({
  warningBox: {
    backgroundColor: "#EE104529",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  reasonItem: {
    backgroundColor: COLORS.black,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  reasonActive: {
    backgroundColor: COLORS.white,
    borderWidth: 0,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.gray1,
  },

  checkboxActive: {
    backgroundColor: "#64CD75",
    borderColor: "#64CD75",
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: COLORS.gray1,
  },
});
