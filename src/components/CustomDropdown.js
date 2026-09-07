import { BlurView } from "@react-native-community/blur";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import ErrorComponent from "./ErrorComponent";
import Icons from "./Icons";
import ImageFast from "./ImageFast";

import fonts from "../assets/fonts";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import CustomInput from "./CustomInput";
import { useTheme } from "../contexts/ThemeContext";

const PAGE_SIZE = 20;

const CustomDropdown = ({
  data,
  value,
  setValue,
  showIcon,
  placeholder,
  error,
  withLabel,
  disabled,
  isSearch = false,
  errorMess,
  isError,
  errorColor,
  cardInfo,
  marginBottom,
  marginTop,
  onPress,
  modalTitle = "Select Option",
  isColor,
  colorBg,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [text, setText] = useState("");
  const [displayData, setDisplayData] = useState([]);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const dataList = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [filteredData, setFilteredData] = useState(dataList);
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [prevError, setPrevError] = useState(error);
  const { colors } = useTheme();

  useEffect(() => {
    if (value) {
      if (value._id) {
        setText(value.title);
      } else if (typeof value === "string") {
        setText(value);
      }
    } else {
      setText("");
    }
  }, [value]);

  useEffect(() => {
    if (!dataList || dataList.length === 0) {
      if (filteredData.length !== 0) setFilteredData([]);
      return;
    }

    if (searchText.trim() === "") {
      // Use memoized dataList to avoid unnecessary state updates
      if (filteredData !== dataList) setFilteredData(dataList);
    } else {
      const lowerSearch = searchText.toLowerCase();
      const filtered = dataList.filter((item) => {
        if (!item) return false;
        const title = item._id ? item.title : item;
        return (
          typeof title === "string" && title.toLowerCase().includes(lowerSearch)
        );
      });
      setFilteredData(filtered);
    }
    setPage(1);
  }, [searchText, dataList]);

  useEffect(() => {
    if (isModalVisible) {
      setDisplayData(filteredData.slice(0, PAGE_SIZE));
      setPage(1);
    }
  }, [isModalVisible, filteredData]);

  useEffect(() => {
    if (prevError && !error && !isError) {
      setShowSuccessColor(true);
      const timer = setTimeout(() => {
        setShowSuccessColor(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    setPrevError(error);
  }, [error, isError]);

  const loadMoreData = () => {
    if (page * PAGE_SIZE >= filteredData.length) return;

    const nextPage = page + 1;
    const newData = filteredData.slice(0, nextPage * PAGE_SIZE);
    setDisplayData(newData);
    setPage(nextPage);
  };

  const openModal = () => {
    setIsModalVisible(true);
    setSearchText("");
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const selectOption = (option) => {
    if (!option) return;

    if (option._id) {
      setValue(option);
      setText(option.title);
    } else {
      setValue(option);
      setText(option);
    }
    setIsModalVisible(false);
  };

  const renderItem = ({ item }) => {
    if (!item) return null;

    const itemText = item._id ? item.title : item;
    const isSelected =
      value && ((value._id && value._id === item._id) || value === item);

    return (
      <TouchableOpacity
        style={[styles.modalItem, isSelected && styles.selectedItem]}
        onPress={() => selectOption(item)}
        activeOpacity={0.6}
      >
        <CustomText
          label={itemText || ""}
          fontSize={16}
          fontFamily={fonts.medium}
          color={isSelected ? COLORS.buttonColor : COLORS.white}
          style={{ flex: 1 }}
        />
        <Icons
          family="MaterialCommunityIcons"
          name={isSelected ? "radiobox-marked" : "radiobox-blank"}
          size={24}
          color={isSelected ? COLORS.buttonColor : COLORS.gray2}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View
        style={[
          styles.dropdownMainContainer,
          {
            marginBottom: error ? 5 : marginBottom || 15,
            marginTop,
            borderColor:
              error || isError
                ? "#EE1045CC"
                : showSuccessColor
                ? "#64CD75"
                : colors.surfaceAlt,
            borderRadius: 12,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.6}
          style={[
            styles.container,
            {
              backgroundColor:
                error || isError
                  ? "#EE10450A"
                  : showSuccessColor
                  ? "#64CD750A"
                  : colors.surfaceAlt,
              flexDirection: "row",
            },
          ]}
          onPress={onPress ? onPress : openModal}
          disabled={disabled}
        >
          <View style={styles.labelAndValueContainer}>
            {withLabel && (
              <CustomText
                label={withLabel}
                fontFamily={fonts.medium}
                fontSize={12}
                lineHeight={12 * 1.4}
                textTransform={"uppercase"}
                color={
                  error || isError
                    ? "#EE1045CC"
                    : showSuccessColor
                    ? "#64CD75"
                    : colors.textSecondary
                }
                style={styles.floatingLabel}
              />
            )}

            <View
              style={isColor && { flexDirection: "row", alignItems: "center" }}
            >
              <CustomText
                label={text || value?.title || value || placeholder || ""}
                color={
                  error || isError
                    ? "#EE1045"
                    : showSuccessColor
                    ? "#64CD75"
                    : value
                    ? colors.text
                    : colors.iconMuted
                }
                fontFamily={fonts.regular}
                fontSize={16}
                lineHeight={16 * 1.4}
                style={withLabel ? styles.valueWithLabel : {}}
              />

              {isColor && (
                <View
                  style={{
                    padding: 6,
                    backgroundColor: colorBg,
                    marginLeft: 4,
                  }}
                />
              )}
            </View>
          </View>
          {!showIcon ? (
            <Icons
              style={{ color: colors.textSecondary, fontSize: 20 }}
              family="Entypo"
              name="chevron-down"
            />
          ) : (
            <View />
          )}
        </TouchableOpacity>
      </View>

      {/* Modal for options */}
      <CustomModal isChange isVisible={isModalVisible} onDisable={closeModal}>
        <View
          style={{
            padding: 5,
            width: "95%",
            alignSelf: "center",
            borderRadius: 24,
            marginBottom: Platform.OS == "android" ? 12 : 32,
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
                label={modalTitle}
                fontFamily={fonts.semiBold}
                fontSize={24}
                lineHeight={24 * 1.4}
              />
              <TouchableOpacity
                style={styles.crossContainer}
                onPress={closeModal}
                activeOpacity={0.6}
              >
                <ImageFast
                  source={PNGIcons.cross}
                  style={styles.cross}
                  resizeMode="contain"
                  tintColor={COLORS.white}
                />
              </TouchableOpacity>
            </View>

            {isSearch && (
              <CustomInput
                // sty={styles.searchInput}
                placeholder="Search..."
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={false}
                clearButtonMode="while-editing"
                placeholderTextColor={COLORS.gray2}
                textColor={COLORS.white}
              />
            )}

            {displayData && displayData.length > 0 ? (
              <FlatList
                data={displayData}
                keyExtractor={(item, index) =>
                  item && item._id ? item._id.toString() : index.toString()
                }
                renderItem={renderItem}
                onEndReached={loadMoreData}
                onEndReachedThreshold={0.5}
                style={{ maxHeight: 400, marginTop: 10 }}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <CustomText
                  label={errorMess || "No results found"}
                  color={errorMess ? COLORS.red : COLORS.white}
                  fontSize={14}
                  style={{ textAlign: "center" }}
                />
              </View>
            )}
          </View>
        </View>
      </CustomModal>

      {cardInfo && (
        <ErrorComponent
          errorTitle={cardInfo}
          // marginTop={-12}
          marginBottom={8}
        />
      )}
      {error && (
        <ErrorComponent
          errorTitle={error}
          color={errorColor || "#EE1045CC"}
          marginTop={-4}
          marginBottom={8}
        />
      )}
    </View>
  );
};

export default CustomDropdown;

const styles = StyleSheet.create({
  dropdownMainContainer: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
  },
  container: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    width: "100%",
    height: 48,
  },
  labelAndValueContainer: {
    flex: 1,
    justifyContent: "center",
  },
  floatingLabel: {
    marginBottom: 2,
    textTransform: "uppercase",
  },
  valueWithLabel: {
    marginTop: -2,
  },
  modalContainer: {
    backgroundColor: COLORS.black,
    padding: 12,
    borderRadius: 20,
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
    tintColor: COLORS.white,
  },
  modalItem: {
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
    backgroundColor: "#1b1b1b",
  },
  searchInput: {
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputLabel,
    fontFamily: fonts.regular,
    fontSize: 14,
    backgroundColor: COLORS.black,
    marginBottom: 10,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
