import { Image, ImageBackground, StyleSheet, View, useWindowDimensions } from "react-native";
import { useState } from "react";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { SHOWS, baseline, capTop } from "./showsLayout";

/**
 * Figma Show-Feed "Famous Creators" (3738:3391): image background, pad
 * 24 / 12 / 32 / 12, gap 32; title Medium 32 −3% white; a 2 × 4 grid of
 * 85 × 83 tiles 4 apart (columns stretch across the 351 content width),
 * white 48% on a blur 16, pad 12 around the 61 × 59 logo; only the grid's
 * outer corners are rounded 12.
 * The tile glass is drawn like Figma does it: the section's own background,
 * gaussian-blurred 16 (Image blurRadius), under a white 48% fill — a native
 * UIBlurEffect tints and diffuses far more than the design.
 *
 * For now the tiles are the Figma placeholder (Nike) — the client wants the
 * design shown as drawn until real creator artwork exists.
 */
const GAP = 4;
const TILE_H = 83;
const TILE_PAD = 12;
const TILES = 8;

const cornerRadius = (index) => {
  switch (index) {
    case 0:
      return { borderTopLeftRadius: 12 };
    case 3:
      return { borderTopRightRadius: 12 };
    case 4:
      return { borderBottomLeftRadius: 12 };
    case 7:
      return { borderBottomRightRadius: 12 };
    default:
      return null;
  }
};

const BG = Image.resolveAssetSource(Images.showsCreatorsBg);

const FamousCreators = () => {
  const { width } = useWindowDimensions();
  const [size, setSize] = useState({ width, height: 0 });
  // Figma 85 on a 375 screen; the 4 columns share the content width
  const tileW = (width - 24 - GAP * 3) / 4;
  // the Figma grid starts 78 from the top (pad 24 + 22 title + gap 32)
  const gridTop = 24 + (32 * 1.4 + capTop(32) + baseline(32)) + 32;
  // "cover" geometry of the background, so each tile can show its own slice
  const scale = Math.max(size.width / BG.width, size.height / BG.height);
  const bgW = BG.width * scale;
  const bgH = BG.height * scale;
  const bgX = (size.width - bgW) / 2;
  const bgY = (size.height - bgH) / 2;
  return (
    <ImageBackground
      source={Images.showsCreatorsBg}
      resizeMode="cover"
      style={styles.section}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      <CustomText
        label="Famous Creators"
        fontSize={32}
        fontFamily={fonts.medium}
        letterSpacing={-0.96}
        color={SHOWS.white}
        marginTop={capTop(32)}
        marginBottom={baseline(32)}
      />
      <View style={styles.grid}>
        {Array.from({ length: TILES }).map((_, index) => {
          const col = index % 4;
          const row = index < 4 ? 0 : 1;
          const tileX = 12 + col * (tileW + GAP);
          const tileY = gridTop + row * (TILE_H + GAP);
          return (
          <View key={index} style={[styles.tile, { width: tileW }, cornerRadius(index)]}>
            {size.height ? (
              <Image
                source={Images.showsCreatorsBg}
                blurRadius={16}
                style={{
                  position: "absolute",
                  left: bgX - tileX,
                  top: bgY - tileY,
                  width: bgW,
                  height: bgH,
                }}
              />
            ) : null}
            <View style={[StyleSheet.absoluteFill, styles.tileFill]} />
            <Image
              source={Images.showsNike}
              resizeMode="cover"
              style={{ width: tileW - TILE_PAD * 2, height: TILE_H - TILE_PAD * 2 }}
            />
          </View>
          );
        })}
      </View>
    </ImageBackground>
  );
};

export default FamousCreators;

const styles = StyleSheet.create({
  section: {
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 32,
    gap: 32,
    overflow: "hidden",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    height: TILE_H,
    padding: TILE_PAD,
    overflow: "hidden",
  },
  tileFill: {
    backgroundColor: "rgba(255, 255, 255, 0.48)",
  },
});
