import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "./CustomText";

import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import { useTheme } from "../contexts/ThemeContext";

const TopTabWithBG = ({
  tab,
  setTab,
  tabNames = [],
  fontSize = 16,
  paddingVertical,
  paddingHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
  isImage,
  image,
  imageWidth,
  imgeHeight,
  tabImages = {},
  width,
  fontFamily,
  activeHeight,
  withImage,
  activeFontFamily,
  alignSelf,
  height = 48,
  backgroundColor = "#1d1d1d",
  selectedColor,
}) => {
  const { colors, isDark } = useTheme();
  const containerBg = backgroundColor !== "#1d1d1d" ? backgroundColor : (isDark ? "#1d1d1d" : "rgba(0,0,0,0.05)");
  return (
    <View
      style={[
        styles.mainContainer,
        {
          marginVertical: marginVertical || 16,
          marginTop: marginTop,
          marginBottom: marginBottom,
           width,
          alignSelf,
          height,
          backgroundColor: containerBg,
          gap: 4,
        },
      ]}
    >
      {tabNames?.map((tabName, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setTab(tabName)}
          style={[
            styles.item,
            {
              paddingVertical: paddingVertical ? paddingVertical : 5,
              paddingHorizontal: paddingHorizontal,
              backgroundColor:
                tab === tabName
                  ? selectedColor || (isDark ? "#FFFFFF0A" : "#FFFFFF")
                  : (isDark ? "#1d1d1d" : "transparent"),
              borderRadius: 100,
              height: activeHeight,
            },
          ]}
        >
          {isImage ? (
            <>
              <Image
                source={tabImages?.[tabName] || image}
                style={{
                  width: imageWidth,
                  height: imgeHeight,
                  tintColor: tab === tabName ? COLORS.white : COLORS.black,
                }}
              />
            </>
          ) : (
            <View style={styles.row}>
              {withImage && (
                <Image
                  source={tabImages?.[tabName]}
                  style={{
                    width: 12,
                    height: 12,
                    tintColor: tab === tabName ? "#fff" : "#000",
                  }}
                />
              )}
              <CustomText
                textTransform="capitalize"
                fontFamily={
                  fontFamily
                    ? fontFamily
                    : tab === tabName
                    ? activeFontFamily || fonts.semiBold
                    : fonts.regular
                }
                label={tabName}
                fontSize={fontSize}
                lineHeight={fontSize * 1.4}
                color={tab == tabName ? colors.text : (isDark ? "#FFFFFFA3" : colors.iconMuted)}
              />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TopTabWithBG;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 100,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
});
