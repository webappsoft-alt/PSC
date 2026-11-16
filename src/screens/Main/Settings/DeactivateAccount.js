import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import fonts from "../../../assets/fonts";
import Blur from "../../../components/Blur";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { del } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { ToastMessage } from "../../../utils/ToastMessage";

const reasons = [
  "Taking a break",
  "Privacy concerns",
  "Too many notifications",
  "Lack of features",
  "Something else",
];

const X = (fs) => fs * 0.35; // CustomText line box 1.4×fs → cap box
const RED = "#EE1045";
const W4 = "rgba(255, 255, 255, 0.04)";
const W32 = "rgba(255, 255, 255, 0.32)";
const W48 = "rgba(255, 255, 255, 0.48)";
const W64 = "rgba(255, 255, 255, 0.64)";
const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", ...rest }) => (
  <CustomText fontSize={fs} letterSpacing={ls} fontFamily={ff} color={color} marginTop={-X(fs)} marginBottom={-X(fs)} {...rest} />
);

const Info = ({ label, icon = "info", iconColor = W48, family = MS }) => (
  <View style={styles.infoRow}>
    {/* 12×12 box: the icon font's line box is taller than 12 (Figma rows 12) */}
    <View style={styles.infoIcon}>
      <Icons family={family} name={icon} size={12} color={iconColor} />
    </View>
    <T fs={12} color={W48} label={label} containerStyle={styles.grow} />
  </View>
);

/**
 * Figma Profile › "Deactivate-account" (2266:1138), warning card styled as
 * the Viral screen (red 12% + 1px red outline). Content pad 12, card → rest
 * 40, sections 16. Card pad 16/12 r12 gap 16: warning 24 + "Warning"
 * SemiBold 24 −2% red · body Regular 14 −2% white 64%. Section titles Medium
 * 16 −0.5. Reasons 56 r12 (1px white 4%, selected white) Medium 16, gap 8.
 * Password field 56 r12 white 4% (label Medium 12 white 64% · value Medium
 * 16) · 6 · "Valid password" 12 check + Regular 12 white 48%. Dividers 1px
 * white 4%. Agreement: radio 24 white 32% · 12 · two Regular 12 lines.
 * Info rows: info 12 + Regular 12 white 48%, gap 8. Footer pad 12/12/34:
 * 48 r100 red button, delete 24 + "Delete My account" Medium 18.
 */
const DeactivateAccount = () => {
  const dispatch = useDispatch();
  const navigate = useNavigation();
  const insets = useSafeAreaInsets();

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
      // GDPR: hidden now, permanently erased after 30 days (signing in
      // before then cancels it); the server checks the password
      const response = await del("user/delete", {
        status: "deleted",
        reason: selectedReason,
        password,
      });
      if (response?.data?.success) {
        ToastMessage(response?.data?.message || "Account deactivated", "success");
        dispatch(setUserData(null));
        AsyncStorage.removeItem("token");
        navigate.reset({
          index: 0,
          routes: [{ name: "AuthStack" }],
        });
      }
    } catch (error) {
      ToastMessage(error?.message || "Could not deactivate your account", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Deactivate Your Account" textTransform="none" />}
      footerUnScrollable={() => (
        <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleDeactivate} disabled={loading} style={styles.deleteBtn}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icons family={MSF} name="delete" size={24} color="#FFFFFF" />
                <T fs={18} ff={fonts.medium} label="Delete My account" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    >
      <View style={styles.content}>
        {/* Warning */}
        <View style={styles.warning}>
          <Blur blurType="dark" blurAmount={32} borderRadius={12} />
          <View style={styles.warningTitle}>
            <Icons family={MSF} name="warning" size={24} color={RED} />
            <T fs={24} ls={-0.48} ff={fonts.semiBold} color={RED} label="Warning" />
          </View>
          <T
            fs={14}
            ls={-0.28}
            color={W64}
            label="Deactivating your account will hide your profile and content from other users. You can reactivate within 30 days time period."
          />
        </View>

        <View style={styles.sections}>
          {/* Why are you leaving? */}
          <View style={styles.section}>
            <T fs={16} ls={-0.5} ff={fonts.medium} label="Why are you leaving?" />
            <View style={styles.reasons}>
              {reasons.map((item) => {
                const active = selectedReason === item;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.8}
                    onPress={() => setSelectedReason(item)}
                    style={[styles.reason, active && styles.reasonActive]}
                  >
                    <T fs={16} ff={fonts.medium} color={active ? "#121212" : "#FFFFFF"} label={item} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Confirm Your Password */}
          <View style={styles.section}>
            <T fs={16} ls={-0.5} ff={fonts.medium} label="Confirm Your Password" />
            <View style={styles.passwordBlock}>
              <View style={styles.field}>
                <Blur blurType="dark" blurAmount={32} borderRadius={12} />
                <T fs={12} ff={fonts.medium} color={W64} label="YOUR CURRENT PASSWORD" />
                <TextInput
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry
                  placeholder="********"
                  placeholderTextColor={W48}
                  selectionColor="#A19375"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.fieldInput}
                />
              </View>
              <Info
                label="Valid password"
                family={isValidPassword ? MSF : MS}
                icon={isValidPassword ? "check_circle" : "info"}
                iconColor={isValidPassword ? "#37B874" : W48}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* agreement */}
          <TouchableOpacity activeOpacity={0.8} onPress={() => setAgree(!agree)} style={styles.agreeRow}>
            <Icons
              family={agree ? MSF : MS}
              name={agree ? "check_circle" : "radio_button_unchecked"}
              size={24}
              color={agree ? "#FFFFFF" : W32}
            />
            <View style={styles.agreeText}>
              <T fs={12} label="I understand that my account will be deactivated." />
              <T fs={12} label="I can reactivate it within 30 days" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* What happens */}
          <View style={styles.section}>
            <T fs={16} ls={-0.5} ff={fonts.medium} label="What happens when you deactivate" />
            <View style={styles.infoList}>
              {[
                "Your profile will be hidden",
                "Your posts will not be visible",
                "People will not be able to find you",
                "You can reactivate your account within 30 days",
                "After 30 days, your account will be permanently deleted",
              ].map((item) => (
                <Info key={item} label={item} />
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default DeactivateAccount;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  // Header leaves 10 below its row (Figma 8) → 14 = Figma's 16 gap
  content: { paddingTop: 14, paddingBottom: 40, gap: 40 },
  // Viral look: red 12% + 1px red outline (border sits inside → pad −1)
  warning: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RED,
    backgroundColor: "rgba(238, 16, 69, 0.12)",
    paddingVertical: 15,
    paddingHorizontal: 11,
    gap: 16,
    overflow: "hidden",
  },
  warningTitle: { flexDirection: "row", alignItems: "center", gap: 8, height: 24 },
  sections: { gap: 16 },
  section: { gap: 16 },
  reasons: { gap: 8 },
  reason: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W4,
    paddingHorizontal: 11,
    justifyContent: "center",
  },
  reasonActive: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" },
  passwordBlock: { gap: 6 },
  field: {
    height: 56,
    borderRadius: 12,
    backgroundColor: W4,
    paddingHorizontal: 12,
    justifyContent: "center",
    overflow: "hidden",
  },
  // value cap sits 10 below the label cap (Figma); 22pt line box
  fieldInput: {
    height: 22,
    marginTop: 10 - (22 - 11.2) / 2,
    marginBottom: -(22 - 11.2) / 2,
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: "#FFFFFF",
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4, height: 12 },
  // the symbol font sits its glyph ~1.5pt low → centre it on the text cap
  infoIcon: { width: 12, height: 12, alignItems: "center", justifyContent: "center", transform: [{ translateY: -1.5 }] },
  divider: { height: 1, backgroundColor: W4 },
  agreeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  agreeText: { flex: 1, gap: 12, paddingTop: 0 },
  infoList: { gap: 8 },
  footer: { paddingTop: 12, paddingHorizontal: 12, backgroundColor: "#121212" },
  deleteBtn: {
    height: 48,
    borderRadius: 100,
    backgroundColor: RED,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
