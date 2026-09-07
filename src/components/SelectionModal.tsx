import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import LottieView from "lottie-react-native";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Icons from "./Icons";
import Header from "./Header";
import { COLORS } from "../utils/COLORS";
import { ToastMessage } from "../utils/ToastMessage";
import { useSelector } from "react-redux";

type SelectionType =
  | "age"
  | "topic"
  | "visibleTo"
  | "category"
  | "cta"
  | "redirectTo"
  | "audience"
  | "gender"
  | "origin"
  | "madeIn"
  | "otherCategory";

interface BaseOption {
  id: string;
  title?: string;
  emoji?: string;
  lottie?: string;
}

interface SelectionModalProps {
  isVisible: boolean;
  onModalClose: () => void;
  type?: SelectionType;
  selected?: string;
  onSelection?: (value: string) => void;
  options?: string[]; // New prop for custom options
  isDarkMode?: boolean;
}

const ageRatings: BaseOption[] = [
  { id: "+14", title: "14 years old or older" },
  { id: "+16", title: "16 years old or older" },
  { id: "+18", title: "18 years old or older" },
  { id: "+21", title: "21 years old or older" },
];

const categories = [
  {
    id: "Clothing",
    emoji: "👕",
  },
  {
    id: "Electronics",
    emoji: "🎮",
  },
  {
    id: "Healthcare",
    emoji: "💚",
  },
  {
    id: "Toys",
    emoji: "🧸",
  },
  {
    id: "Food",
    emoji: "🥖",
  },
  {
    id: "Others",
    emoji: "🎬",
    lottie: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ac/lottie.json",
  },
];

const topic: BaseOption[] = [
  {
    id: "Entertainment",
    emoji: "🎬 ",
    lottie: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ac/lottie.json",
  },
  { id: "Fashion", emoji: "👟 " },
  { id: "Food", emoji: "🥖 " },
  { id: "Gaming", emoji: "� " },
  { id: "Health", emoji: "💚 " },
  { id: "Music", emoji: "🎹 " },
  { id: "Politics", emoji: "🏛️ " },
  { id: "Sports", emoji: "🎾 " },
  { id: "Technology", emoji: "💡 " },
  { id: "Travel", emoji: "✈️ " },
];

const visibleToOptions: BaseOption[] = [
  { id: "Public" },
  { id: "Followers" },
  { id: "Subscribers" },
  { id: "Favorite" },
  { id: "Private" },
];

const SelectionModal = ({
  isVisible,
  onModalClose,
  type = "age",
  selected,
  onSelection = () => {},
  options = [],
}: SelectionModalProps) => {
  const { userData } = useSelector((store: any) => store.users);

  const theme = {
    background: COLORS.black,
    cardBackground: COLORS.white16,
    text: COLORS.white,
    textSecondary: COLORS.gray,
    textTertiary: COLORS.gray2,
    border: COLORS.gray5,
    borderLight: COLORS.white04,
  };

  const getOptions = (): BaseOption[] => {
    // If custom options are provided, convert them to BaseOption format
    if (options && options.length > 0) {
      return options.map((opt) => ({
        id: opt,
        title: undefined,
        emoji: undefined,
      }));
    }

    switch (type) {
      case "age":
        return ageRatings;
      case "topic":
        return topic;
      case "visibleTo":
        return visibleToOptions;
      case "category":
        return topic;
      case "otherCategory":
        return categories;
      default:
        return [];
    }
  };

  const getTitle = (): string => {
    switch (type) {
      case "age":
        return "Age Rating";
      case "topic":
        return "Select a topic";
      case "visibleTo":
        return "Visible To";
      case "category":
        return "Select Category";
      case "cta":
        return "Call To Action";
      case "redirectTo":
        return "Redirect To";
      case "audience":
        return "Select Audience";
      case "gender":
        return "Select Gender";
      case "origin":
        return "Select Origin";
      case "madeIn":
        return "Select Made In";
      default:
        return "Select Option";
    }
  };

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onModalClose}>
      <View
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
      >
        <View style={{ borderBottomWidth: 2, borderColor: theme.border }}>
          <Header
            title={getTitle()}
            textColor={theme.text}
            iconColor={theme.text}
            onBackPress={onModalClose}
            iconBackgroundColor={theme.cardBackground}
          />
        </View>

        <FlatList
          data={getOptions()}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => {
                const selectedValue = item.id;
                if (selectedValue === "Subscribers") {
                  if (!userData?.user?.profile?.isPro) {
                    ToastMessage(
                      "Only Pro users can select subscribers option",
                      "error",
                    );
                    return;
                  }

                  if (!userData?.user?.profile?.subscribePlanProductId) {
                    ToastMessage(
                      "First save subscription price for your subscribers",
                      "error",
                    );
                    return;
                  }
                }

                onSelection(selectedValue);
                if (type !== "topic") {
                  onModalClose();
                }
              }}
              activeOpacity={0.9}
              style={[
                styles.row,
                {
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: index === getOptions()?.length - 1 ? 0 : 1,
                  borderBottomColor: theme.borderLight,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {selected === item.id && item.lottie ? (
                  <LottieView
                    source={{ uri: item.lottie }}
                    autoPlay
                    loop
                    style={{ width: 24, height: 24 }}
                  />
                ) : (
                  <CustomText
                    label={item.emoji ?? ""}
                    fontSize={16}
                    fontFamily="Poppins_500Medium"
                    color={theme.text}
                  />
                )}

                <View>
                  <CustomText
                    label={item.id}
                    fontSize={16}
                    fontFamily="Poppins_500Medium"
                    color={theme.text}
                  />

                  {item.title && (
                    <CustomText
                      label={item.title}
                      fontSize={14}
                      color={theme.textSecondary}
                    />
                  )}
                </View>
              </View>

              <Icons
                family="MaterialCommunityIcons"
                name={
                  selected === item.id ? "radiobox-marked" : "radiobox-blank"
                }
                size={22}
                color={selected === item.id ? theme.text : theme.textTertiary}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    </CustomModal>
  );
};

export default SelectionModal;

const styles = StyleSheet.create({
  modalContainer: {
    width: "100%",
    height: "100%",
  },
  row: {
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
  },
});
