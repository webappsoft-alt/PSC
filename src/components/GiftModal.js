import { BlurView } from "@react-native-community/blur";
import {
  PlatformPay,
  usePaymentSheet,
  usePlatformPay,
} from "@stripe/stripe-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSelector } from "react-redux";
import {ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View} from "react-native";

import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import { ToastMessage } from "../utils/ToastMessage";
import { post } from "../services/ApiRequest";
import Icons from "./Icons";
import Blur from "./Blur";
import { Images } from "../assets/images";
import ImageFast from "./ImageFast";
import { useTheme } from "../contexts/ThemeContext";
import Text from "./ScaledText";

const colors = {
  black: COLORS.black,
  white: COLORS.white,
  blackOpacity64: "rgba(0,0,0,0.64)",
  whiteOpacity04: "rgba(255,255,255,0.04)",
  whiteOpacity08: "rgba(255,255,255,0.08)",
  whiteOpacity16: "rgba(255,255,255,0.16)",
  whiteOpacity64: "rgba(255,255,255,0.64)",
  gray2: "#2A2A2A",
  gray5: "rgba(255,255,255,0.48)",
  primary16: "rgba(161,147,117,0.16)",
  primary64: "rgba(161,147,117,0.64)",
  primaryGradient: COLORS.buttonColor,
  secondary: COLORS.red1,
  success: COLORS.green,
};

const PAYMENT_INTENT_ENDPOINTS = [
  "payment",
  "payments",
  "payment/create-payment-intent",
  "payments/create-payment-intent",
  "create-payment-intent",
  "stripe/payment-intent",
  "stripe/create-payment-intent",
];

const GIFT_ITEMS = [
  {
    id: "heart",
    name: "Heart",
    price: 10,
    image: Images.giftHeart,
  },
  {
    id: "star",
    name: "Star",
    price: 25,
    image: Images.giftStar,
  },
  {
    id: "fire",
    name: "Fire",
    price: 50,
    image: Images.giftFire,
  },
  {
    id: "sparkle",
    name: "Sparkle",
    price: 100,
    image: Images.giftSparkle,
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 250,
    image: Images.giftDiamond,
  },
  {
    id: "viral",
    name: "Viral",
    price: 500,
    image: Images.giftViral,
  },
];

function formatCredits(n) {
  const s = Math.max(0, Math.floor(Number(n) || 0)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function titleCaseUsername(raw) {
  const u = String(raw || "")
    .replace(/^@/, "")
    .trim();
  if (!u) return "Display Name";
  return u
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const unwrapPaymentIntentPayload = (res) => {
  const payload = res?.data?.data ?? res?.data ?? {};
  const paymentIntent = payload?.paymentIntent ?? payload?.intent ?? {};
  const clientSecret =
    payload?.clientSecret ??
    payload?.client_secret ??
    paymentIntent?.client_secret ??
    paymentIntent?.clientSecret ??
    null;
  const paymentIntentId =
    payload?.paymentIntentId ??
    payload?.payment_intent_id ??
    paymentIntent?.id ??
    payload?.id ??
    null;

  return { clientSecret, paymentIntentId };
};

const createGiftPaymentIntent = async (amountInCents) => {
  let notFoundCount = 0;

  for (const endpoint of PAYMENT_INTENT_ENDPOINTS) {
    try {
      const res = await post(endpoint, {
        amount: amountInCents,
        currency: "USD",
      });
      const paymentIntent = unwrapPaymentIntentPayload(res);

      if (paymentIntent.clientSecret) return paymentIntent;
    } catch (error) {
      if (error?.status === 404) {
        notFoundCount += 1;
        continue;
      }

      throw error;
    }
  }

  throw {
    status: notFoundCount ? 404 : -1,
    message: "Payment endpoint not found",
  };
};

const getPaymentToastMessage = (error, fallback) => {
  const message = String(error?.message || "").trim();
  if (message && !/<html|<!doctype/i.test(message)) return message;
  return fallback;
};

export default function GiftModal({
  visible,
  onClose,
  liveStreamId,
  postId,
  creatorName,
  creatorDisplayName,
  creatorAvatar,
  creatorIsVerified,
  coinBalance = 5000,
  onGiftSent,
  onDonationResponse,
  onGetMoreCoins,
}) {
  const { colors: themeColors, isDark } = useTheme();
  const { height: screenHeight } = Dimensions.get("window");
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [selectedId, setSelectedId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const { isPlatformPaySupported, confirmPlatformPayPayment } =
    usePlatformPay();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const userData = useSelector((state) => state?.users?.userData);
  const currentUserId = userData?.user?._id;

  const displayName = useMemo(
    () => creatorDisplayName?.trim() || titleCaseUsername(creatorName),
    [creatorDisplayName, creatorName],
  );

  const handleLine = useMemo(() => {
    const u = String(creatorName || "username")
      .replace(/^@/, "")
      .trim();
    return `@${u || "username"}`;
  }, [creatorName]);

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
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
  }, [visible, slideAnim, screenHeight]);

  const selectedGift = useMemo(
    () => GIFT_ITEMS.find((g) => g.id === selectedId) ?? null,
    [selectedId],
  );

  const donationConfig = useMemo(() => {
    const normalizedPostId = typeof postId === "string" ? postId.trim() : "";
    if (normalizedPostId) {
      return {
        endpoint: `posts/${normalizedPostId}/donation`,
        notFoundMessage: "Post not found",
      };
    }

    const normalizedLiveStreamId =
      typeof liveStreamId === "string" ? liveStreamId.trim() : "";
    if (normalizedLiveStreamId) {
      return {
        endpoint: `live-stream/${normalizedLiveStreamId}/donation`,
        notFoundMessage: "Stream not found",
      };
    }

    return {
      endpoint: "",
      notFoundMessage: "Content not found",
    };
  }, [postId, liveStreamId]);

  const giftRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < GIFT_ITEMS.length; i += 3) {
      rows.push(GIFT_ITEMS.slice(i, i + 3));
    }
    return rows;
  }, []);

  const handleSelectGift = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const sendDonation = useCallback(
    async ({ platform, paymentIntentId }) => {
      const res = await post(donationConfig.endpoint, {
        gift: selectedGift.name,
        amount: selectedGift.price,
        platform,
        userId: currentUserId,
        ...(paymentIntentId ? { paymentIntentId } : {}),
      });

      onDonationResponse?.(res?.data);
      onGiftSent?.(selectedGift);
      onClose();
    },
    [
      currentUserId,
      donationConfig.endpoint,
      onClose,
      onDonationResponse,
      onGiftSent,
      selectedGift,
    ],
  );

  const handleSendGift = useCallback(async () => {
    if (!selectedGift || isSending) return;
    setIsSending(true);
    try {
      if (!donationConfig.endpoint) {
        ToastMessage(donationConfig.notFoundMessage, "error");
        return;
      }

      await sendDonation({ platform: "WEB" });
    } catch (error) {
      ToastMessage(
        getPaymentToastMessage(error, "Failed to send gift"),
        "error",
      );
    } finally {
      setIsSending(false);
    }
  }, [donationConfig, isSending, selectedGift, sendDonation]);

  const handlePayAndSendGift = useCallback(async () => {
    if (!selectedGift || isSending) return;
    setIsSending(true);
    try {
      if (!donationConfig.endpoint) {
        ToastMessage(donationConfig.notFoundMessage, "error");
        return;
      }

      const rawPrice = Number(selectedGift.price) || 0;
      const amountInCents = Math.max(0, Math.round(rawPrice * 100));
      if (!amountInCents) {
        ToastMessage("Invalid amount", "error");
        return;
      }

      const { clientSecret, paymentIntentId } = await createGiftPaymentIntent(
        amountInCents,
      );
      if (!clientSecret) {
        ToastMessage("Payment init failed", "error");
        return;
      }

      if (Platform.OS === "ios") {
        const supported = await isPlatformPaySupported();
        if (!supported) {
          ToastMessage("Apple Pay not available on this device", "error");
          return;
        }

        const result = await confirmPlatformPayPayment(clientSecret, {
          applePay: {
            merchantCountryCode: "US",
            currencyCode: "USD",
            cartItems: [
              {
                paymentType: PlatformPay.PaymentType.Immediate,
                label: selectedGift.name,
                amount: rawPrice.toFixed(2),
              },
            ],
          },
        });

        if (result?.error) {
          const code = String(result.error?.code ?? "").toLowerCase();
          if (code.includes("canceled") || code.includes("cancelled")) return;
          ToastMessage(
            `${result.error?.code ? `${result.error.code}: ` : ""}${
              result.error.message || "Apple Pay failed"
            }`,
            "error",
          );
          return;
        }
      } else if (Platform.OS === "android") {
        const supported = await isPlatformPaySupported({
          googlePay: { testEnv: __DEV__ },
        });
        if (!supported) {
          ToastMessage("Google Pay not available on this device", "error");
          return;
        }

        const result = await confirmPlatformPayPayment(clientSecret, {
          googlePay: {
            testEnv: __DEV__,
            merchantCountryCode: "US",
            currencyCode: "USD",
            merchantName: "Viral, Inc.",
            label: selectedGift.name,
            amount: amountInCents,
          },
        });

        if (result?.error) {
          const code = String(result.error?.code ?? "").toLowerCase();
          if (code.includes("canceled") || code.includes("cancelled")) return;
          ToastMessage(
            `${result.error?.code ? `${result.error.code}: ` : ""}${
              result.error.message || "Google Pay failed"
            }`,
            "error",
          );
          return;
        }
      }

      await sendDonation({
        platform: Platform.OS === "ios" ? "APPLE" : "GOOGLE",
        paymentIntentId,
      });
    } catch (error) {
      ToastMessage(getPaymentToastMessage(error, "Payment failed"), "error");
    } finally {
      setIsSending(false);
    }
  }, [
    confirmPlatformPayPayment,
    donationConfig,
    isPlatformPaySupported,
    isSending,
    selectedGift,
    sendDonation,
  ]);

  const handleCardPayAndSendGift = useCallback(async () => {
    if (!selectedGift || isSending) return;
    setIsSending(true);
    try {
      if (!donationConfig.endpoint) {
        ToastMessage(donationConfig.notFoundMessage, "error");
        return;
      }

      const rawPrice = Number(selectedGift.price) || 0;
      const amountInCents = Math.max(0, Math.round(rawPrice * 100));
      if (!amountInCents) {
        ToastMessage("Invalid amount", "error");
        return;
      }

      const { clientSecret, paymentIntentId } = await createGiftPaymentIntent(
        amountInCents,
      );
      if (!clientSecret) {
        ToastMessage("Payment init failed", "error");
        return;
      }

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Viral",
        style: "alwaysDark",
        allowsDelayedPaymentMethods: false,
      });
      if (initError) {
        ToastMessage(initError.message || "Payment init failed", "error");
        return;
      }

      const { error } = await presentPaymentSheet();
      if (error) {
        const code = String(error?.code ?? "").toLowerCase();
        if (code.includes("canceled") || code.includes("cancelled")) return;
        ToastMessage(error.message || "Card payment failed", "error");
        return;
      }

      await sendDonation({ platform: "CARD", paymentIntentId });
    } catch (error) {
      ToastMessage(
        getPaymentToastMessage(error, "Card payment failed"),
        "error",
      );
    } finally {
      setIsSending(false);
    }
  }, [
    donationConfig,
    initPaymentSheet,
    isSending,
    presentPaymentSheet,
    selectedGift,
    sendDonation,
  ]);

  const renderContent = () => (
    <View style={[styles.innerContainer, { backgroundColor: themeColors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Send A Gift</Text>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: themeColors.surfaceAlt }]}
          onPress={onClose}
          hitSlop={12}
        >
          <Icons
            family="MaterialCommunityIcons"
            name="close"
            color={themeColors.text}
            size={16}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.userRow, { backgroundColor: themeColors.surfaceAlt }]}>
        <View style={styles.avatarWrap}>
          {creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.surface }]}>
              <Icons
                family="MaterialCommunityIcons"
                name="heart"
                size={22}
                color={colors.secondary}
              />
            </View>
          )}
        </View>
        <View style={styles.userTextCol}>
          <View style={styles.displayNameRow}>
            <Text style={[styles.displayName, { color: themeColors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {creatorIsVerified ? (
              <Icons
                family="MaterialIcons"
                name="verified"
                size={14}
                color="#007BFF"
              />
            ) : null}
          </View>
          <Text style={[styles.username, { color: themeColors.textSecondary }]} numberOfLines={1}>
            {handleLine}
          </Text>
        </View>
        {/* <View style={styles.balancePill}>
          <View style={styles.balanceIconCircle}>
            <Icons
              family="MaterialIcons"
              name="attach-money"
              size={14}
              color={colors.black}
            />
          </View>
          <Text style={styles.balanceAmount}>{formatCredits(coinBalance)}</Text>
          <Text style={styles.balanceCr}>Cr</Text>
        </View> */}
      </View>

      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.giftGrid}>
          {giftRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.giftRow}>
              {row.map((gift) => {
                const selected = gift.id === selectedId;
                return (
                  <View key={gift.id} style={styles.giftCell}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.giftCard,
                        { backgroundColor: themeColors.surfaceAlt },
                        selected && [
                          styles.giftCardSelected,
                          {
                            backgroundColor: isDark
                              ? "rgb(26, 24, 19)"
                              : "rgba(161, 147, 117, 0.1)",
                            borderColor: themeColors.buttonColor,
                          },
                        ],
                        pressed && styles.giftCardPressed,
                      ]}
                      onPress={() => handleSelectGift(gift.id)}
                    >
                      <View style={styles.giftIconArea}>
                        <ImageFast
                          source={gift.image}
                          style={styles.giftImage}
                        />
                      </View>
                      <Text style={[styles.giftLabel, { color: themeColors.text }]} numberOfLines={1}>
                        {gift.name}
                      </Text>
                      <View
                        style={[
                          styles.pricePill,
                          { backgroundColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(18, 18, 18, 0.08)" },
                          selected && [styles.pricePillSelected, { backgroundColor: themeColors.buttonColor }],
                        ]}
                      >
                        <View style={[styles.priceIconCircle, { backgroundColor: selected ? COLORS.white : themeColors.background }]}>
                          <Icons
                            family="MaterialIcons"
                            name="attach-money"
                            size={13}
                            color={selected ? themeColors.buttonColor : themeColors.text}
                          />
                        </View>
                        <Text style={[styles.priceAmount, { color: selected ? COLORS.white : themeColors.text }]}>{gift.price}</Text>
                        <Text style={[styles.priceCr, { color: selected ? COLORS.white : themeColors.textSecondary }]}>Cr</Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 10 }]}>
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={[
              styles.platformPayBtn,
              { borderColor: themeColors.border },
              (!selectedGift || isSending) && [styles.platformPayBtnDisabled, { borderColor: themeColors.surfaceAlt }],
            ]}
            onPress={handlePayAndSendGift}
            disabled={!selectedGift || isSending}
            activeOpacity={0.85}
          >
            <Icons
              family="MaterialCommunityIcons"
              name={Platform.OS === "ios" ? "apple" : "android"}
              size={18}
              color={!selectedGift || isSending ? themeColors.iconMuted : themeColors.text}
            />
            <Text
              style={[
                styles.platformPayText,
                { color: themeColors.text },
                (!selectedGift || isSending) && [styles.primaryCtaTextDisabled, { color: themeColors.iconMuted }],
              ]}
            >
              {Platform.OS === "ios"
                ? "Pay with Apple Pay"
                : "Pay with Google Pay"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.primaryCta,
            { backgroundColor: themeColors.buttonColor },
            (!selectedGift || isSending) && [styles.primaryCtaDisabled, { backgroundColor: themeColors.surfaceAlt }],
          ]}
          onPress={
            Platform.OS === "web" ? handleSendGift : handleCardPayAndSendGift
          }
          disabled={!selectedGift || isSending}
          activeOpacity={0.85}
        >
          {isSending ? (
            <ActivityIndicator color={themeColors.background} />
          ) : (
            <Text
              style={[
                styles.primaryCtaText,
                { color: isDark ? COLORS.black : COLORS.white },
                !selectedGift && [styles.primaryCtaTextDisabled, { color: themeColors.textSecondary }],
              ]}
            >
              {selectedGift
                ? Platform.OS === "web"
                  ? `Send ${selectedGift.name}`
                  : `Pay $${selectedGift.price.toFixed(2)} with Card`
                : "Select A Gift"}
            </Text>
          )}
        </TouchableOpacity>
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
            <View style={[styles.backdropDim, { backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)" }]} pointerEvents="none" />
          </>
        ) : (
          <View style={[styles.backdropDimWeb, { backgroundColor: isDark ? "rgba(22, 22, 22, 0.65)" : "rgba(240, 240, 240, 0.85)" }]} pointerEvents="none" />
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
                      borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
                    }
                  ]}
                >
                  {Platform.OS !== "web" ? (
                    <BlurView
                      blurType={
                        Platform.OS === "ios"
                          ? (isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight")
                          : (isDark ? "dark" : "light")
                      }
                      blurAmount={Platform.OS === "ios" ? 10 : 25}
                      reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "#00000029"}
                      style={styles.borderBlurLayer}
                    />
                  ) : null}
                  <View style={[styles.webContainer, { backgroundColor: isDark ? "rgba(22, 22, 22, 0.65)" : "rgba(255, 255, 255, 0.85)" }]}>
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
  },
  backdropDimWeb: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(22, 22, 22, 0.65)",
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
  innerContainer: {
    backgroundColor: COLORS.black,
    borderRadius: 28,
    overflow: "hidden",
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.white,
    letterSpacing: -0.36,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 18,
    backgroundColor: colors.whiteOpacity04,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -5,
    marginTop: -2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.whiteOpacity04,
    gap: 8,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.gray2,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray2,
  },
  userTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  displayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -3,
  },
  displayName: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    letterSpacing: -0.24,
    flexShrink: 1,
  },
  username: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.gray5,
    letterSpacing: -0.2,
    marginTop: -2,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: colors.primary16,
    gap: 2,
  },
  balanceIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 99,
    backgroundColor: colors.primaryGradient,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceAmount: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: COLORS.buttonColor,
    letterSpacing: -0.2,
  },
  balanceCr: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    color: colors.primary64,
  },
  gridScroll: {
    marginTop: 10,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  giftGrid: {
    gap: 7,
  },
  giftRow: {
    flexDirection: "row",
    gap: 7,
  },
  giftCell: {
    flex: 1,
    minWidth: 0,
  },
  giftCard: {
    width: "100%",
    backgroundColor: colors.whiteOpacity04,
    borderRadius: 12,
    height: 130,
    paddingVertical: 17,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  giftCardSelected: {
    borderWidth: 2,
    borderColor: colors.primaryGradient,
    backgroundColor: "rgb(26, 24, 19)",
    borderRadius: 12,
  },
  giftCardPressed: {
    opacity: 0.92,
  },
  giftIconArea: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  giftImage: {
    height: 32,
    width: 32,
  },
  giftLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.white,
    marginBottom: 6,
    letterSpacing: -0.2,
    textAlign: "center",
    width: "100%",
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteOpacity16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 87.5,
    gap: 4,
    maxWidth: "100%",
  },
  pricePillSelected: {
    backgroundColor: COLORS.buttonColor,
  },
  priceIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 9,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  priceAmount: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.white,
  },
  priceCr: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    color: colors.whiteOpacity64,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 5,
    gap: 8,
  },
  primaryCta: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: colors.primaryGradient,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCtaDisabled: {
    backgroundColor: colors.whiteOpacity04,
  },
  primaryCtaText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.black,
    letterSpacing: -0.28,
  },
  primaryCtaTextDisabled: {
    color: colors.gray5,
  },
  platformPayBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 24,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.whiteOpacity04,
    gap: 8,
  },
  platformPayBtnDisabled: {
    borderColor: colors.whiteOpacity04,
    borderWidth: 1.5,
  },

  platformPayText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.white,
    letterSpacing: -0.24,
  },
});
