import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import fonts from "../../../assets/fonts";
import Border from "../../../components/Border";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { post } from "../../../services/ApiRequest";
import { uploadAndGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import OptionSelector from "./molecules/OptionSelector";
import SelectionModal from "./molecules/SelectionModal";

const Dietary = [
  { id: "ve", label: "Vegetarian", abbr: "Ve", color: "#37B874" },
  { id: "v", label: "Vegan", abbr: "V", color: "#F7941F" },
  { id: "gf", label: "Gluten-Free", abbr: "GF", color: "#776A3D" },
  { id: "sf", label: "Sugar-Free", abbr: "SF", color: "#FFFFFF" },
  { id: "lf", label: "Lactose Free", abbr: "LF", color: "#00A1DE" },
  { id: "Contains Eggs", label: "Contains Eggs" },
  { is: "Contains Fish", label: "Contains Fish" },
  { id: "Contains Oestrogen", label: "Contains Oestrogen" },
  { id: "Contains Peanuts", label: "Contains Peanuts" },
  { id: "Contains Sesame", label: "Contains Sesame" },
  { id: "Contains Shellfish", label: "Contains Shellfish" },
  { id: "Contains Tree nuts", label: "Contains Tree nuts" },
  { id: "Contains Soy/Soybeans", label: "Contains Soy/Soybeans" },
  { id: "Contains Wheat", label: "Contains Wheat" },
];
const AddItems = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);

  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [amount, setAmount] = useState("");
  const [fluidOunces, setFluidOunces] = useState("");
  const [selected, setSelected] = useState([]);
  const [imageModal, setImageModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("categories");
  const cameraRef = useRef(null);
  const [images, setImages] = useState([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toggleSelect = (item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };
  const handleSelection = (value) => {
    if (modalType === "categories") setCategory(value);
    if (modalType === "currency") setCurrency(value);
    if (modalType === "unit") setUnit(value);
    setModalVisible(false);
  };
  const handleChange = async (pickedImage) => {
    if (!pickedImage?.path && !pickedImage?.uri) return;

    const localUri = pickedImage.path || pickedImage.uri;

    const file = {
      uri: localUri,
      type: pickedImage.mime || "image/jpeg",
    };

    try {
      setImgLoading(true);

      const uploadedUrl = await uploadAndGetUrl(file);

      if (uploadedUrl) {
        setImages([uploadedUrl]);
        setError("");
        setImageModal(false);
      } else {
        setError("Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.log("Upload error:", err);
      setError("Error while uploading image.");
    } finally {
      setImgLoading(false);
    }
  };

  const handleCapture = async (photo) => {
    try {
      if (photo) {
        handleChange(photo);
      } else if (cameraRef.current) {
        const capturedPhoto = await cameraRef.current.takePhoto({
          flash: "off",
        });
        if (capturedPhoto?.path) handleChange(capturedPhoto);
      }
    } catch (err) {
      console.log("Camera capture error:", err);
    }
  };

  const onDelete = (index) => {
    setImages([]);
  };
  const addProduct = async () => {
    setLoading(true);
    const payload = {
      brand: brand,
      country: "Switzerland",
      type: category,
      image: images[0],
      title: product,
      category: selected,
      measurement: {
        type: unit,
        value: parseFloat(amount) || 0,
        fluidOunces: parseFloat(fluidOunces) || 0,
      },
      price: {
        amount: parseFloat(price) || 0,
        currency: currency,
      },
    };

    try {
      const res = await post("products", payload);
      if (res?.data?.success) {
        ToastMessage(res?.data?.message || "Product added successfully");
        navigation.goBack();
      } else {
        ToastMessage(res?.data?.message || "Failed to add product");
      }
    } catch (err) {
      console.log("Add product error:", err);
      ToastMessage("An error occurred while adding the product");
    } finally {
      setLoading(false);
    }
  };
  const isFormValid = useMemo(() => {
    return (
      category &&
      brand &&
      product &&
      currency &&
      price &&
      unit &&
      amount &&
      fluidOunces &&
      selected.length > 0 &&
      images.length > 0
    );
  }, [
    category,
    brand,
    product,
    currency,
    price,
    unit,
    amount,
    fluidOunces,
    selected,
    images,
  ]);

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => (
        <View style={{ marginBottom: 8 }}>
          <Header title={"Add An Item"} onHelpPress={() => ""} />
          <Border marginTop={0} height={4} bgColor={COLORS.inputBg} />
        </View>
      )}
      footerUnScrollable={() => (
        <>
          <Border
            marginTop={8}
            height={4}
            bgColor={COLORS.inputBg}
            marginBottom={12}
          />
          <View style={{ paddingHorizontal: 12, marginBottom: 24 }}>
            <CustomButton
              title={"Add This Item"}
              backgroundColor={COLORS.btnColor}
              color={COLORS.black}
              marginBottom={8}
              disabled={!isFormValid || loading}
              loading={loading}
              onPress={addProduct}
            />

            <CustomButton
              title="Cancel"
              backgroundColor={COLORS.cardColor}
              onPress={() => navigation.goBack()}
              color={COLORS.white}
            />
          </View>
        </>
      )}
      // scrollEnabled
      paddingHorizontal={0.1}
    >
      <KeyboardAwareScrollView>
        <CustomText
          label={"Product Showcase"}
          fontSize={18}
          fontFamily={fonts.medium}
          marginLeft={12}
        />
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => setImageModal(true)}
            disabled={imgLoading}
          >
            {imgLoading ? (
              <ActivityIndicator size="large" color={COLORS.btnColor} />
            ) : images.length === 1 ? (
              <Image
                source={{ uri: images[0] }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Icons
                family="MaterialCommunityIcons"
                name="plus"
                size={80}
                color={COLORS.gray48}
              />
            )}
          </TouchableOpacity>
        </View>

        <ErrorComponent
          errorTitle={".jpg; .png format only. 1:1 ratio preferrably."}
          marginLeft={12}
          marginBottom={16}
        />
        <Border
          marginTop={0}
          height={4}
          bgColor={COLORS.inputBg}
          marginBottom={8}
        />
        <View style={{ paddingHorizontal: 12 }}>
          <CustomText
            label={"General"}
            fontSize={18}
            fontFamily={fonts.medium}
            marginBottom={10}
          />
          <OptionSelector
            label={"CATEGORY"}
            placeHolder={"Beverage"}
            value={category}
            onPress={() => {
              setModalType("categories");
              setModalVisible(true);
            }}
          />
          <CustomInput
            withLabel={"Brand"}
            placeholder={"Jana"}
            value={brand}
            onChangeText={setBrand}
          />
          <ErrorComponent
            errorTitle={"Maximum characters 0/37"}
            marginBottom={8}
          />
          <CustomInput
            withLabel={"product"}
            placeholder={"Clear Water"}
            value={product}
            onChangeText={setProduct}
          />
          <ErrorComponent
            errorTitle={"Maximum characters 0/37"}
            marginBottom={8}
          />
        </View>
        <Border
          marginTop={0}
          height={4}
          bgColor={COLORS.inputBg}
          marginBottom={8}
        />
        {/* <View style={{ paddingHorizontal: 12 }}>
        <CustomText
          label={"Description"}
          fontSize={18}
          fontFamily={fonts.medium}
          marginBottom={10}
          value={description}
          onChangeText={setDescription}
        />
        <CustomInput
          placeholder={"E.g. Johansson"}
          multiline
          height={160}
          paddingVertical={10}
        />
        <ErrorComponent
          errorTitle={"Maximum characters 0/37"}
          marginBottom={8}
        />
      </View> */}
        {/* <Border
        marginTop={0}
        height={4}
        bgColor={COLORS.inputBg}
        marginBottom={8}
      /> */}
        <View style={{ paddingHorizontal: 12 }}>
          <CustomText
            label={"Price"}
            fontSize={18}
            fontFamily={fonts.medium}
            marginBottom={10}
          />
          <OptionSelector
            label={"CURRENCY"}
            placeHolder={"US Dollars"}
            value={currency}
            onPress={() => {
              setModalType("currency");
              setModalVisible(true);
            }}
          />
          <CustomInput
            withLabel={"UNIT PRICE"}
            placeholder={"2.00"}
            value={price}
            onChangeText={setPrice}
            keyboardType={"numeric"}
          />
        </View>
        <Border
          marginTop={8}
          height={4}
          bgColor={COLORS.inputBg}
          marginBottom={8}
        />
        <View style={{ paddingHorizontal: 12 }}>
          <CustomText
            label={"Product Details"}
            fontSize={18}
            fontFamily={fonts.medium}
            marginBottom={10}
          />
          <OptionSelector
            label={"UNIT"}
            placeHolder={"Oz"}
            value={unit}
            onPress={() => {
              setModalType("unit");
              setModalVisible(true);
            }}
          />
          <CustomInput
            withLabel={"Amount"}
            placeholder={"200"}
            value={amount}
            onChangeText={setAmount}
            keyboardType={"numeric"}
          />
          <CustomInput
            withLabel="Fluid Ounces (fl oz)"
            placeholder="1.59"
            value={fluidOunces}
            onChangeText={setFluidOunces}
            keyboardType="decimal-pad"
          />
        </View>
        <Border
          marginTop={8}
          height={4}
          bgColor={COLORS.inputBg}
          marginBottom={8}
        />
        <CustomText
          label={"Dietary & Allergenes"}
          fontSize={18}
          fontFamily={fonts.medium}
          marginBottom={10}
          marginLeft={12}
        />
        <FlatList
          data={Dietary}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.id);

            return (
              <TouchableOpacity
                style={styles.itemsRow}
                activeOpacity={0.8}
                onPress={() => toggleSelect(item.id)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CustomText
                    label={item.label}
                    fontFamily={fonts.medium}
                    marginRight={8}
                  />

                  {item.abbr && (
                    <View
                      style={[styles.badge, { backgroundColor: item.color }]}
                    >
                      <CustomText
                        color={COLORS.black}
                        fontFamily={fonts.semiBold}
                        label={item.abbr}
                        fontSize={8}
                      />
                    </View>
                  )}
                </View>

                <Icons
                  family="MaterialCommunityIcons"
                  name={
                    isSelected
                      ? "check-circle"
                      : "checkbox-blank-circle-outline"
                  }
                  size={24}
                  color={isSelected ? COLORS.buttonColor : COLORS.gray48}
                />
              </TouchableOpacity>
            );
          }}
        />
        <SelectionModal
          isVisible={modalVisible}
          type={modalType}
          selected={
            modalType === "categories"
              ? category
              : modalType === "unit"
              ? unit
              : currency
          }
          onModalClose={() => setModalVisible(false)}
          onSelection={handleSelection}
        />
        {imageModal && (
          <UploadImageCustom
            images={images}
            camera={cameraRef}
            onDelete={onDelete}
            imageModal={imageModal}
            imgLoading={imgLoading}
            handleChange={handleChange}
            handleCapture={handleCapture}
            setImageModal={setImageModal}
          />
        )}
      </KeyboardAwareScrollView>
    </ScreenWrapper>
  );
};

export default AddItems;

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 4,
    backgroundColor: COLORS.cardColor,
    borderRadius: 8,
    margin: 12,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.cardColor,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",

    overflow: "hidden",
    height: 343,

    alignItems: "center",
    justifyContent: "center",
  },
  itemsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
