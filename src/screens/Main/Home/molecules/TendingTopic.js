import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";


const TendingTopic = ({
  hashtags = [],
  selectedHashtag,
  onSelectHashtag,
  trendingTopics = [],
  selectedTrendingTopic,
  onSelectTrendingTopic,
}) => {
  const { colors, isDark } = useTheme();
  // Figma chips are Title Case ("Crypto"); the API stores tags lowercase.
  const toTitle = (v = "") =>
    String(v)
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <View style={styles.row}>
        <CustomText
          label={"TODAY\u2019S"}
          // Figma: BoldItalic 16 / 18 / −6%
          fontSize={16}
          color={COLORS.gray48}
          fontFamily={fonts.BoldItalic}
          fontStyle="italic"
          letterSpacing={-0.96}
        />
        <CustomText
          label={"MAIN TOPICS"}
          fontSize={16}
          color={colors.text}
          marginLeft={2}
          fontFamily={fonts.BoldItalic}
          fontStyle="italic"
          letterSpacing={-0.96}
        />
      </View>
      <View style={styles.wrapper}>
        {hashtags?.map((item, index) => {
          const isSelected = selectedHashtag === item._id;
          const bgColor = isSelected ? colors.text : colors.surfaceAlt;
          const textColor = isSelected ? "#121212" : COLORS.gray48;

          return (
            <TouchableOpacity
              key={`${item._id || item.tag}-${index}`}
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
              <Icons
                family="MaterialSymbolsRounded"
                name="tag"
                size={16}
                color={textColor}
              />
              <CustomText
                label={toTitle(item.tag)}
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
              <Icons
                family="MaterialSymbolsRounded"
                name="trending_up"
                size={16}
                color={textColor}
              />
              {/* <Stock
                fill={textColor}
                color={textColor}
                width={14}
                height={14}
              /> */}
              <CustomText
                label={toTitle(item.topic)}
                fontSize={12}
                fontFamily={fonts.medium}
                color={textColor}
                marginLeft={2}
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
  // Figma: pad V12, title → chips 12 (title caps are 11pt; CustomText's
  // 16 × 1.4 = 22.4 line box adds ~5.7 above/below the caps, trimmed here
  // so the visual gaps match)
  mainContainer: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  // Figma: chips wrap, gap 4 × 4; the two wraps are 8 apart
  wrapper: {
    rowGap: 4,
    columnGap: 4,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
  },
  cardBg: {
    backgroundColor: COLORS.inputBg,
    paddingLeft: 6,
    paddingRight: 8,
    borderRadius: 100,
    height: 28,
    justifyContent: "center",
  },
});
