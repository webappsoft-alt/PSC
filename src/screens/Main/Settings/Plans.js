import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useIAP } from "react-native-iap";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import PlansCard from "./molecules/PlansCard";
import { useTheme } from "../../../contexts/ThemeContext";

const tabs = ["Super Likes", "Boosts", "Rewinds"];

// Placeholder SKUs - USER MUST UPDATE THESE WITH ACTUAL IDs FROM STORE
const SKUS = {
  "Super Likes": [
    "com.psc.app.superlikes.3",
    "com.psc.app.superlikes.9",
    "com.psc.app.superlikes.20",
  ],
  Boosts: [
    "com.psc.app.boosts.3",
    "com.psc.app.boosts.5",
    "com.psc.app.boosts.9",
  ],
  Rewinds: [
    "com.psc.app.rewinds.1",
    "com.psc.app.rewinds.3",
    "com.psc.app.rewinds.8",
  ],
};

const ALL_SKUS = [...SKUS["Super Likes"], ...SKUS.Boosts, ...SKUS.Rewinds];

// Data for each tab (indexed by tab name)
const tabData = {
  "Super Likes": {
    title: "Super Likes",
    offers: [
      { id: 1, quantity: 3, price: "$3/each", badges: [] },
      { id: 2, quantity: 9, price: "$2.50/each", badges: [] },
      {
        id: 3,
        quantity: 20,
        price: "$2/each",
        badges: ["Save 66%", "Best Offer"],
      },
    ],
    buttonText: "Get Super Likes",
  },
  Boosts: {
    title: "Boosts",
    offers: [
      { id: 1, quantity: 3, price: "$7/each", badges: [] },
      { id: 2, quantity: 5, price: "$6/each", badges: [] },
      { id: 3, quantity: 9, price: "$5/each", badges: ["Best Offer"] },
    ],
    buttonText: "Get Boosts",
  },
  Rewinds: {
    title: "Rewinds",
    offers: [
      { id: 1, quantity: 1, price: "$2/each", badges: ["Try it first!"] },
      {
        id: 2,
        quantity: 3,
        price: "$1.75/each",
        badges: ["Save 33%", "Most Popular"],
      },
      {
        id: 3,
        quantity: 8,
        price: "$1/each",
        badges: ["Save 66%", "Best Offer"],
      },
    ],
    buttonText: "Get Rewinds",
  },
};

const Plans = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        console.log("Purchase Success:", purchase);
        await handlePurchaseSuccess(purchase.transactionId || "");
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

  const handlePurchaseSuccess = async (purchaseId) => {
    try {
      const currentTabName = tabs[selectedTab];
      const selectedOfferData = tabData[currentTabName].offers.find(
        (o) => o.id === selectedOffer,
      );

      if (!selectedOfferData) {
        throw new Error("Selected offer data not found");
      }

      const quantity = selectedOfferData.quantity;

      // Map tab names to backend keys
      const keyMap = {
        "Super Likes": "supperLikes",
        Boosts: "boosts",
        Rewinds: "rewinds",
      };

      const backendKey = keyMap[currentTabName];

      const currentCount =
        userData?.[backendKey] || userData?.profile?.[backendKey] || 0;
      const totalQuantity = Number(currentCount) + Number(quantity);

      const body = {
        [backendKey]: totalQuantity,
      };

      console.log("Updating backend with purchase info:", body);
      const res = await put("user/profile", body);

      if (res?.data?.success) {
        dispatch(setUserData(res.data.data));
        console.log("response success---", res.data?.data);

        ToastMessage("Item purchased and updated successfully", "success");
      } else {
        ToastMessage(
          "Purchase successful, but failed to update account",
          "error",
        );
      }
    } catch (error) {
      console.log("Error updating backend after purchase:", error);
      ToastMessage("Failed to update account after purchase", "error");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const currentTabName = tabs[selectedTab];

  useFocusEffect(
    useCallback(() => {
      if (connected) {
        fetchProducts({ skus: ALL_SKUS });
      }
    }, [connected, fetchProducts]),
  );

  const handlePurchase = async () => {
    if (!selectedOffer) return;

    if (!connected) {
      ToastMessage("Store connection failed. Please try again.", "error");
      return;
    }

    // Map selectedOffer ID to SKU
    const currentTabSkus = SKUS[currentTabName];
    const offerSku = currentTabSkus[selectedOffer - 1]; // offers are 1-indexed in tabData

    try {
      setPurchaseLoading(true);
      await requestPurchase({
        request: {
          apple: { sku: offerSku },
          google: { skus: [offerSku] },
        },
      });
    } catch (error) {
      setPurchaseLoading(false);
      console.log("Purchase error:", error);
      if (error.code === "E_USER_CANCELLED") {
        ToastMessage("Purchase cancelled", "info");
      } else {
        ToastMessage("Failed to process purchase", "error");
      }
    }
  };

  // Helper to get dynamic price from fetched products
  const getDynamicPrice = (sku, defaultPrice) => {
    const product = products?.find((p) => p.productId === sku);
    return product ? product.localizedPrice || product.price : defaultPrice;
  };

  const currentData = useMemo(() => {
    const data = { ...tabData[currentTabName] };
    data.offers = data.offers.map((offer, index) => ({
      ...offer,
      price: getDynamicPrice(SKUS[currentTabName][index], offer.price),
    }));
    return data;
  }, [currentTabName, products]);

  // Updated badge style function with tab awareness
  const getBadgeStyle = (badge, tabName, offerId) => {
    // Boosts: third card's "Best Offer" gets save badge style
    if (tabName === "Boosts" && offerId === 3 && badge === "Best Offer") {
      return styles.saveBadge;
    }
    // Rewinds: all badges on third card get save badge style
    if (
      tabName === "Rewinds" &&
      offerId === 3 &&
      (badge === "Save 66%" || badge === "Best Offer")
    ) {
      return styles.saveBadge;
    }
    // Rewinds: second card's "Save 33%" gets save badge style
    if (tabName === "Rewinds" && offerId === 2 && badge === "Save 33%") {
      return styles.saveBadge;
    }
    // Rewinds: first card's "Try it first!" gets new purple style
    if (tabName === "Rewinds" && offerId === 1 && badge === "Try it first!") {
      return styles.tryFirstNewBadge;
    }
    // Original badge style logic for other cases
    if (badge === "Save 66%" || badge === "Save 33%") {
      return styles.saveBadge;
    } else if (badge === "Best Offer") {
      return styles.bestOfferBadge;
    } else if (badge === "Try it first!") {
      return styles.tryFirstBadge;
    } else if (badge === "Most Popular") {
      return styles.mostPopularBadge;
    }
    return styles.defaultBadge;
  };

  // Updated badge text color function with tab awareness
  const getBadgeTextColor = (badge, tabName, offerId) => {
    // Boosts: third card's "Best Offer" text color matches save badge
    if (tabName === "Boosts" && offerId === 3 && badge === "Best Offer") {
      return "#000000";
    }
    // Rewinds: third card's badges get black text
    if (
      tabName === "Rewinds" &&
      offerId === 3 &&
      (badge === "Save 66%" || badge === "Best Offer")
    ) {
      return "#000000";
    }
    // Rewinds: second card's "Save 33%" gets black text
    if (tabName === "Rewinds" && offerId === 2 && badge === "Save 33%") {
      return "#000000";
    }
    // Rewinds: first card's "Try it first!" gets white text
    if (tabName === "Rewinds" && offerId === 1 && badge === "Try it first!") {
      return COLORS.white;
    }
    // Original text color logic
    if (badge === "Save 66%" || badge === "Save 33%") {
      return "#000000";
    } else if (badge === "Best Offer") {
      return COLORS.green1;
    } else if (badge === "Try it first!") {
      return COLORS.white;
    } else if (badge === "Most Popular") {
      return COLORS.buttonColor;
    }
    return COLORS.white;
  };

  // Helper to determine if a badge should appear above the card
  const shouldBadgeBeAbove = (badge, tabName, offerId) => {
    // For Rewinds tab:
    if (tabName === "Rewinds") {
      // First card: "Try it first!" should be below (not above)
      if (offerId === 1 && badge === "Try it first!") return false;
      // Second card: "Save 33%" should be below (not above)
      if (offerId === 2 && badge === "Save 33%") return false;
      // Third card: no badges above
      if (offerId === 3) return false;
    }
    // Original logic: only "Try it first!" and "Save 33%" go above
    return badge === "Try it first!" || badge === "Save 33%";
  };

  return (
    <ScreenWrapper
      paddingBottom={0.1}
      scrollEnabled
      headerUnScrollable={() => (
        <View>
          <Header title={"Buy Extras"} />
          <TopTab
            tabNames={tabs}
            tab={selectedTab}
            setTab={setSelectedTab}
            rounded
            scrollViewPaddingHorizontal={12}
          />
        </View>
      )}
      footerUnScrollable={() => (
        <View style={styles.footer}>
          <CustomButton
            title={currentData?.buttonText}
            textTransform={"none"}
            marginBottom={12}
            disabled={!selectedOffer || purchaseLoading}
            loading={purchaseLoading}
            fontFamily={fonts.medium}
            onPress={handlePurchase}
          />
          <CustomText
            label="By clicking Confirm your purchase you will be billed, and your subscription will be automatically renewed for the same price and duration until you decide to cancel it yourself through the Google Play's settings. By clicking Confirm you also accept"
            color={colors.textSecondary}
            fontSize={11}
            lineHeight={11 * 1.5}
            textAlign="center"
          />
          <View style={styles.termsRow}>
            <CustomText label="PSC's " color={colors.text} fontSize={11} />
            <CustomText
              label="Terms of Use"
              color={colors.text}
              fontSize={11}
              fontFamily={fonts.medium}
            />
            <CustomText
              label="."
              color={colors.textSecondary}
              fontSize={11}
              lineHeight={11 * 1.5}
            />
          </View>
        </View>
      )}
    >
      {/* Hero Card */}
      <PlansCard plan={currentTabName} />

      {/* Select Your Offer */}
      <CustomText
        label="Select Your Offer"
        fontFamily={fonts.semiBold}
        fontSize={18}
        marginTop={24}
        marginBottom={16}
      />

      {/* Offer Options */}
      {currentData?.offers?.map((offer, index) => {
        const isSelected = selectedOffer === offer.id || offer.isSelected;
        // Determine which badges go above and which go below
        const badgesAbove = offer.badges.filter((badge) =>
          shouldBadgeBeAbove(badge, currentTabName, offer.id),
        );
        const badgesBelow = offer.badges.filter(
          (badge) => !shouldBadgeBeAbove(badge, currentTabName, offer.id),
        );

        return (
          <View key={offer.id}>
            {/* Badges above the card */}
            {badgesAbove.length > 0 && (
              <View style={styles.badgesAbove}>
                {badgesAbove.map((badge, idx) => (
                  <View
                    key={idx}
                    style={getBadgeStyle(badge, currentTabName, offer.id)}
                  >
                    <CustomText
                      label={badge}
                      fontSize={10}
                      fontFamily={fonts.medium}
                      color={getBadgeTextColor(badge, currentTabName, offer.id)}
                    />
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.offerCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.text : "transparent",
                  borderWidth: isSelected ? 1 : 0,
                },
              ]}
              onPress={() => setSelectedOffer(offer.id)}
              activeOpacity={0.8}
            >
              <CustomText
                label={`Get ${offer.quantity} ${currentData?.title}`}
                fontFamily={fonts.medium}
                fontSize={16}
              />
              <View style={styles.offerRight}>
                <CustomText
                  label={offer.price}
                  color={colors.textSecondary}
                  fontSize={14}
                  fontFamily={fonts.medium}
                />
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected ? colors.text : colors.iconMuted,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: colors.text },
                      ]}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Badges below the card */}
            {badgesBelow.length > 0 && (
              <View style={styles.badgesBelow}>
                {badgesBelow.map((badge, idx) => (
                  <View
                    key={idx}
                    style={getBadgeStyle(badge, currentTabName, offer.id)}
                  >
                    <CustomText
                      label={badge}
                      fontSize={10}
                      fontFamily={fonts.medium}
                      color={getBadgeTextColor(badge, currentTabName, offer.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScreenWrapper>
  );
};

export default Plans;

const styles = StyleSheet.create({
  offerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.cardColor,
    marginBottom: 8,
  },
  offerCardSelected: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
  },
  offerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.white,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  badgesAbove: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  badgesBelow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
    borderRadius: 99,
    // backgroundColor: COLORS.green1,
    width: 65,
  },
  saveBadge: {
    backgroundColor: COLORS.green1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestOfferBadge: {
    backgroundColor: "rgba(55, 184, 116, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  tryFirstBadge: {
    backgroundColor: COLORS.cardColor,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  // New style for "Try it first!" in Rewinds tab
  tryFirstNewBadge: {
    backgroundColor: "rgba(87, 80, 147, 1)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mostPopularBadge: {
    height: 20,
    width: 85,
    justifyContent: "center",
    backgroundColor: "rgba(161, 147, 117, 0.16)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  defaultBadge: {
    backgroundColor: COLORS.cardColor,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  footer: {
    padding: 12,
    paddingBottom: 24,
  },
  termsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
  },
});
