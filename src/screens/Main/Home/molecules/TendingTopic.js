import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

import { SvgXml } from "react-native-svg";

const getHashtagSvg = (color) =>
  `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="${color}"><g><path d="M20,9L20,9c0-0.55-0.45-1-1-1h-3V5c0-0.55-0.45-1-1-1h0c-0.55,0-1,0.45-1,1v3h-4V5c0-0.55-0.45-1-1-1h0C8.45,4,8,4.45,8,5 v3H5C4.45,8,4,8.45,4,9v0c0,0.55,0.45,1,1,1h3v4H5c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h3v3c0,0.55,0.45,1,1,1h0 c0.55,0,1-0.45,1-1v-3h4v3c0,0.55,0.45,1,1,1h0c0.55,0,1-0.45,1-1v-3h3c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1h-3v-4h3 C19.55,10,20,9.55,20,9z M14,14h-4v-4h4V14z"/></g></svg>`;

const TendingTopic = ({
  hashtags = [],
  selectedHashtag,
  onSelectHashtag,
  trendingTopics = [],
  selectedTrendingTopic,
  onSelectTrendingTopic,
}) => {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <View style={styles.row}>
        <CustomText
          label={"TRENDING"}
          color={colors.textSecondary}
          fontFamily={fonts.medium}
        />
        <CustomText
          label={"TOPICS"}
          color={colors.text}
          marginLeft={4}
          fontFamily={fonts.medium}
        />
      </View>
      <View style={styles.wrapper}>
        {hashtags?.map((item, index) => {
          const isSelected = selectedHashtag === item._id;
          const bgColor = isSelected ? colors.text : colors.surfaceAlt;
          const textColor = isSelected ? colors.background : colors.textSecondary;

          return (
            <TouchableOpacity
              key={item._id || index}
              onPress={() => onSelectHashtag && onSelectHashtag(item._id)}
              activeOpacity={0.7}
              style={[
                styles.cardBg,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: bgColor,
                },
              ]}
            >
              <SvgXml xml={getHashtagSvg(textColor)} width={16} height={16} />
              <CustomText
                label={item.tag}
                fontSize={12}
                color={textColor}
                fontFamily={fonts.medium}
                marginLeft={2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[styles.wrapper, { marginTop: 8 }]}>
        {trendingTopics?.map((item, index) => {
          const isSelected = selectedTrendingTopic === item.topic;
          const bgColor = isSelected ? COLORS.buttonColor : colors.surfaceAlt;
          const textColor = isSelected ? COLORS.black : COLORS.buttonColor;

          return (
            <TouchableOpacity
              key={index}
              onPress={() =>
                onSelectTrendingTopic && onSelectTrendingTopic(item.topic)
              }
              activeOpacity={0.7}
              style={[
                styles.cardBg,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: bgColor,
                },
              ]}
            >
              <Image
                tintColor={textColor}
                source={Images.stock}
                style={{ height: 14, width: 14 }}
              />
              {/* <Stock
                fill={textColor}
                color={textColor}
                width={14}
                height={14}
              /> */}
              <CustomText
                label={item.topic}
                fontSize={12}
                fontFamily={fonts.medium}
                color={textColor}
                marginLeft={4}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default React.memo(TendingTopic);

const styles = StyleSheet.create({
  mainContainer: { padding: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  wrapper: {
    gap: 4,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
  },
  cardBg: {
    backgroundColor: COLORS.inputBg,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 99,
    height: 32,
    justifyContent: "center",
  },
});
