import { memo } from "react";
import { Image, StyleSheet, View } from "react-native";

/**
 * Country / currency flag drawn as an image (client rule: flags are never
 * emoji text). Same source as Viral's CustomPhoneInput / CountryPickerModal
 * (flagcdn), w80 so it stays sharp at 3×.
 *  · round (default): 18 / 20 circles like Viral's phone input
 *  · `width` + `height` + `radius`: e.g. the Figma currency flag 17 × 12
 */
export const flagUri = (code) =>
  code ? `https://flagcdn.com/w80/${String(code).toLowerCase()}.png` : null;

const FlagImage = ({ code, size = 18, width, height, radius, style }) => {
  const w = width || size;
  const h = height || size;
  const r = radius ?? (width || height ? 2 : 99);
  const uri = flagUri(code);
  return (
    <View
      style={[
        styles.clip,
        { width: w, height: h, borderRadius: r },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: w, height: h }} resizeMode="cover" />
      ) : null}
    </View>
  );
};

export default memo(FlagImage);

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
});
