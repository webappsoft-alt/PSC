import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";

/**
 * Feed-style topic chips (client: the category tabs are the same as the Home
 * feed's): compass tile 36×32 r8 + uppercase BoldItalic 14 −0.56 chips h32 r8
 * padH8 gap4, active white/#121212, idle #FFFFFF0A/white 64% — the styles are
 * copied from FeedHeader's topicChip so both rows always match.
 */
const TopicChips = ({ topics, value, onChange, style }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={style}
    contentContainerStyle={styles.content}
  >
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onChange?.(null)}
      style={[styles.compass, value == null && styles.active]}
    >
      <Icons
        family="MaterialCommunityIcons"
        name="compass"
        size={22}
        color={value == null ? "#121212" : COLORS.white}
      />
    </TouchableOpacity>
    {topics.map((t) => {
      const active = value === t;
      return (
        <TouchableOpacity
          key={t}
          activeOpacity={0.7}
          onPress={() => onChange?.(t)}
          style={[styles.chip, active && styles.active]}
        >
          <CustomText
            label={t.toUpperCase()}
            fontSize={14}
            fontFamily={fonts.BoldItalic}
            fontStyle="italic"
            letterSpacing={-0.56}
            color={active ? "#121212" : COLORS.gray64}
          />
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

export default TopicChips;

const styles = StyleSheet.create({
  content: { gap: 4, alignItems: "center", paddingHorizontal: 8 },
  chip: {
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: COLORS.inputBg,
  },
  compass: {
    height: 32,
    width: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.inputBg,
  },
  active: { backgroundColor: COLORS.white },
});
