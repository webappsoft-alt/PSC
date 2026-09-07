import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Icons from "./Icons";

const AgeRatingModal = ({
  isVisible,
  onDisable,
  title = "Age Rating",
  initialAgeLimit,
  initialRating,
  onApply,
  ageLimits: ageLimitsProp,
  ratings: ratingsProp,
}) => {
  const insests = useSafeAreaInsets();

  const ageLimits =
    Array.isArray(ageLimitsProp) && ageLimitsProp.length > 0
      ? ageLimitsProp
      : [
          { name: "No Age Restriction" },
          { name: "7+" },
          { name: "12+" },
          { name: "16+" },
          { name: "18+" },
        ];

  const contentRatings =
    Array.isArray(ratingsProp) && ratingsProp.length > 0
      ? ratingsProp
      : [
          { name: "G" },
          { name: "PG" },
          { name: "PG-13" },
          { name: "R" },
          { name: "NC-17" },
          { name: "Mature" },
        ];

  const [selectedAgeIndex, setSelectedAgeIndex] = useState(() => {
    const idx = ageLimits.findIndex((a) => a.name === initialAgeLimit);
    return idx >= 0 ? idx : 0;
  });
  const [selectedRatingIndex, setSelectedRatingIndex] = useState(() => {
    const idx = contentRatings.findIndex((r) => r.name === initialRating);
    return idx >= 0 ? idx : 0;
  });

  const handleApply = () => {
    const age = ageLimits[selectedAgeIndex]?.name;
    const rating = contentRatings[selectedRatingIndex]?.name;
    onApply?.(age, rating);
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
              style={[styles.backIcon, { backgroundColor: "#FFFFFF14" }]}
            >
              <Icons
                name="keyboard-arrow-left"
                family="MaterialIcons"
                size={26}
                color={COLORS.white}
              />
            </TouchableOpacity>

            <CustomText
              label={title}
              color={COLORS.white}
              fontFamily={fonts.semiBold}
              textTransform="capitalize"
              fontSize={20}
            />
          </View>

          <ScrollView
            style={{ marginTop: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {ageLimits.map((a, idx) => {
              const isSelected = selectedAgeIndex === idx;
              return (
                <TouchableOpacity
                  key={`age-${a.name}-${idx}`}
                  activeOpacity={0.7}
                  style={[styles.filterItem]}
                  onPress={() => setSelectedAgeIndex(idx)}
                >
                  <View style={styles.itemTextBlock}>
                    <CustomText
                      label={a.name}
                      color={COLORS.white}
                      fontFamily={fonts.medium}
                      fontSize={16}
                    />
                    {a.subtitle ? (
                      <CustomText
                        label={a.subtitle}
                        color={COLORS.subtitle}
                        fontFamily={fonts.medium}
                        fontSize={12}
                        marginTop={4}
                      />
                    ) : null}
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
        </View>
      </View>
    </CustomModal>
  );
};

export default AgeRatingModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#262626",
    borderRadius: 22,
  },
  headerContainer: {
    backgroundColor: COLORS.primaryColor,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
    borderBottomColor: "#FFFFFF0A",
    padding: 16,
  },
  circleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#FFFFFF7A",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIndicatorUnselected: {
    borderColor: "#A19375",
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
    backgroundColor: "#A19375",
  },
});
