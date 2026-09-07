import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import CustomText from "./CustomText";

import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import { BlurView } from "@react-native-community/blur";

import { useTheme } from "../contexts/ThemeContext";

const TopTab = ({
  tab,
  setTab,
  tabNames,
  rounded,
  marginBottom,
  marginTop,
  image,
  images, // New prop for array of images
  height,
  paddingVertical,
  paddingHorizontal = 10,
  fontFamily = fonts.medium,
  scrollViewPaddingHorizontal = 0,
  activeColor,
  imgMarginRight,
  borderRadius,
  oval,
  borderWidth,
  borderColor,
  ovalBg,
  activeTintColor,
  inactiveTintColor,
  isBlur,
}) => {
  const { colors, isDark } = useTheme();
  const finalActiveColor = activeColor || (isDark ? "white" : colors.text);
  const finalActiveTintColor = activeTintColor || (isDark ? COLORS.black : COLORS.white);
  const finalInactiveTintColor = inactiveTintColor || (isDark ? COLORS.white : colors.textSecondary);

  const getActiveTextColor = () => {
    if (
      finalActiveColor === "white" ||
      finalActiveColor === "#FFFFFF" ||
      finalActiveColor === "#fff"
    ) {
      return COLORS.black;
    }
    return COLORS.white;
  };

  return (
    <>
      {rounded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            marginBottom,
            marginTop,
            paddingHorizontal: scrollViewPaddingHorizontal,
            gap: 6,
          }}
        >
          {tabNames?.map((tabName, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setTab(index)}
              style={[
                styles.roundedContainer,
                {
                  borderWidth,
                  borderColor,
                  borderRadius: borderRadius || 99,
                  backgroundColor:
                    tab == index
                      ? finalActiveColor
                      : ovalBg || (isDark ? "#FFFFFF0A" : colors.surfaceAlt),
                  height: height || 34,
                  paddingVertical: paddingVertical,
                  paddingHorizontal: paddingHorizontal,
                  overflow: isBlur ? "hidden" : "visible",
                },
              ]}
            >
              {isBlur && (
                <BlurView
                  blurType={isDark ? "light" : "xlight"}
                  blurAmount={16}
                  style={{
                    backgroundColor: isDark ? "rgba(47, 47, 47, 0.1)" : "rgba(255, 255, 255, 0.1)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: borderRadius || 99,
                  }}
                />
              )}
              {(image || (images && images[index])) && (
                <Image
                  source={
                    images && images[index]
                      ? images[index]
                      : image || Images.car
                  }
                  style={{
                    height: 14,
                    width: 14,
                    marginRight: imgMarginRight,
                    tintColor:
                      tab == index ? finalActiveTintColor : finalInactiveTintColor,
                  }}
                />
              )}
              {tabName?.length > 0 ? (
                <CustomText
                  label={tabName}
                  lineHeight={14 * 1.4}
                  fontFamily={fontFamily}
                  textTransform="capitalize"
                  color={
                    oval
                      ? COLORS.buttonColor
                      : rounded && tab == index
                      ? getActiveTextColor()
                      : (isDark ? COLORS.white : colors.textSecondary)
                  }
                />
              ) : null}

              {tab === index && !rounded && <View style={styles.indicator} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.mainContainer]}>
          {tabNames?.map((tabName, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setTab(index)}
              style={[styles.item, tab === index && styles.activeTab]}
            >
              <CustomText
                label={tabName}
                fontFamily={fontFamily}
                textTransform="capitalize"
                color={tab === index ? colors.text : colors.textSecondary}
              />
              {tab === index && <View style={styles.indicator} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
};

export default TopTab;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  roundedContainer: {
    // borderWidth: 1.2,
    // borderColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 14,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  activeTab: {},
  indicator: {
    width: "90%",
    height: 3,
    borderRadius: 100,
    backgroundColor: COLORS.primaryColor,
    marginTop: 3,
  },
});
