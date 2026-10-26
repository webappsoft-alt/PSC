import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { GlassFill } from "./matchLayout";

/**
 * Figma › Matching › "NOT ENOUGH EXTRAS": SuperLikes-FG, No-more-likes-FG,
 * Rewinds-FG with the "Secured" pill on top (5744:6163). Presented through
 * the app's FloatingSheet like every modal (backdrop blur, glass outline,
 * spring-up). Content: pad 16 / 12 / 12, title + body (pad 8) then the two
 * 56pt buttons 24 below, 8 apart.
 */
export const EXTRAS_SHEETS = {
  superlike: {
    title: "Super likes",
    icon: "star",
    iconColor: "#007BFF",
    body: "Stand out with Super Likes and get much more chance to connect with other like minded profiles.",
    action: "Buy more Super likes!",
    detail: "$2 each",
    route: ["Plans", { tab: "Super Likes" }],
  },
  likes: {
    title: "No more likes?",
    icon: "favorite",
    iconColor: "#64CD75",
    body: "Subscribe to any plans and get instantly unlimited likes and start discovering individuals around you!",
    action: "Subscribe",
    detail: "from $9.90/month",
    route: ["PlansViral"],
  },
  rewind: {
    title: "Rewinds",
    icon: "fast_rewind",
    iconColor: COLORS.white,
    body: "For an hour be the most reviewed profile in your category and get much more chance to connect with other like minded profiles.",
    action: "Buy more Rewinds!",
    detail: "$2 each",
    route: ["Plans", { tab: "Rewinds" }],
  },
  // not in Figma: same sheet for boosts (purple bolt like the action button)
  boost: {
    title: "Boosts",
    icon: "bolt",
    iconColor: "#8400E7",
    body: "For an hour be the most reviewed profile in your category and get much more chance to connect with other like minded profiles.",
    action: "Buy more Boosts!",
    detail: "$2 each",
    route: ["Plans", { tab: "Boosts" }],
  },
};

// Figma body: Regular 14 with "auto" (1.5) line height = 21 per line; the
// CustomText box is 1.4 (19.6), so each line is 1.4pt shorter. The first
// glyph keeps its place (+0.7) and the block keeps its height (n × 1.4).
const BODY_SIZE = 14;
const BODY_LINE_DIFF = BODY_SIZE * 1.5 - BODY_SIZE * 1.4;
// Figma primary button: 16pt + 14pt text boxes, 4 apart, centred in 56 →
// glyph centres 19 apart; CustomText boxes are 25.2 and 19.6 tall
const DETAIL_GAP = 19 - (18 * 1.4) / 2 - (14 * 1.4) / 2;

const ExtrasSheet = ({ type, onClose, onAction }) => {
  const insets = useSafeAreaInsets();
  const [bodyLines, setBodyLines] = useState(3);
  const sheet = type ? EXTRAS_SHEETS[type] : null;
  // keep the content while the sheet slides out
  const [last, setLast] = useState(sheet);
  if (sheet && sheet !== last) setLast(sheet);
  const content = sheet || last;

  if (!content) return null;

  return (
    <FloatingSheet
      visible={!!sheet}
      onDismiss={onClose}
      gap={24}
      innerStyle={styles.inner}
      overlay={
        <View pointerEvents="none" style={[styles.securedWrap, { top: insets.top }]}>
          <View style={styles.secured}>
            <GlassFill fill="rgba(255, 255, 255, 0.16)" blurAmount={32} />
            <Icons
              family="MaterialSymbolsRounded"
              name="info"
              size={16}
              color={COLORS.gray64}
            />
            <CustomText
              label="Secured"
              fontSize={14}
              fontFamily={fonts.medium}
              color={COLORS.white}
            />
          </View>
        </View>
      }
      header={
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <CustomText
              label={content.title}
              fontSize={32}
              fontFamily={fonts.semiBold}
              letterSpacing={-0.64}
              color={COLORS.white}
            />
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name={content.icon}
              size={32}
              color={content.iconColor}
            />
          </View>
          <CustomText
            label={content.body}
            fontSize={BODY_SIZE}
            fontFamily={fonts.regular}
            color={COLORS.gray64}
            marginTop={16 + BODY_LINE_DIFF / 2}
            marginBottom={bodyLines * BODY_LINE_DIFF - BODY_LINE_DIFF / 2}
            onTextLayout={(e) => {
              const n = e?.nativeEvent?.lines?.length;
              if (n && n !== bodyLines) setBodyLines(n);
            }}
          />
        </View>
      }
    >
      <View style={styles.buttons}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onAction?.(content)}
          style={[styles.button, styles.buttonPrimary]}
        >
          <CustomText
            label={content.action}
            fontSize={18}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.36}
            color="#121212"
          />
          <CustomText
            label={content.detail}
            fontSize={14}
            fontFamily={fonts.regular}
            letterSpacing={-0.28}
            color="rgba(18, 18, 18, 0.64)"
            marginTop={DETAIL_GAP}
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          style={styles.button}
        >
          <GlassFill fill="rgba(255, 255, 255, 0.04)" />
          <CustomText
            label="Maybe later"
            fontSize={16}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.32}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>
    </FloatingSheet>
  );
};

export default ExtrasSheet;

const styles = StyleSheet.create({
  inner: {
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  securedWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  secured: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 100,
  },
  texts: {
    paddingHorizontal: 8,
  },
  // Figma row is 32 (32 icon); the 32pt title's 44.8 line box overhangs it
  // by 6.4 each side — negative margins keep the 32pt layout without
  // squeezing (and clipping) the text
  titleRow: {
    marginVertical: -(32 * 1.4 - 32) / 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttons: {
    gap: 8,
  },
  button: {
    height: 56,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.white,
  },
});
