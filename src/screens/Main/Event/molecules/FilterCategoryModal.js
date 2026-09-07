import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import MultiRangeSlider from "../../../../components/RangeSliderTwoWay";
import CustomButton from "../../../../components/CustomButton";
import { Images } from "../../../../assets/images";

// Map label → API param value
const SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Lowest to Highest Price", value: "priceLowToHigh" },
  { label: "Highest Price To Lowest", value: "priceHighToLow" },
];

const DATE_OPTIONS = [
  "Within A Day",
  "Within 3 Days",
  "Within 7 Days",
  "Within 2 Weeks",
  "Within A Month",
];

const FilterCategoryModal = ({
  filterType,
  onBack,
  onConfirm,
  onClear,
  initialDistance,
  initialSort,
  initialDate,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [selectedSort, setSelectedSort] = useState(
    initialSort || SORT_OPTIONS[0].value,
  );
  const [selectedDate, setSelectedDate] = useState(
    initialDate || DATE_OPTIONS[0],
  );
  const [distanceRange, setDistanceRange] = useState(
    initialDistance || [0, 100],
  );

  const handleConfirm = () => {
    if (filterType === "Sort By") {
      onConfirm && onConfirm({ sortBy: selectedSort });
    } else if (filterType === "Distance") {
      onConfirm && onConfirm({ distanceRange });
    } else if (filterType === "Date") {
      onConfirm && onConfirm({ date: selectedDate });
    }
    onBack();
  };

  const handleClear = () => {
    if (filterType === "Sort By") {
      onClear && onClear("sortBy");
    } else if (filterType === "Distance") {
      setDistanceRange([0, 100]);
      onClear && onClear("distance");
    } else if (filterType === "Date") {
      onClear && onClear("date");
    }
    onBack();
  };

  return (
    <View>
      <View style={styles.header}>
        <CustomText
          label={filterType}
          fontFamily={fonts.semiBold}
          fontSize={24}
          lineHeight={24 * 1.4}
        />
        <TouchableOpacity
          style={styles.iconContainer}
          activeOpacity={0.8}
          onPress={onBack}
        >
          <Image source={Images.cross} style={{ height: 20, width: 20, tintColor: colors.text }} />
        </TouchableOpacity>
      </View>

      <CustomText
        label={"Find the perfect fit for you!"}
        color={colors.iconMuted}
        fontSize={14}
        fontFamily={fonts.medium}
        marginBottom={2}
      />

      {filterType === "Sort By" && (
        <View style={{ marginTop: 16 }}>
          {SORT_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionRow}
              onPress={() => setSelectedSort(option.value)}
              activeOpacity={0.8}
            >
              <CustomText
                label={option.label}
                fontSize={16}
                fontFamily={fonts.medium}
              />
              {selectedSort === option.value ? (
                <Icons
                  family="MaterialCommunityIcons"
                  name={"radiobox-marked"}
                  size={22}
                  color={COLORS.buttonColor}
                />
              ) : (
                <Icons
                  family="MaterialCommunityIcons"
                  name={"radiobox-blank"}
                  size={22}
                  color={colors.iconMuted}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {filterType === "Distance" && (
        <View style={{ marginTop: 20 }}>
          <MultiRangeSlider
            min={0}
            max={100}
            unit="km"
            initialValues={distanceRange}
            onValuesChange={(vals) => setDistanceRange(vals)}
          />
        </View>
      )}

      {filterType === "Date" && (
        <View style={{ marginTop: 10 }}>
          {DATE_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionRow}
              onPress={() => setSelectedDate(option)}
              activeOpacity={0.8}
            >
              <CustomText
                label={option}
                fontSize={16}
                fontFamily={fonts.medium}
                color={colors.text}
              />
              <Icons
                family="MaterialCommunityIcons"
                name={
                  selectedDate === option ? "radiobox-marked" : "radiobox-blank"
                }
                size={22}
                color={
                  selectedDate === option ? COLORS.buttonColor : colors.iconMuted
                }
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.bottomButtons}>
        <CustomButton
          title="Clear"
          width="48%"
          height={48}
          backgroundColor={colors.surfaceAlt}
          color={colors.text}
          onPress={handleClear}
        />
        <CustomButton
          title="Confirm"
          width="48%"
          height={48}
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
};

export default FilterCategoryModal;

const createStyles = (colors, isDark) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    borderRadius: 99,
    height: 35,
    width: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  bottomButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 20,
  },
});
