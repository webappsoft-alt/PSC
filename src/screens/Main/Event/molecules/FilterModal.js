import { BlurView } from "@react-native-community/blur";
import { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import Blur from "../../../../components/Blur";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";
import FilterCategoryModal from "./FilterCategoryModal";

const SORT_LABELS = {
  latest: "Latest",
  priceLowToHigh: "Lowest to Highest",
  priceHighToLow: "Highest to Lowest",
};

const FilterModal = ({
  isVisible,
  onModalClose,
  onApplyFilters,
  activeFilters,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [activeFilter, setActiveFilter] = useState(null);
  // All filter states persisted at this level
  const [sortBy, setSortBy] = useState(null); // null = not set
  const [distanceRange, setDistanceRange] = useState(null); // null = not set
  const [selectedDate, setSelectedDate] = useState(null); // null = not set

  // Sync internal state whenever the parent clears a filter via chip
  useEffect(() => {
    if (!activeFilters) return;
    setSortBy(activeFilters.sortBy ?? null);
    setDistanceRange(activeFilters.distanceRange ?? null);
    setSelectedDate(activeFilters.date ?? null);
  }, [activeFilters]);

  const isSortActive = sortBy !== null;
  const isDistanceActive = distanceRange !== null;
  const isDateActive = selectedDate !== null;

  const handleCategoryConfirm = (data) => {
    if (data?.sortBy !== undefined) setSortBy(data.sortBy);
    if (data?.distanceRange) setDistanceRange(data.distanceRange);
    if (data?.date) setSelectedDate(data.date);
  };

  const handleCategoryClear = (type) => {
    if (type === "sortBy") setSortBy(null);
    if (type === "distance") setDistanceRange(null);
    if (type === "date") setSelectedDate(null);
  };

  const handleMainConfirm = () => {
    onApplyFilters &&
      onApplyFilters({
        sortBy: isSortActive ? sortBy : null,
        distanceRange: isDistanceActive ? distanceRange : null,
        date: isDateActive ? selectedDate : null,
      });
    onModalClose();
  };

  const handleMainClear = () => {
    setSortBy(null);
    setDistanceRange(null);
    setSelectedDate(null);
    onApplyFilters &&
      onApplyFilters({ sortBy: null, distanceRange: null, date: null });
    onModalClose();
  };

  const filterRows = [
    {
      name: "Sort By",
      isActive: isSortActive,
      preview: isSortActive ? SORT_LABELS[sortBy] : null,
    },
    {
      name: "Distance",
      isActive: isDistanceActive,
      preview: isDistanceActive
        ? `${distanceRange[0]}-${distanceRange[1]} km`
        : null,
    },
    {
      name: "Date",
      isActive: isDateActive,
      preview: isDateActive ? selectedDate : null,
    },
  ];

  const renderContent = () => {
    if (activeFilter) {
      return (
        <FilterCategoryModal
          filterType={activeFilter}
          onBack={() => setActiveFilter(null)}
          onConfirm={handleCategoryConfirm}
          onClear={handleCategoryClear}
          initialDistance={distanceRange || [0, 100]}
          initialSort={sortBy}
          initialDate={selectedDate}
        />
      );
    }

    return (
      <>
        <View style={styles.header}>
          <CustomText
            label={"Filters"}
            fontFamily={fonts.semiBold}
            fontSize={24}
          />
          <TouchableOpacity
            style={styles.iconContainer}
            activeOpacity={0.8}
            onPress={onModalClose}
          >
            <Blur blurType={isDark ? "dark" : "light"} />
            <Image source={Images.cross} style={{ height: 20, width: 20, tintColor: colors.text }} />
          </TouchableOpacity>
        </View>

        <CustomText
          label={"Find the perfect fit for you!"}
          color={colors.iconMuted}
          fontSize={14}
          fontFamily={fonts.medium}
          marginBottom={8}
        />

        {filterRows.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.8}
            onPress={() => setActiveFilter(item.name)}
            style={styles.optionsStyle}
          >
            <View style={styles.optionLabelRow}>
              <CustomText
                label={item.name}
                fontSize={16}
                fontFamily={fonts.medium}
              />
              {item.isActive && <View style={styles.activeDot} />}
            </View>
            <View style={styles.optionRight}>
              {item.preview && (
                <CustomText
                  label={item.preview}
                  fontSize={12}
                  fontFamily={fonts.medium}
                  color={COLORS.buttonColor}
                  numberOfLines={1}
                />
              )}
              <Icons
                family={"Ionicons"}
                name={"chevron-forward"}
                color={colors.iconMuted}
                size={18}
              />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.row}>
          <CustomButton
            title={"Clear All"}
            width="48%"
            height={48}
            backgroundColor={colors.surfaceAlt}
            color={colors.text}
            onPress={handleMainClear}
          />
          <CustomButton
            title={"Confirm"}
            width="48%"
            height={48}
            onPress={handleMainConfirm}
          />
        </View>
      </>
    );
  };

  return (
    <CustomModal isBlur isChange isVisible={isVisible} onDisable={onModalClose}>
      <View
        style={{
          margin: 10,
          padding: 4,
          borderRadius: 32,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        {/* Blur Background */}
        <BlurView
          blurType={isDark ? "light" : "xlight"}
          blurAmount={4}
          reducedTransparencyFallbackColor="#FFFFFF29"
          style={[StyleSheet.absoluteFillObject, { borderRadius: 26 }]}
        />

        {/* Inner spacing (THIS creates your 6px gap) */}
        <View>
          <View style={styles.modalContainer}>{renderContent()}</View>
        </View>
      </View>
    </CustomModal>
  );
};

export default FilterModal;

const createStyles = (colors, isDark) => StyleSheet.create({
  modalContainer: {
    padding: 12,
    borderRadius: 26,
    maxHeight: "100%",
    backgroundColor: colors.background,
  },
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
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    marginTop: 16,
  },
  optionsStyle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  optionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.buttonColor,
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "55%",
  },
});
