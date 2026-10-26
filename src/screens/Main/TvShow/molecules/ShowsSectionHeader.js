import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import {
  GlassFill,
  Glyph,
  SHOWS,
  baseline,
  capGap,
  capTop,
  fitLine,
} from "./showsLayout";

/**
 * Figma Show-Feed section header ("Frame 18145"): title block · gap 18 ·
 * "SEE MORE" (SemiBold 12 UPPER @64%) + 16 circle (white 4%) with a 14 gold
 * chevron_right. Optional 18 `sell` icon (filled, white), 4 before the text.
 * Lines are 6 apart (cap-trimmed); a single line sits in an 18pt row.
 *
 * line = { text, size: 12|14|18, weight: "medium"|"semiBold",
 *          color, parts?: [{ text, weight, color }] }
 */
const LINE_GAP = 6;

const fontFor = (weight) => (weight === "semiBold" ? fonts.semiBold : fonts.medium);
// Figma letter spacing: −0.5% on every header text
const spacingFor = (part, size) => -0.005 * size;

const Line = ({ line, style, box }) => {
  // single-line rows: fit the line box into the Figma row height
  const fit = box ? fitLine(line.size, box) : 0;
  const parts = line.parts || [line];
  return (
    <View style={[styles.line, style]}>
      {parts.map((part, i) => (
        <CustomText
          key={i}
          label={part.text}
          fontSize={line.size}
          fontFamily={fontFor(part.weight)}
          letterSpacing={spacingFor(part, line.size)}
          color={part.color || SHOWS.white}
          numberOfLines={1}
          marginTop={fit}
          marginBottom={fit}
          // Figma "Top Shows": the two words are 4 apart
          marginLeft={i > 0 && part.gap ? part.gap : 0}
        />
      ))}
    </View>
  );
};

/** One text line made of several inline runs (e.g. "People from" + country). */
export const InlineLine = ({ line }) => (
  <CustomText
    fontSize={line.size}
    letterSpacing={-0.005 * line.size}
    fontFamily={fonts.medium}
    color={SHOWS.white64}
    numberOfLines={1}
  >
    {line.parts.map((part, i) => (
      <Text
        key={i}
        style={{
          fontFamily: fontFor(part.weight),
          color: part.color || SHOWS.white,
        }}
      >
        {part.text}
      </Text>
    ))}
  </CustomText>
);

export const SeeMore = ({ onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    disabled={!onPress}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    style={styles.seeMore}
  >
    <CustomText
      label="See more"
      textTransform="uppercase"
      fontSize={12}
      fontFamily={fonts.semiBold}
      color={SHOWS.white64}
      marginTop={fitLine(12, 16)}
      marginBottom={fitLine(12, 16)}
    />
    <View style={styles.seeMoreCircle}>
      <GlassFill fill={SHOWS.white04} />
      <Glyph
        family="MaterialSymbolsRounded"
        name="chevron_right"
        size={14}
        color={SHOWS.gold}
      />
    </View>
  </TouchableOpacity>
);

const ShowsSectionHeader = ({ lines = [], icon, onSeeMore, singleHeight = 18 }) => {
  const single = lines.length === 1;

  if (single) {
    // Figma: icon 18 + 18pt text box, "SEE MORE" centred on the row
    return (
      <View style={[styles.row, styles.center]}>
        <View style={[styles.titleRow, styles.center]}>
          {icon ? <SectionIcon /> : null}
          <Line line={lines[0]} box={singleHeight} />
        </View>
        <SeeMore onPress={onSeeMore} />
      </View>
    );
  }

  // Multi-line: block top-aligned with "SEE MORE"; the icon centred on the
  // block. Text boxes are trimmed to cap → baseline like Figma.
  return (
    <View style={styles.row}>
      <View style={[styles.titleRow, styles.center]}>
        {icon ? <SectionIcon /> : null}
        <View style={styles.flex}>
          {lines.map((line, i) => {
            const prev = lines[i - 1];
            const isLast = i === lines.length - 1;
            const Comp = line.inline ? InlineLine : Line;
            return (
              <View
                key={i}
                style={{
                  marginTop: prev
                    ? capGap(LINE_GAP, prev.size, line.size)
                    : capTop(line.size),
                  marginBottom: isLast ? baseline(line.size) : 0,
                }}
              >
                <Comp line={line} />
              </View>
            );
          })}
        </View>
      </View>
      <SeeMore onPress={onSeeMore} />
    </View>
  );
};

const SectionIcon = () => (
  <Glyph
    family="MaterialSymbolsRoundedFilled"
    name="sell"
    size={18}
    color={SHOWS.white}
    style={styles.icon}
  />
);

export default ShowsSectionHeader;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    // Figma: title block · 18 · see more
    gap: 18,
  },
  center: {
    alignItems: "center",
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
  },
  icon: {
    marginRight: 4,
  },
  line: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  seeMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeMoreCircle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
