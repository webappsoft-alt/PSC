import React, { useEffect, useMemo, useRef, useState } from "react";
import {Animated,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View} from "react-native";
import { BlurView } from "@react-native-community/blur";
import LinearGradient from "react-native-linear-gradient";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import Blur from "./Blur";
import CustomButton from "./CustomButton";
import CustomText from "./CustomText";
import Icons from "./Icons";
import { useTheme } from "../contexts/ThemeContext";
import Text from "./ScaledText";

const BASE_WIDTH = 390;
const QUESTION_PRICE_LABEL = "$5.00";
const modalColors = {
  white: COLORS.white,
  black: COLORS.black,
  blackOpacity05: "rgba(0,0,0,0.5)",
  whiteOpacity08: "rgba(255,255,255,0.08)",
  whiteOpacity16: "rgba(255,255,255,0.16)",
  primaryGradient: COLORS.red1,
};

function useScale() {
  const { width, height } = useWindowDimensions();
  const scale = width / BASE_WIDTH;
  const rs = (size, maxScale = 1.3) =>
    Math.round(size * Math.min(scale, maxScale));
  const isSmall = height < 700;
  return { rs, isSmall };
}

function getAccountMeta(account) {
  const source = account?.author || account?.user || account || {};
  const displayName =
    source?.profile?.displayName ||
    source?.displayName ||
    source?.name ||
    source?.fullName ||
    [source?.firstName, source?.lastName].filter(Boolean).join(" ") ||
    "Display Name";
  const usernameRaw =
    source?.username ||
    account?.username ||
    String(displayName || "username")
      .toLowerCase()
      .replace(/\s+/g, "");
  return {
    displayName,
    username: usernameRaw.startsWith("@") ? usernameRaw : `${usernameRaw}`,
    avatar:
      source?.profile?.avatar ||
      source?.avatar ||
      source?.profileImage ||
      source?.image ||
      null,
    isVerified:
      source?.profile?.isVerified ||
      source?.profile?.isPro ||
      source?.role === "company" ||
      source?.role === "individual" ||
      false,
  };
}

function AccountPreview({ account }) {
  const { colors } = useTheme();
  const meta = useMemo(() => getAccountMeta(account), [account]);
  // console.log("account----", account);

  return (
    <View style={styles.accountCard}>
      {meta.avatar ? (
        <View style={styles.accountAvatarWrap}>
          <Image
            source={
              typeof meta.avatar === "string" && meta.avatar.trim()
                ? { uri: meta.avatar }
                : Images.userIcon
            }
            style={styles.accountAvatar}
          />
        </View>
      ) : (
        <View
          style={[
            styles.accountAvatarWrapEmpty,
            {
              backgroundColor: account?.author?.profile?.profileColor,
            },
          ]}
        ></View>
      )}
      <View style={styles.accountTextCol}>
        <View style={styles.accountNameRow}>
          <Text
            style={[styles.accountDisplayName, { color: colors.text }]}
            numberOfLines={1}
          >
            {meta.displayName}
          </Text>
          {meta.isVerified ? (
            <Image source={Images.verified} style={styles.accountVerified} />
          ) : null}
        </View>
        <Text
          style={[styles.accountUsername, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {meta.username}
        </Text>
      </View>
    </View>
  );
}

export default function QuestionModal({
  visible,
  onClose,
  onContinue,
  onCardPay,
  account,
  isProcessing = false,
  isCardProcessing = false,
}) {
  const { colors, isDark } = useTheme();
  const { rs, isSmall } = useScale();
  const { height: screenHeight } = Dimensions.get("window");
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [step, setStep] = useState(1);

  const ctaTitle = useMemo(() => {
    if (Platform.OS === "ios") return "Pay With Apple Pay";
    if (Platform.OS === "android") return "Pay With Google Pay";
    return "Send Question";
  }, []);

  const backgroundSource =
    Images.questionBg || Images.premiumBg || Images.buttonBg;

  useEffect(() => {
    if (visible) {
      setStep(1);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [screenHeight, slideAnim, visible]);

  const renderContent = () => (
    <View style={styles.sheetContentInset}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "transparent",
          isDark ? COLORS.buttonColor : "rgba(161, 147, 117, 0.15)",
        ]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.tosBackdropGradient}
      />
      <View style={styles.sheetContentBody}>
        <View style={styles.header}>
          <CustomText
            label="Send A Question"
            fontFamily={fonts.semiBold}
            fontSize={18}
            color={colors.text}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={[
              styles.crossTouchable,
              { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Icons
              size={16}
              name="window-close"
              color={colors.text}
              family="MaterialCommunityIcons"
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.copyBlock, { marginTop: isSmall ? -4 : -10 }]}>
          <CustomText
            label={step == 1 ? "You are going to pay" : "Summary Amount"}
            fontFamily={fonts.medium}
            color={colors.textSecondary}
            fontSize={16}
            textAlign="center"
            marginTop={step == 1 ? 26 : 18}
          />
          <CustomText
            label={QUESTION_PRICE_LABEL}
            fontFamily={fonts.medium}
            color={colors.text}
            fontSize={80}
            textAlign="center"
          />
          <CustomText
            label="($) US Dollars"
            fontFamily={fonts.medium}
            color={colors.textSecondary}
            textAlign="center"
            marginTop={-10}
          />
          <CustomText
            label="UP TO 75 CHARACTERS"
            fontFamily={fonts.medium}
            color={colors.textSecondary}
            textAlign="center"
            fontSize={12}
            lineHeight={12 * 1.4}
            marginTop={5}
            marginBottom={step == 1 ? 30 : 10}
          />
          {step === 1 ? (
            <View style={styles.forQuestionBlock}>
              <View style={styles.forQuestionRow}>
                <CustomText
                  label="FOR"
                  color={colors.textSecondary}
                  fontFamily={fonts.medium}
                  fontSize={12}
                />
                <CustomText
                  label=" A QUESTION "
                  color={colors.text}
                  fontFamily={fonts.medium}
                  fontSize={12}
                />
                <CustomText
                  label="TO"
                  color={colors.textSecondary}
                  fontFamily={fonts.medium}
                  fontSize={12}
                />
              </View>
              <AccountPreview account={account} />
            </View>
          ) : null}
        </View>

        {step === 1 ? (
          <CustomButton
            title="Send Question"
            onPress={() => setStep(2)}
            backgroundColor={colors.text}
            color={colors.background}
            width="100%"
            height={52}
            borderRadius={99}
            fontSize={18}
            marginTop={14}
          />
        ) : (
          <>
            <CustomButton
              title={ctaTitle}
              onPress={onContinue}
              backgroundColor={colors.text}
              color={colors.background}
              width="100%"
              height={52}
              borderRadius={99}
              fontSize={18}
              marginTop={14}
              loading={isProcessing}
              disabled={isProcessing || isCardProcessing}
              marginBottom={8}
            />
            <CustomButton
              title="Pay with Card"
              onPress={onCardPay}
              backgroundColor={colors.surfaceAlt}
              color={colors.text}
              width="100%"
              height={52}
              borderRadius={99}
              fontFamily={fonts.medium}
              fontSize={18}
              loading={isCardProcessing}
              disabled={isProcessing || isCardProcessing}
            />
          </>
        )}
        <View style={styles.tosRow}>
          <Icons
            family="MaterialIcons"
            name="info-outline"
            color={colors.textSecondary}
            size={12}
          />
          <Text style={[styles.tosText, { color: colors.textSecondary }]}>
            By pressing "
            <Text style={[styles.tosBold, { color: colors.text }]}>
              {step === 1 ? "Continue Question" : "Any Option"}
            </Text>
            " you agree with{" "}
            <Text style={[styles.tosLink, { color: colors.text }]}>PSC </Text>
            <Text
              style={[
                styles.tosLink,
                { textDecorationLine: "underline", color: colors.text },
              ]}
            >
              TOS
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {Platform.OS !== "web" ? (
          <>
            <BlurView
              blurType={isDark ? "dark" : "light"}
              blurAmount={16}
              style={styles.backdropBlur}
            />
            <View
              style={[
                styles.backdropDim,
                {
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.5)"
                    : "rgba(0,0,0,0.2)",
                },
              ]}
              pointerEvents="none"
            />
          </>
        ) : (
          <View
            style={[
              styles.backdropDimWeb,
              {
                backgroundColor: isDark
                  ? "rgba(22, 22, 22, 0.65)"
                  : "rgba(240, 240, 240, 0.85)",
              },
            ]}
            pointerEvents="none"
          />
        )}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  { transform: [{ translateY: slideAnim }] },
                ]}
              >
                <View
                  style={[
                    styles.blurContainer,
                    {
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.16)"
                        : "rgba(0, 0, 0, 0.12)",
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(0, 0, 0, 0.02)",
                    },
                  ]}
                >
                  {Platform.OS !== "web" ? (
                    <BlurView
                      blurType={
                        Platform.OS === "ios"
                          ? isDark
                            ? "systemUltraThinMaterialDark"
                            : "systemUltraThinMaterialLight"
                          : isDark
                          ? "dark"
                          : "light"
                      }
                      blurAmount={Platform.OS === "ios" ? 10 : 25}
                      reducedTransparencyFallbackColor={
                        isDark ? "#FFFFFF29" : "#00000029"
                      }
                      style={styles.borderBlurLayer}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.webContainer,
                      {
                        backgroundColor: isDark
                          ? "rgba(22, 22, 22, 0.65)"
                          : "rgba(255, 255, 255, 0.85)",
                      },
                    ]}
                  >
                    {renderContent()}
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdropBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: modalColors.blackOpacity05,
  },
  backdropDimWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: modalColors.blackOpacity05,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  modalContainer: {
    width: "100%",
    maxHeight: "92%",
    borderRadius: 32,
    overflow: "hidden",
  },
  blurContainer: {
    padding: 4,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  borderBlurLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  webContainer: {
    backgroundColor: "rgba(22, 22, 22, 0.65)",
    borderRadius: 30,
  },
  sheetContentInset: {
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  sheetContentBody: {
    padding: 8,
  },

  tosBackdropGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    zIndex: -100,
    borderRadius: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  crossTouchable: {
    width: 34,
    height: 34,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  forQuestionBlock: {
    width: "100%",
  },
  forQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accountCard: {
    borderRadius: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  accountAvatarWrapEmpty: {
    width: 44,
    height: 44,
    borderRadius: 99,
  },
  accountAvatar: {
    width: "100%",
    height: "100%",
  },
  accountTextCol: {
    flex: 1,
    minWidth: 0,
  },
  accountNameRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  accountDisplayName: {
    color: modalColors.white,
    fontSize: 15,
    fontFamily: fonts.semiBold,
    flexShrink: 1,
  },
  accountVerified: {
    width: 16,
    height: 16,
    marginLeft: 6,
  },
  accountUsername: {
    color: COLORS.gray64,
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  tosRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  tosText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: COLORS.gray64,
    letterSpacing: -0.36,
    textAlign: "center",
  },
  tosBold: {
    fontFamily: fonts.medium,
    color: COLORS.white,
  },
  tosLink: {
    fontFamily: fonts.medium,
    color: COLORS.white,
  },
});
