import { BlurView } from "@react-native-community/blur";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";

/**
 * Figma "New-Post-availble" (node 7570-11381): hug × 32, r100, pad 8,
 * gap 4, fill white 16% + background blur 32.
 * 16 sparkle #007BFF · "New posts available" Poppins Medium 14 / 0% white ·
 * 16 chevron-up white  (8 + 16 + 4 + 142 + 4 + 16 + 8 = 198 wide).
 * Height is fixed at 32 (= 8 + 16 + 8) so CustomText's taller line box
 * doesn't grow the pill; the row centres it.
 */
const NewPostsPill = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.pill}>
    {/* "dark" + 32 tinted the blur to a near-solid grey. Figma's blur 32 is
        a 16pt radius over the content, so: the most transparent iOS material
        at 16, with Figma's 16% white on top — the content behind shows
        through, blurred */}
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="ultraThinMaterialDark"
      blurAmount={16}
      reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.16)"
    />
    <View pointerEvents="none" style={styles.tint} />
    <Icons
      family="MaterialSymbolsRoundedFilled"
      name="auto_awesome"
      size={16}
      color="#007BFF"
    />
    <CustomText
      label="New posts available"
      fontSize={14}
      fontFamily={fonts.medium}
      color={COLORS.white}
    />
    <Icons
      family="MaterialSymbolsRounded"
      name="keyboard_arrow_up"
      size={16}
      color={COLORS.white}
    />
  </TouchableOpacity>
);

export default NewPostsPill;

const styles = StyleSheet.create({
  pill: {
    height: 32,
    paddingHorizontal: 8,
    gap: 4,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  // Figma: white 16% over #121212 = rgb(56,56,56). The iOS material already
  // lightens the blur on its own (measured: rgb(51,51,51) over #121212), so
  // a full 16% white on top came out at rgb(84,84,84) — a flat light grey.
  // 3% white lands on Figma's 56 and keeps the content showing through.
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
});
