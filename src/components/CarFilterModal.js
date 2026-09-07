import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Divider from "./Divider";
import Icons from "./Icons";
import { useTheme } from "../contexts/ThemeContext";

// Fallback default topics (used when no data is passed)
const DEFAULT_FILTERS = [
  { name: "Technology", image: Images.Topis1 },
  { name: "Politics", image: Images.Topis2 },
  { name: "Sports", image: Images.Topis3 },
  { name: "Music", image: Images.Topis4 },
  { name: "Entertainment", image: Images.Topis5 },
  { name: "Fashion", image: Images.Topis6 },
  { name: "Food", image: Images.Topis7 },
  { name: "Gaming", image: Images.Topis8 },
  { name: "Health", image: Images.Topis9 },
];

const FilterModal = ({
  isVisible,
  onDisable,
  onItemPress,
  title,
  subtitle,
  onConfirm,
  filters,
  data, // alias for filters to keep API flexible
  multiSelect = false, // New prop for multi-select mode
  selectedItems = [], // Array of selected items for multi-select
  singleSelect = false, // New prop for single-select mode with confirm button
}) => {
  const insests = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [localSelectedItems, setLocalSelectedItems] = useState([]);
  const prevIsVisible = useRef(false);

  // Update local selection when modal opens (not closes)
  useEffect(() => {
    if (isVisible && !prevIsVisible.current) {
      setLocalSelectedItems(selectedItems || []);
    }
    prevIsVisible.current = isVisible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Prefer externally passed data; fall back to defaults
  const items =
    filters && filters.length
      ? filters
      : data && data.length
      ? data
      : DEFAULT_FILTERS;

  const handleItemToggle = (item) => {
    if (multiSelect) {
      const isSelected = localSelectedItems.includes(item.name);
      if (isSelected) {
        if (singleSelect) {
          // In singleSelect mode, clicking the same item doesn't necessarily need to deselect
          // or it can deselect if we want to allow "none"
          setLocalSelectedItems([]);
        } else {
          setLocalSelectedItems(
            localSelectedItems.filter((i) => i !== item.name),
          );
        }
      } else {
        if (singleSelect) {
          setLocalSelectedItems([item.name]);
        } else {
          setLocalSelectedItems([...localSelectedItems, item.name]);
        }
      }
    } else {
      setSelectedIndex(items.indexOf(item));
      onItemPress?.(item, items.indexOf(item));
    }
  };

  const handleConfirm = () => {
    if (multiSelect && onConfirm) {
      onConfirm(localSelectedItems);
    }
    onDisable();
  };

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.mainContainer}>
        <View style={styles.headerContainer}>
          <View
            style={[
              styles.row,
              { paddingTop: insests.top, paddingHorizontal: 12 },
            ]}
          >
            <TouchableOpacity
              onPress={onDisable}
              activeOpacity={0.6}
              style={styles.backIcon}
            >
              <Icons
                name="keyboard-arrow-left"
                family="MaterialIcons"
                size={26}
                color={colors.text}
              />
            </TouchableOpacity>

            <CustomText
              label={title}
              color={colors.text}
              fontFamily={fonts.semiBold}
              textTransform="capitalize"
              fontSize={20}
            />
          </View>

          <Divider
            marginTop={8}
            marginBottom={0}
            thickness={2}
            color={colors.white04}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((f, idx) => {
              const isSelected = multiSelect
                ? localSelectedItems.includes(f.name)
                : selectedIndex === idx;
              return (
                <TouchableOpacity
                   key={`${f.name}-${idx}`}
                  activeOpacity={0.7}
                  style={[styles.filterItem]}
                  onPress={() => handleItemToggle(f)}
                >
                  <View style={styles.row}>
                    {f?.image ? (
                      <Image source={f.image} style={styles.filterImage} />
                    ) : null}
                    <View>
                      <CustomText
                        label={f.name}
                        color={colors.text}
                        fontFamily={fonts.medium}
                        fontSize={16}
                        marginLeft={f?.image ? 12 : 0}
                      />
                      {f.subtitle && (
                        <CustomText
                          label={f.subtitle}
                          color={colors.textSecondary}
                          fontFamily={fonts.medium}
                          fontSize={14}
                          marginLeft={f?.image ? 12 : 0}
                        />
                      )}
                    </View>
                  </View>
                  <View
                    style={
                      isSelected
                        ? styles.circleIndicatorUnselected
                        : styles.circleIndicator
                    }
                  >
                    <View
                      style={[
                        styles.innerCircle,
                        isSelected && styles.innerCircleSelected,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {multiSelect && (
            <View style={styles.buttonContainer}>
              <CustomButton
                title={`Confirm ${
                  localSelectedItems.length > 0
                    ? `(${localSelectedItems.length})`
                    : ""
                }`}
                onPress={handleConfirm}
              />
            </View>
          )}
        </View>
      </View>
    </CustomModal>
  );
};

export default FilterModal;

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
    borderRadius: 22,
  },
  headerContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },

  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    backgroundColor: colors.white04,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#FFFFFF0A" : colors.border,
    padding: 16,
    height: 64,
  },

  filterImage: {
    width: 16,
    height: 16,
    borderRadius: 6,
    resizeMode: "cover",
  },
  circleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: isDark ? "#FFFFFF7A" : "rgba(18, 18, 18, 0.32)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  circleIndicatorUnselected: {
    borderColor: COLORS.buttonColor,
    borderWidth: 1,
    borderRadius: 100,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 100,
    backgroundColor: "transparent",
  },
  innerCircleSelected: {
    backgroundColor: COLORS.buttonColor,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 24,
  },
});
