import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import Divider from "../../../components/Divider";
import Icons from "../../../components/Icons";
import { del } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const reasons = [
  "Taking a break",
  "Privacy concerns",
  "Too many notifications",
  "Lack of features",
  "Something else",
];

const DeactivateAccount = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigation();

  const [selectedReason, setSelectedReason] = useState("Privacy concerns");
  const [password, setPassword] = useState("");
  const [isValidPassword, setIsValidPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (text) => {
    setPassword(text);
    setIsValidPassword(text.length >= 6);
  };

  const handleDeactivate = async () => {
    if (!agree) {
      ToastMessage("Please agree to the terms and conditions", "error");
      return;
    }

    if (!isValidPassword) {
      ToastMessage("Enter a valid password", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await del("user/delete", {
        status: "deleted",
        reason: selectedReason,
      });
      if (response?.data?.success) {
        ToastMessage("Account deactivated", "success");
        dispatch(setUserData(null));
        AsyncStorage.removeItem("token");
        navigate.reset({
          index: 0,
          routes: [{ name: "AuthStack" }],
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Deactivate Your Account" />}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <CustomButton
            icon={Images.trash}
            title={"Delete My account"}
            backgroundColor={"#EE1045"}
            color={COLORS.white}
            marginBottom={24}
            onPress={handleDeactivate}
            loading={loading}
          />
        </View>
      )}
    >
      <View style={styles.warningBox}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={Images.warning}
            style={{ height: 24, width: 24, resizeMode: "contain" }}
          />
          <CustomText
            label={"Warning"}
            fontSize={24}
            color={"#EE1045"}
            lineHeight={24 * 1.4}
            fontFamily={fonts.semiBold}
          />
        </View>

        <CustomText
          label="Deactivating your account will hide your profile and content from other users. You can reactivate within 30 days time period."
          fontSize={14}
          color={colors.textSecondary}
          lineHeight={14 * 1.4}
        />
      </View>

      <CustomText
        label="Why are you leaving?"
        fontSize={16}
        fontFamily={fonts.medium}
        marginBottom={16}
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
            <CustomText
              label={item}
              fontSize={16}
              fontFamily={fonts.medium}
              color={active ? colors.background : colors.text}
            />
          </TouchableOpacity>
        );
      })}

      <CustomText
        label="Confirm Your Password"
        fontSize={16}
        fontFamily={fonts.medium}
        marginTop={8}
        marginBottom={10}
      />

      <CustomInput
        withLabel="Your current password"
        secureTextEntry
        placeholder="********"
        value={password}
        onChangeText={validatePassword}
      />

      <ErrorComponent
        errorTitle="Valid password"
        isValid={isValidPassword}
        color={isValidPassword ? "#64CD75" : colors.textSecondary}
      />
      <Divider thickness={1} color={COLORS.inputBg} marginBottom={0} />
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgree(!agree)}
        activeOpacity={0.8}
      >
        <Icons
          family="MaterialCommunityIcons"
          name={agree ? "check-circle" : "radiobox-blank"}
          size={24}
          color={agree ? COLORS.buttonColor : colors.textSecondary}
        />

        <CustomText
          label="I understand that my account will be deactivated. I can reactivate it within 30 days"
          fontSize={12}
        />
      </TouchableOpacity>
      <Divider thickness={1} color={COLORS.inputBg} marginBottom={0} />
      <CustomText
        label="What happens when you deactivate"
        fontSize={16}
        fontFamily={fonts.medium}
        marginTop={14}
        marginBottom={10}
      />

      {[
        "Your profile will be hidden",
        "Your posts will not be visible",
        "People will not be able to find you",
        "You can reactivate your account within 30 days",
        "After 30 days, your account will be permanently deleted",
      ].map((item, index) => (
        <View key={index} style={styles.infoItem}>
          <ErrorComponent errorTitle={item} />
        </View>
      ))}
    </ScreenWrapper>
  );
};

export default DeactivateAccount;
const styles = StyleSheet.create({
  warningBox: {
    backgroundColor: "#EE104529",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  reasonItem: {
    backgroundColor: COLORS.black,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
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
