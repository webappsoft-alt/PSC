import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "./molecules/Header";
import EventDetailCard from "./molecules/EventDetailCard";
import SearchEventHeader from "./molecules/SearchEventHeader";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import CustomText from "../../../components/CustomText";
import fonts from "../../../assets/fonts";

const tabs = ["Rock", "Pop", "Jazz", "Blues", "Rap"];

const SearchEvent = () => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [selectedTab, setSelectedTab] = useState("Rock");

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      paddingBottom={0.1}
      scrollEnabled
      headerUnScrollable={() => <SearchEventHeader />}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map((tab) => {
          const isSelected = tab === selectedTab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
              style={[styles.tabButton, isSelected && styles.tabButtonSelected]}
            >
              <CustomText
                label={tab}
                color={isSelected ? colors.background : colors.iconMuted}
                fontFamily={fonts.medium}
                fontSize={14}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 8 }}>
        <EventDetailCard />
        <EventDetailCard />
        <EventDetailCard />
      </View>
    </ScreenWrapper>
  );
};

export default SearchEvent;

const createStyles = (colors, isDark) => StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: "transparent",
  },
  tabButtonSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
});
