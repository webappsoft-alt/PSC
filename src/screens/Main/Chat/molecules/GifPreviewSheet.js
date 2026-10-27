import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Figma Chat page "GIF-Preview" (7890:3003) on the app FloatingSheet (inner
 * pad 12, gap 12): "GIF Preview" SemiBold 24 −2% + 32 close circle (white
 * 4%, 16 close) · 8 · "Make sure you have selected the correct GIF." Medium
 * 12 −1% @64% · 319 square (r16 white 8%, pad 8/12) · "Share GIF" gold 48.
 */
const GifPreviewSheet = ({ visible, gif, onDismiss, onShare, sharing }) => {
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      gap={12}
      header={
        <View style={styles.head}>
          <View style={styles.titleRow}>
            <CustomText label="GIF Preview" fontSize={24} fontFamily={fonts.semiBold} letterSpacing={-0.48} color={colors.text} />
            <TouchableOpacity activeOpacity={0.7} onPress={onDismiss} style={[styles.close, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="close" size={16} color={tint(0.64)} />
            </TouchableOpacity>
          </View>
          <CustomText label="Make sure you have selected the correct GIF." fontSize={12} fontFamily={fonts.medium} letterSpacing={-0.12} color={tint(0.64)} />
        </View>
      }
    >
      <View style={[styles.preview, { backgroundColor: tint(0.08) }]}>
        {!!gif?.path && (
          <Image
            source={{ uri: String(gif.path).startsWith("file://") ? gif.path : `file://${gif.path}` }}
            style={styles.gif}
            resizeMode="contain"
          />
        )}
      </View>
      <CustomButton title="Share GIF" height={48} loading={sharing} disabled={sharing || !gif} onPress={onShare} />
    </FloatingSheet>
  );
};

export default GifPreviewSheet;

const styles = StyleSheet.create({
  head: {
    gap: 8,
  },
  titleRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    aspectRatio: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  gif: {
    flex: 1,
    borderRadius: 8,
  },
});
