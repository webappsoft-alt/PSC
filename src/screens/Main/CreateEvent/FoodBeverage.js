import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import {
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { PNGIcons } from "../../../assets/images/icons";
import Border from "../../../components/Border";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTab from "../../../components/TopTab";
import { get } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import FoodCard from "./molecules/FoodCard";

const FoodBeverage = ({ route }) => {
  const {
    selected: initialSelected = [],
    onSave,
    isMedia,
    media,
    eventData,
  } = route.params || {};
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocus = useIsFocused();
  const [tab, setTab] = useState(0);
  const { colors } = useTheme();

  useEffect(() => {
    if (isFocus) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocus, dispatch]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const getProducts = async () => {
    setLoading(true);
    try {
      const response = await get(
        "products?page=1&limit=10&sort=createdAt%3Adesc",
      );
      setProducts(response.data?.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!products.length) return;
    const initialized = {};
    initialSelected.forEach((item) => {
      initialized[item._id] = {
        selected: true,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || "",
      };
    });
    setSelectedProducts(initialized);
  }, [products]);
  const handleProductSelection = (productId, isSelected) => {
    setSelectedProducts((prev) => {
      if (isSelected) {
        return {
          ...prev,
          [productId]: {
            ...prev[productId],
            selected: true,
            quantity: prev[productId]?.quantity || 1,
            unitPrice: prev[productId]?.unitPrice || "",
          },
        };
      } else {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      }
    });
  };
  // Handle quantity change
  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: quantity,
      },
    }));
  };
  // Handle price change
  const handlePriceChange = (productId, price) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        unitPrice: price,
      },
    }));
  };

  const filteredProducts = products?.filter((item) => {
    const itemType = item?.type?.trim()?.toLowerCase();
    if (tab === 0) {
      return itemType === "beverage";
    }
    if (tab === 1) {
      return itemType === "food";
    }
    if (tab === 2) {
      return item?.category?.some((c) => c?.trim()?.toLowerCase() === "gf");
    }
    return true;
  });
  useEffect(() => {
    getProducts();
  }, [isFocus]);

  console.log(products);
  return (
    <ScreenWrapper
      scrollEnabled
      enableResetScrollToCoords={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={getProducts} />
      }
      headerUnScrollable={() => (
        <View>
          <Header
            title={"Food & Beverage"}
            rightIcon={
              <TouchableOpacity
                activeOpacity={0.9}
                style={{
                  height: 40,
                  width: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.cardColor,
                  borderRadius: 999,
                }}
                onPress={() => navigation.navigate("AddItems")}
              >
                <Image
                  source={Images.plus48}
                  style={{ height: 24, width: 24 }}
                />
              </TouchableOpacity>
            }
          />
          <View style={{ paddingHorizontal: 12 }}>
            <TopTab
              rounded
              tabNames={["Beverage", "Food", "Gluten Free"]}
              tab={tab}
              setTab={setTab}
            />
          </View>
          <Border marginTop={10} height={4} bgColor={colors.surfaceAlt} />
        </View>
      )}
      footerUnScrollable={() => (
        <>
          <Border marginTop={8} height={4} bgColor={colors.surfaceAlt} />
          <View style={{ paddingHorizontal: 12, marginBottom: 24 }}>
            {Object.keys(selectedProducts).length > 0 && (
              <CustomButton
                title={
                  isSubmitting
                    ? "Adding..."
                    : `Add ${Object.keys(selectedProducts).length} Product${
                        Object.keys(selectedProducts).length > 1 ? "s" : ""
                      }`
                }
                onPress={() => {
                  const formatted = Object.keys(selectedProducts).map((id) => {
                    const product = products.find((p) => p._id === id);
                    return {
                      _id: product?._id,
                      title: product?.title,
                      brand: product?.brand,
                      type: product?.type?.trim(),
                      category: product?.category,
                      volume: product?.measurement?.value || 0,
                      fluidOunces: product?.measurement?.fluidOunces || 0,
                      image: product?.image || "",
                      quantity: selectedProducts[id]?.quantity,
                      unitPrice: selectedProducts[id]?.unitPrice,
                    };
                  });
                  if (isMedia) {
                    navigation.navigate("TicketDetail", {
                      formatted,
                      media,
                      eventData,
                    });
                  } else {
                    onSave?.(formatted);
                    navigation.goBack();
                  }
                }}
                backgroundColor={COLORS.btnColor}
                color={COLORS.black}
                marginTop={12}
                marginBottom={8}
                borderRadius={99}
                fontFamily={fonts.medium}
                disabled={isSubmitting}
              />
            )}
            <CustomButton
              title="Clear All"
              backgroundColor={colors.cardColor}
              color={colors.text}
              marginTop={Object.keys(selectedProducts).length > 0 ? 0 : 12}
            />
          </View>
        </>
      )}
    >
      <View style={styles.headerRow}>
        <View>
          <CustomText
            label={"Approved Local Providers"}
            fontFamily={fonts.semiBold}
            fontSize={24}
          />
          <CustomText
            label={"Find the list of products below"}
            fontSize={14}
            color={colors.iconMuted}
          />
        </View>
      </View>
      <View style={styles.row}>
        <ImageFast
          source={PNGIcons.switzerland}
          style={{ height: 12, width: 17, marginRight: 6 }}
          resizeMode={"contain"}
        />
        <CustomText label={"In "} color={colors.iconMuted} />
        <CustomText label={"Switzerland"} fontFamily={fonts.medium} />
      </View>
      <View style={styles.serveCard}>
        <Icons
          name={"info"}
          family={"Feather"}
          size={12}
          marginRight={4}
          color={COLORS.buttonColor}
        />
        <CustomText
          label={"Serve fresh products only."}
          fontSize={12}
          lineHeight={12 * 1.4}
          color={colors.buttonColor}
        />
      </View>
      {filteredProducts?.length === 0 && (
        <CustomText
          label={"No products found"}
          textAlign={"center"}
          marginTop={40}
          fontFamily={fonts.medium}
          fontSize={18}
          color={colors.iconMuted}
        />
      )}
      {filteredProducts?.map((item, index) => {
        const isSelected = selectedProducts[item._id]?.selected || false;
        const selectedProduct = selectedProducts[item._id];
        return (
          <View key={index}>
            <FoodCard
              value={isSelected}
              onValueChange={(val) => handleProductSelection(item._id, val)}
              brandName={item?.brand}
              title={item?.title}
              volume={item?.measurement?.value}
              onc={item?.measurement?.fluidOunces}
              category={item?.category}
              currentPrice={item?.price?.amount}
              image={item?.image}
              productId={item._id}
              inputValue={selectedProduct?.unitPrice || ""}
              initialQuantity={selectedProduct?.quantity || 1}
              onQuantityChange={handleQuantityChange}
              onPriceChange={handlePriceChange}
            />
            <Border height={1} marginVertical={20} bgColor={colors.cardColor} />
          </View>
        );
      })}
      {/* Submit Button */}
    </ScreenWrapper>
  );
};
export default FoodBeverage;
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 8,
  },
  selectedCount: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 16,
  },
  serveCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(161, 147, 117, 0.16)",
    marginVertical: 18,
    borderRadius: 8,
  },
});
