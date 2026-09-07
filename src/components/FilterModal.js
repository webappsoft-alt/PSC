import { BlurView } from "@react-native-community/blur";
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";

import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";

import fonts from "../assets/fonts";
import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import Icons from "./Icons";
import { useTheme } from "../contexts/ThemeContext";

const FilterModal = ({
  isVisible,
  onDisable,
  onItemPress,
  title,
  subtitle,
}) => {
  const { colors, isDark } = useTheme();
  const sampleData = [
    { _id: "1", label: "New & Used" },
    { _id: "2", label: "New & Certified" },
    { _id: "3", label: "Certified Pre-Owned" },
    { _id: "4", label: "New" },
    { _id: "5", label: "Front-Wheel Drive" },
  ];

  const [selectedId, setSelectedId] = useState(null);

  const selectOption = (item) => {
    setSelectedId(item._id);
  };

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View
        style={{
          padding: 5,
          width: "95%",
          alignSelf: "center",
          borderRadius: 24,
          marginBottom: 12,
          maxHeight: "100%",
          borderWidth: 1,
          backgroundColor: isDark ? "#FFFFFF29" : "#0000000A",
          borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.1)",
        }}
      >
        <BlurView
          style={{
            maxHeight: "100%",
            width: "100%",
            borderRadius: 24,
          }}
          blurType={isDark ? "dark" : "light"}
          blurAmount={26}
          reducedTransparencyFallbackColor={isDark ? "#FFFFFF29" : "#0000000A"}
        />

        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
          <View style={styles.row}>
            <CustomText
              label={title || "Filters"}
              fontFamily={fonts.semiBold}
              fontSize={24}
              color={colors.text}
            />
            <TouchableOpacity
              onPress={onDisable}
              style={{
                height: 32,
                width: 32,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Image source={PNGIcons.cross} style={[styles.icon, { tintColor: colors.text }]} />
            </TouchableOpacity>
          </View>
          <CustomText
            label={subtitle || "Find the perfect fit for you!"}
            fontFamily={fonts.medium}
            color={colors.textSecondary}
          />

          <FlatList
            data={sampleData}
            keyExtractor={(item, index) =>
              item && item._id ? item._id.toString() : index.toString()
            }
            renderItem={({ item }) => {
              const isSelected = selectedId === item._id;

              return (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.surfaceAlt }, isSelected && { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => selectOption(item)}
                  activeOpacity={0.6}
                >
                  <CustomText
                    label={item.label || ""}
                    fontSize={16}
                    fontFamily={fonts.medium}
                    color={isSelected ? COLORS.darkPurple : colors.text}
                    style={{ flex: 1 }}
                  />
                  <CustomText
                    label={item.subTitle || ""}
                    fontFamily={fonts.medium}
                    color={isSelected ? COLORS.darkPurple : colors.textSecondary}
                    style={{ flex: 1 }}
                  />
                  <Icons
                    family="MaterialCommunityIcons"
                    name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                    size={24}
                    color={isSelected ? COLORS.darkPurple : colors.iconMuted}
                  />
                </TouchableOpacity>
              );
            }}
            onEndReachedThreshold={0.5}
            style={{ maxHeight: 400, marginTop: 10 }}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 20,
            }}
          >
            <CustomButton
              title={"Clear All"}
              width="47%"
              height={48}
              backgroundColor={colors.surfaceAlt}
              color={colors.text}
            />
            <CustomButton
              title={"Confirm"}
              width="47%"
              height={48}
              backgroundColor={colors.text}
              color={colors.background}
            />
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 22,
  },
  icon: {
    height: 16,
    width: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterIcon: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
   modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedItem: {
    backgroundColor: "#f3f3f3",
  },
});
