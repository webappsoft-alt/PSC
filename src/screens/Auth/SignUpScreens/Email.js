import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import ErrorComponent from "../../../components/ErrorComponent";
import CustomInput from "../../../components/CustomInput";
import CustomPhoneInput from "../../../components/CustomPhoneInput";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { SlidingSegmentControl } from "../../../components/Auth/SlidingSegmentControl";

import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { isValidEmail, isValidPhone } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../contexts/ThemeContext";

const SelectCard = ({
  icon,
  iconFamily = "MaterialSymbolsRoundedFilled",
  title,
  desc,
  selected,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.selectCard,
        {
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(18, 18, 18, 0.08)",
        },
      ]}
    >
      <View style={styles.selectCardText}>
        <View style={styles.selectCardTitleRow}>
          {icon ? (
            <Icons
              family={iconFamily}
              name={icon}
              size={18}
              color={isDark ? COLORS.white : colors.text}
              marginRight={6}
            />
          ) : null}
          <CustomText
            label={title}
            fontFamily={fonts.medium}
            fontSize={16}
            lineHeight={16 * 1.4}
            color={isDark ? COLORS.white : colors.text}
          />
        </View>
        <CustomText
          label={desc}
          fontFamily={fonts.regular}
          fontSize={14}
          lineHeight={14 * 1.4}
          color={isDark ? COLORS.gray64 : colors.textSecondary}
        />
      </View>
      <Icons
        family={
          selected ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"
        }
        name={selected ? "check_circle" : "radio_button_unchecked"}
        size={24}
        color={
          selected
            ? COLORS.buttonColor
            : isDark
            ? COLORS.gray64
            : colors.textSecondary
        }
      />
    </TouchableOpacity>
  );
};

const Email = forwardRef(
  (
    {
      currentIndex,
      setCurrentIndex,
      state,
      setState,
      setLoadingState,
      setBtnDisabled,
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();

    const [email, setEmail] = useState(state?.email || "");
    const [phoneNumber, setPhoneNumber] = useState(state?.phone || "");
    const [contactMethod, setContactMethod] = useState(
      state?.phone ? "phone" : "email",
    );
    const [verifyVia, setVerifyVia] = useState(state?.verifyVia || "sms");
    const [allowMarketing, setAllowMarketing] = useState(
      state?.allowMarketing ?? true,
    );
    const [enhancedTailoredAds, setEnhancedTailoredAds] = useState(
      state?.enhancedTailoredAds ?? false,
    );
    const [error, setError] = useState("");
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
      if (contactMethod === "email") {
        setBtnDisabled?.(!email.trim());
      } else {
        setBtnDisabled?.(!phoneNumber.trim());
      }
    }, [email, phoneNumber, contactMethod]);

    const greeting =
      state?.addressing === "lastname" && state?.last_name
        ? `Hello ${state?.gender === "female" ? "Ms." : "Mr."} ${
            state.last_name
          }`
        : state?.full_name
        ? `Hi ${state.full_name}`
        : "Hello";

    const submit = async () => {
      const isEmail = contactMethod === "email";

      if (isEmail && !isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }
      if (!isEmail && !isValidPhone(phoneNumber)) {
        setError("Please enter a valid phone number");
        return;
      }
      setError("");

      const identifier = isEmail
        ? { email: email.trim() }
        : { phone: phoneNumber.trim() };

      setState({
        ...state,
        email: isEmail ? email.trim() : "",
        phone: isEmail ? "" : phoneNumber.trim(),
        verifyVia,
        allowMarketing,
        enhancedTailoredAds,
      });

      try {
        setLoading(true);
        if (setLoadingState) setLoadingState(true);

        const res = await post(`auth/send-otp`, {
          ...identifier,
          ...(!isEmail && { verifyVia }),
        });

        if (res?.data?.success) {
          Alert.alert("OTP Received", res.data?.code?.toString(), [
            { text: "OK", onPress: () => setCurrentIndex(10) },
          ]);
        } else {
          setError(
            res?.data?.message || "Failed to send OTP. Please try again.",
          );
        }

        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      } catch (err) {
        ToastMessage(err?.message, "error");
        if (err?.message?.includes("already registered")) {
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        }
        setError("Error sending OTP. Please try again.");
        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      }
    };

    const back = () => {
      setCurrentIndex(8);
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: isLoading }));

    return (
      <View style={styles.container}>
        <View>
          <SlidingSegmentControl
            items={[
              { key: "phone", label: "Phone Number" },
              { key: "email", label: "Email" },
            ]}
            selectedKey={contactMethod}
            onChange={(key) => {
              setContactMethod(key);
              setError("");
            }}
            trackColor={colors.surfaceAlt}
            pillColor={colors.text}
            activeLabelColor={colors.background}
            inactiveLabelColor={isDark ? COLORS.gray64 : colors.textSecondary}
            style={styles.toggle}
          />

          <CustomText
            label={greeting}
            fontFamily={fonts.regular}
            fontSize={16}
            lineHeight={16 * 1.4}
            color={isDark ? COLORS.gray64 : colors.textSecondary}
          />
          <CustomText
            label={
              contactMethod === "email"
                ? "What is your email?"
                : "What is your phone number?"
            }
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            letterSpacing={-0.24}
            marginBottom={8}
            color={isDark ? COLORS.white : colors.text}
          />

          {contactMethod === "email" ? (
            <CustomInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError("");
              }}
              error={error}
              marginBottom={8}
              placeholder="E.g. abc@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          ) : (
            <View>
              <CustomPhoneInput
                value={phoneNumber}
                setValue={(val) => {
                  setPhoneNumber(val);
                  if (error) setError("");
                }}
                withLabel="PHONE NUMBER"
                marginBottom={8}
              />
              <View pointerEvents="none" style={styles.phoneRightIcon}>
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="call"
                  size={18}
                  color={COLORS.buttonColor}
                />
              </View>
            </View>
          )}

          <ErrorComponent
            errorTitle={`Please enter a valid ${
              contactMethod === "email" ? "email address" : "phone number"
            }.`}
            color={isDark ? COLORS.gray2 : colors.textSecondary}
            font={fonts.regular}
            marginBottom={4}
          />
          <ErrorComponent
            errorTitle={`We will later use this ${
              contactMethod === "email" ? "email" : "phone number"
            } to verify your account.`}
            color={isDark ? COLORS.gray2 : colors.textSecondary}
            font={fonts.regular}
            marginBottom={16}
          />

          {contactMethod === "email" ? (
            <>
              <SelectCard
                title="I Want To"
                desc="receive the latest news about PSC, and promotional offers."
                selected={allowMarketing}
                onPress={() => setAllowMarketing(!allowMarketing)}
              />
              <SelectCard
                title="I Am Okay To"
                desc="have a more tailor-made experience while keeping my data anonymous to content providers."
                selected={enhancedTailoredAds}
                onPress={() => setEnhancedTailoredAds(!enhancedTailoredAds)}
              />
            </>
          ) : (
            <>
              <SelectCard
                icon="sms"
                title="Verify Using SMS"
                desc="Receive a verification code on your phone using the SMS method."
                selected={verifyVia === "sms"}
                onPress={() => setVerifyVia("sms")}
              />
              <SelectCard
                icon="whatsapp"
                iconFamily="MaterialCommunityIcons"
                title="Verify Using Whatsapp"
                desc="Receive a verification code on your Whatsapp using data method."
                selected={verifyVia === "whatsapp"}
                onPress={() => setVerifyVia("whatsapp")}
              />
            </>
          )}
        </View>
      </View>
    );
  },
);

export default Email;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
  toggle: {
    marginTop: 4,
    marginBottom: 16,
  },
  phoneRightIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    height: 32,
    width: 32,
    borderRadius: 100,
    backgroundColor: "rgba(161, 147, 117, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  selectCardText: {
    flex: 1,
    marginRight: 12,
  },
  selectCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
