import { StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Figma Chat page "Modal-Respect-TOS" (7924:10058) on the app FloatingSheet:
 * inner pad 32/16/16/16, gap 24, centred — circle image 80 r24 · 16 ·
 * "TOS Guidelines" Medium 20 −2% · 12 · "Be outspoken but respectful
 * towards others." Regular 14 −2% @64% · "Join {name}" gold pill 48.
 */
const CircleJoinSheet = ({ visible, circle, onDismiss, onJoin, joining }) => {
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      // no title row (Figma); cancel the sheet gap it would add
      header={<View style={{ marginBottom: -24 }} />}
      gap={24}
      innerStyle={styles.inner}
    >
      <View style={styles.body}>
        {circle?.picture ? (
          <FastImage source={{ uri: circle.picture }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.center, { backgroundColor: tint(0.08) }]}>
            <CustomText label={(circle?.name?.[0] || "?").toUpperCase()} fontSize={32} fontFamily={fonts.semiBold} color={colors.text} />
          </View>
        )}
        <View style={styles.texts}>
          <CustomText label="TOS Guidelines" fontSize={20} fontFamily={fonts.medium} letterSpacing={-0.4} color={colors.text} textAlign="center" />
          <CustomText
            label="Be outspoken but respectful towards others."
            fontSize={14}
            letterSpacing={-0.28}
            color={tint(0.64)}
            textAlign="center"
          />
        </View>
      </View>
      <CustomButton
        title={`Join ${circle?.name || "Circle"}`}
        height={48}
        loading={joining}
        disabled={joining}
        onPress={onJoin}
      />
    </FloatingSheet>
  );
};

export default CircleJoinSheet;

const styles = StyleSheet.create({
  inner: {
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  body: {
    alignItems: "center",
    gap: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 24,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    gap: 12,
    alignItems: "center",
  },
});
