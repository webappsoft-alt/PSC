import { BlurView } from "@react-native-community/blur";
import { useEffect, useRef, useState } from "react";
import {ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View} from "react-native";

import CustomInput from "./CustomInput";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import FlagImage from "./FlagImage";
import Icons from "./Icons";
import ImageFast from "./ImageFast";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import { COUNTRIES as COUNTRIES_DATA } from "../utils/COUNTRIES";

const COUNTRIES = COUNTRIES_DATA.map((country) => ({
  code: country.code,
  dialCode: country.dialCode,
  name: country.name,
  flag: country.emoji,
})).sort((a, b) => a.name.localeCompare(b.name));

const ITEMS_PER_PAGE = 20;

const CustomPhoneInput = ({
  value = "",
  setValue,
  withLabel,
  onEndEditing,
  error,
  showCheck,
  labelColor,
  isChange = false,
  marginBottom,
  defaultCode = "US",
  height = 56,
  borderRadius,
  marginTop,
  width,
  placeholder = "XXX XXX XX",
  onValidationChange,
  isIcon,
  rightIcon,
  rightIconSource,
  rightIconStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (value && value.trim()) {
      for (const country of COUNTRIES) {
        if (value.startsWith(country.dialCode)) {
          return country;
        }
      }
    }

    const foundCountry = COUNTRIES.find(
      (country) => country.code === defaultCode,
    );
    return (
      foundCountry ||
      COUNTRIES[0] || {
        code: "US",
        dialCode: "+1",
        name: "United States",
        flag: "🇺🇸",
      }
    );
  });

  const [phoneNumber, setPhoneNumber] = useState(() => {
    try {
      if (value && value.trim()) {
        for (const country of COUNTRIES) {
          if (value.startsWith(country.dialCode)) {
            const phoneOnly = value.replace(country.dialCode, "").trim();
            return phoneOnly;
          }
        }
        return value.trim();
      }
      return "";
    } catch (error) {
      console.log("Phone number initialization error:", error);
      return "";
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const inputRef = useRef();

  useEffect(() => {
    if (value && value.trim()) {
      for (const country of COUNTRIES) {
        if (value.startsWith(country.dialCode)) {
          const phoneOnly = value.replace(country.dialCode, "").trim();
          setSelectedCountry(country);
          setPhoneNumber(phoneOnly);
          return;
        }
      }
      setPhoneNumber(value.trim());
    } else {
      setPhoneNumber("");
    }
  }, [value]);

  const allFilteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchText.toLowerCase()) ||
      country.dialCode.includes(searchText),
  );

  const totalPages = Math.ceil(allFilteredCountries.length / ITEMS_PER_PAGE);
  const paginatedCountries = allFilteredCountries.slice(
    0,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onEndEditing) {
      onEndEditing();
    }
  };

  const validatePhoneNumber = (fullNumber) => {
    const phoneOnly = fullNumber.replace(selectedCountry.dialCode, "").trim();
    const cleanedPhone = phoneOnly.replace(/[^\d]/g, "");

    const isValid = cleanedPhone.length >= 7 && cleanedPhone.length <= 15;

    if (isValid) {
      setShowSuccessColor(true);
      setTimeout(() => {
        setShowSuccessColor(false);
      }, 2000);
    } else {
      setShowSuccessColor(false);
    }

    if (onValidationChange) {
      onValidationChange(isValid);
    }

    return isValid;
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setCurrentPage(1);
    setSearchText("");
    const fullNumber = `${country.dialCode}${phoneNumber}`.trim();
    setValue(fullNumber);
    validatePhoneNumber(fullNumber);
  };

  const handleModalOpen = () => {
    setModalVisible(true);
    setCurrentPage(1);
    setSearchText("");
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsLoadingMore(false);
      }, 300);
    }
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^\d\s-]/g, "");
    setPhoneNumber(cleaned);
    const fullNumber = `${selectedCountry.dialCode}${cleaned}`.trim();
    setValue(fullNumber);
    validatePhoneNumber(fullNumber);
  };

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 10)
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
        6,
      )}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(
      6,
      10,
    )}`;
  };

  const renderCountryItem = ({ item }) => {
    const isSelected = selectedCountry && selectedCountry.code === item.code;

    return (
      <TouchableOpacity
        style={[styles.countryItem, isSelected && styles.selectedItem]}
        onPress={() => handleCountrySelect(item)}
        activeOpacity={0.6}
      >
        <View style={styles.countryContent}>
          {/* flags are images, never emoji text (as Viral: 20 circle) */}
          <FlagImage code={item.code} size={20} style={styles.flagImage} />
          <View style={styles.countryInfo}>
            <CustomText
              label={item.name}
              fontSize={16}
              fontFamily={fonts.medium}
              color={isSelected ? COLORS.white : COLORS.white}
              style={{ flex: 1 }}
            />
            <CustomText
              label={item.dialCode}
              fontSize={14}
              fontFamily={fonts.regular}
              color={isSelected ? COLORS.gray48 : COLORS.gray}
            />
          </View>
        </View>
        <Icons
          family="MaterialCommunityIcons"
          name={isSelected ? "radiobox-marked" : "radiobox-blank"}
          size={24}
          color={isSelected ? COLORS.white : COLORS.gray2}
        />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primaryColor} />
      </View>
    );
  };

  return (
    <View style={{ width: width || "100%" }}>
      <View
        style={[
          styles.container,
          {
            marginBottom: error ? 5 : marginBottom || 15,
            marginTop,
            height: height,
            width: isChange ? "auto" : "100%",
            borderRadius: borderRadius || 10,
            backgroundColor: error
              ? "#EE10450A"
              : showSuccessColor
              ? "#64CD750A"
              : COLORS.inputBg,
            borderColor: error
              ? "#EE1045CC"
              : showSuccessColor
              ? "#64CD75"
              : COLORS.inputBg,
          },
        ]}
      >
        {withLabel && (
          <CustomText
            label={withLabel}
            color={
              labelColor ||
              (error
                ? "#EE1045CC"
                : showSuccessColor
                ? "#64CD75"
                : COLORS.subtitle)
            }
            fontFamily={fonts.medium}
            fontSize={12}
            lineHeight={12 * 1.4}
            textTransform="uppercase"
            marginTop={5}
          />
        )}

        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => !isChange && handleModalOpen()}
            disabled={isChange}
          >
            <FlagImage code={selectedCountry.code} size={18} />
            <CustomText
              label={selectedCountry.dialCode}
              fontSize={16}
              fontFamily={fonts.medium}
              color={
                error ? "#EE1045" : showSuccessColor ? "#64CD75" : COLORS.white
              }
              marginLeft={6}
              marginRight={6}
            />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[
              styles.phoneInput,
              {
                color: error
                  ? "#EE1045"
                  : showSuccessColor
                  ? "#64CD75"
                  : COLORS.white,
              },
            ]}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder={placeholder}
            placeholderTextColor={COLORS.gray}
            keyboardType="phone-pad"
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={15}
          />

          {rightIcon && (
            <View
              style={[styles.rightIconBg, { backgroundColor: rightIcon.color }]}
            >
              <ImageFast
                source={rightIconSource}
                style={rightIconStyle}
                onPress={rightIcon.onPress}
              />
            </View>
          )}
        </View>
      </View>

      {isIcon ? (
        <View
          style={{
            backgroundColor: "#4347FF29",
            height: 32,
            width: 32,
            borderRadius: 100,
            position: "absolute",
            right: 10,
            zIndex: 999,
            top: withLabel ? 14 : 17,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ImageFast
            resizeMode={"contain"}
            source={Images.PhoneBlue}
            style={{
              width: 20,
              height: 20,
            }}
          />
        </View>
      ) : (
        showCheck &&
        value?.length > selectedCountry.dialCode.length && (
          <Icons
            family={error ? "Entypo" : "AntDesign"}
            name={error ? "circle-with-cross" : "checkcircle"}
            size={20}
            color={error ? COLORS.red : COLORS.green}
            style={{
              position: "absolute",
              right: 15,
              zIndex: 999,
              top: withLabel ? 30 : 17,
            }}
            onPress={
              error
                ? () => {
                    setValue(selectedCountry.dialCode);
                    setPhoneNumber("");
                  }
                : undefined
            }
          />
        )
      )}

      <CustomModal
        isChange
        isVisible={modalVisible}
        onDisable={() => setModalVisible(false)}
      >
        <View
          style={{
            padding: 5,
            width: "95%",
            alignSelf: "center",
            borderRadius: 24,
            marginBottom: 12,
            maxHeight: "100%",
            borderWidth: 1,
            backgroundColor: "#FFFFFF29",
            borderColor: "rgba(255, 255, 255, 0.16)",
          }}
        >
          <BlurView
            style={{
              maxHeight: "100%",
              width: "100%",
              borderRadius: 24,
            }}
            blurType="light"
            blurAmount={26}
            reducedTransparencyFallbackColor="#FFFFFF29"
          />
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <CustomText
                label="Select Country"
                fontFamily={fonts.semiBold}
                fontSize={24}
              />
              <TouchableOpacity
                style={styles.crossContainer}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.6}
              >
                <ImageFast
                  source={PNGIcons.cross}
                  style={styles.cross}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <CustomInput
              placeholder="Search Country or Code..."
              value={searchText}
              onChangeText={handleSearchChange}
              autoFocus={false}
              clearButtonMode="while-editing"
            />

            {paginatedCountries && paginatedCountries.length > 0 ? (
              <FlatList
                data={paginatedCountries}
                keyExtractor={(item) => item.code}
                renderItem={renderCountryItem}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                style={{ maxHeight: 400, marginTop: 10 }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={renderFooter}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <CustomText
                  label="No countries found"
                  color={COLORS.inputLabel}
                  fontSize={14}
                  style={{ textAlign: "center" }}
                />
              </View>
            )}
          </View>
        </View>
      </CustomModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
  },

  dialCodeText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    marginRight: 5,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.medium,
    height: "100%",
    color: COLORS.white,
    paddingVertical: 0,
  },
  chevronIcon: {
    marginLeft: 8,
  },
  modalContainer: {
    backgroundColor: COLORS.black,
    padding: 12,
    borderRadius: 22,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  crossContainer: {
    borderRadius: 100,
    backgroundColor: "rgba(18, 18, 18, 0.04)",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cross: {
    width: 16,
    height: 16,
  },
  searchInput: {
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputLabel,
    fontFamily: fonts.regular,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedItem: {
    backgroundColor: COLORS.buttonColor,
  },
  countryContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flagImage: {
    marginRight: 15,
  },
  countryInfo: {
    flex: 1,
  },
  loadingFooter: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rightIconBg: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    position: "absolute",
    right: 0,
    top: -12,
  },
});

export default CustomPhoneInput;
