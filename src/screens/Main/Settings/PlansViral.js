import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import CopyrightFooter from "./molecules/CopyRightFooter";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useIAP } from "react-native-iap";
import { useDispatch, useSelector } from "react-redux";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import PlansCard from "./molecules/PlansCard";
import { useTheme } from "../../../contexts/ThemeContext";

const tabs = ["Free", "Pro"];

const MONTHLY_SUB = "com.psc.app.001s";

const SUBSCRIPTION_SKUS = [MONTHLY_SUB];

export const free_fearures = [
  "10 Likes",
  "1 Super Likes/Day",
  "Full profile customization",
  "Advanced Filters",
];

export const pro_fearures = [
  "Pro Badge",
  "Sell Products",
  "Add Links to Reels",
  "Collaborations",
  "Extended Captions",
  "4K Video Quality",
  "Pin Reels",
  "Permanent Reels",
  "Advanced Analytics",
  "Full profile customization",
];

const PlansViral = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // const { isDarkMode } = useApp();

  const [selectedTab, setSelectedTab] = useState("Free");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { userData } = useSelector((store) => store?.users);

  const theme = {
    background: colors.background,
    text: colors.text,
    cardBackground: colors.surface,
  };
  const isVerified = userData?.user?.profile?.isVerified;
  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        handleSubscriptionSuccess(purchase.transactionId || "");
        // Finish the transaction after successful processing
        await finishTransaction({ purchase });
      } catch (error) {
        console.log("Error processing purchase:", error);
        ToastMessage("Error processing purchase");
        setPurchaseLoading(false);
      }
    },
    onPurchaseError: (error) => {
      console.log("Purchase failed:", error);
      ToastMessage("Purchase Failed!", "error");
      setPurchaseLoading(false);
    },
  });

  const getFeatures = () => {
    switch (selectedTab) {
      case "Free":
        return free_fearures;
      case "Pro":
        return pro_fearures;
      default:
        return [];
    }
  };
  // useEffect(() => {
  //   handleSubscriptionSuccess("1234567890");
  // }, []);

  const handleSubscriptionSuccess = async (purchaseId) => {
    try {
      setPurchaseLoading(true);

      // Call your backend API to verify and save the subscription
      const res = await put("user/profile", {
        profile: {
          isPro: true,
          proProductId: MONTHLY_SUB,
          proSubscriptionId: purchaseId,
        },
      });

      // console.log("handleSubscriptionSuccess--", res.data);

      if (res?.data?.success) {
        dispatch(setUserData({ user: res?.data?.user }));
        ToastMessage("Subscription plan bought successfully", "success");
        navigation.reset({
          index: 0,
          routes: [{ name: "TabStack" }],
        });
      }
      setPurchaseLoading(false);
    } catch (error) {
      setPurchaseLoading(false);
      console.log("Error updating user subscription:", error);
      ToastMessage("Failed to update subscription", "error");
    }
  };

  const handleSubscriptionPurchase = async () => {
    try {
      // if (!isVerified) {
      //   ToastMessage("Please do verification to buy plans", "error");
      //   // navigation.navigate("VerifyIdentity", { subscription: "true" });
      //   return;
      // }

      if (!connected) {
        ToastMessage("Store connection failed. Please try again.", "error");
        return;
      }

      setPurchaseLoading(true);
      await requestPurchase({
        request: {
          apple: { sku: MONTHLY_SUB },
          google: { skus: [MONTHLY_SUB] },
        },
        type: "subs",
      });
    } catch (error) {
      setPurchaseLoading(false);
      console.log("Purchase error:", error);

      if (error.code === "E_USER_CANCELLED") {
        ToastMessage("Purchase cancelled", "info");
      } else {
        ToastMessage("Failed to process subscription", "error");
      }
    }
  };

  const monthlyPrice = useMemo(() => {
    if (!subscriptions?.length) return "$49.99";

    const product = subscriptions.find((p) => p?.id === MONTHLY_SUB);

    if (!product) return "$49.99";

    return product.displayPrice;
  }, [subscriptions]);

  useFocusEffect(
    useCallback(() => {
      if (connected) {
        fetchProducts({
          skus: SUBSCRIPTION_SKUS,
          type: "subs",
        });
      }
    }, [connected, fetchProducts]),
  );

  const features = getFeatures();

  const isDisbled = userData?.user?.profile?.isPro || purchaseLoading;

  return (
    <ScreenWrapper
      scrollEnabled
      paddingBottom={0.1}
      headerUnScrollable={() => (
        <View>
          <Header title={"Select Plan"} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            {tabs.map((tab) => {
              const isSelected = tab === selectedTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  activeOpacity={0.8}
                  style={[
                    styles.tabButton,
                    {
                      backgroundColor: isSelected
                        ? theme.cardBackground
                        : theme.background,
                    },
                  ]}
                >
                  <CustomText
                    label={tab}
                    marginTop={2}
                    lineHeight={14 * 1.4}
                    fontFamily={fonts.medium}
                    color={isSelected ? theme.text : theme.text}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      footerUnScrollable={() => (
        <View style={{ padding: 12 }}>
          <CopyrightFooter paddingBottom={30} paddingTop={0} />

          {selectedTab === "Pro" && (
            <TouchableOpacity
              activeOpacity={0.6}
              disabled={isDisbled}
              onPress={handleSubscriptionPurchase}
              style={[
                [styles.btn, { height: isDisbled ? 48 : 56 }],
                {
                  backgroundColor: isDisbled
                    ? colors.surfaceAlt
                    : COLORS.buttonColor,
                },
              ]}
            >
              {purchaseLoading ? (
                <ActivityIndicator size={25} color={COLORS.white} />
              ) : (
                <>
                  <CustomText
                    fontSize={18}
                    fontFamily={fonts.medium}
                    color={isDisbled ? COLORS.red : "#fff"}
                    label={
                      userData?.user?.profile?.isPro
                        ? "Already Subscribed"
                        : "Subscribe Now"
                    }
                  />
                  {!userData?.user?.profile?.isPro && (
                    <CustomText
                      fontSize={16}
                      fontFamily={fonts.medium}
                      label={`${monthlyPrice}/mo`}
                      color={isDisbled ? theme.text : "#fff"}
                    />
                  )}
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
      backgroundColor={theme.background}
    >
      <PlansCard
        price={selectedTab === "Free" ? 0 : monthlyPrice}
        plan={selectedTab === "Free" ? "Free Tier" : selectedTab}
      />

      {selectedTab === "Pro" && (
        <View style={styles.proPlanInfoCard}>
          <CustomText
            label={
              "Unlock exclusive features and take your content & brand to the next level!"
            }
            lineHeight={14 * 1.5}
            color={theme.text}
          />
        </View>
      )}

      <CustomText
        fontSize={17}
        marginTop={12}
        label={"What You Get"}
        fontFamily={fonts.medium}
      />

      <View style={{ marginTop: 12 }}>
        {features.map((feature, index) => (
          <View
            key={index}
            style={[
              styles.featureCard,
              {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <Icons
              size={20}
              family={"Ionicons"}
              color={"#A19375"}
              name={"checkmark-circle"}
            />
            <CustomText
              fontSize={16}
              label={feature}
              color={theme.text}
              lineHeight={15 * 1.5}
              fontFamily={fonts.medium}
            />
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
};

export default PlansViral;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 2,
    gap: 8,
    paddingHorizontal: 12,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: "transparent",
  },
  tabButtonSelected: {
    backgroundColor: COLORS.whiteOpacity04,
    borderColor: COLORS.gray1,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.whiteOpacity04,
    marginBottom: 8,
    gap: 10,
  },
  proPlanInfoCard: {
    backgroundColor: "#C79D6D29",
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginTop: 20,
  },
  btn: {
    height: 56,
    borderRadius: 99,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});
