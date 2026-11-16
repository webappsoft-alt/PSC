import { View } from "react-native";

import ImageFast from "./ImageFast";

/**
 * Brand logos (company profiles imported from Wikimedia) are usually wide or
 * transparent, so a cover-cropped circle cuts them ("Roche", "MSC"). They are
 * drawn whole instead, centred on a white disc like standard logo avatars.
 */
export const isLogoAvatar = (u) =>
  u?.role === "company" && !!u?.external?.wikidataQid;

export const LOGO_INSET = 0.14; // padding on each side, as a share of the size

const LogoAvatar = ({ uri, size, radius, children }) => {
  const inner = Math.round(size * (1 - 2 * LOGO_INSET));
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size / 2,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {children || (
        <ImageFast
          source={{ uri }}
          style={{ width: inner, height: inner }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

export default LogoAvatar;
