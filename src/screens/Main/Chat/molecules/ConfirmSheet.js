import { StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Figma Chat page "Remove-Friend" (2212:7989) / "Successfully-Removed-Friend"
 * (2212:7978) on the app FloatingSheet: inner pad 32/16/16/16, gap 24 —
 * icon 80 · 16 · title Medium 20 −2% · 12 · text Regular 14 −2% @64% ·
 * [person card 64: 1px white 4% r12, avatar 40, name Medium 16 −0.5 +
 * subtitle Regular 14 −0.5 @48%] · buttons 48: gold "Yes, …" + white 4%
 * "Cancel" (8 apart) — or a single gold "Close" for the success state.
 */
const ConfirmSheet = ({
  visible,
  icon = "delete",
  title,
  message,
  person, // { name, subtitle, picture } — optional card
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onDismiss,
  loading,
  success, // true → single "Close" button
}) => {
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      header={<View style={{ marginBottom: -24 }} />}
      gap={24}
      innerStyle={styles.inner}
    >
      <View style={styles.body}>
        {/* Figma: confirm icon #EE1045, success check #A19375 */}
        <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={80} color={success ? "#A19375" : "#EE1045"} />
        <View style={styles.texts}>
          <CustomText label={title} fontSize={20} fontFamily={fonts.medium} letterSpacing={-0.4} color={colors.text} textAlign="center" />
          {!!message && (
            <CustomText label={message} fontSize={14} letterSpacing={-0.28} color={tint(0.64)} textAlign="center" />
          )}
        </View>
        {!!person && (
          <View style={[styles.card, { borderColor: tint(0.04) }]}>
            {person.picture ? (
              <FastImage source={{ uri: person.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.center, { backgroundColor: tint(0.08) }]}>
                <CustomText label={(person.name?.[0] || "?").toUpperCase()} fontSize={16} fontFamily={fonts.semiBold} color={colors.text} />
              </View>
            )}
            <View style={styles.cardTexts}>
              <CustomText label={person.name} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} numberOfLines={1} />
              {!!person.subtitle && (
                <CustomText label={person.subtitle} fontSize={14} letterSpacing={-0.5} color={tint(0.48)} numberOfLines={1} />
              )}
            </View>
          </View>
        )}
      </View>
      {success ? (
        <CustomButton title="Close" height={48} onPress={onDismiss} />
      ) : (
        <View style={styles.buttons}>
          <CustomButton title={confirmLabel} height={48} loading={loading} disabled={loading} onPress={onConfirm} />
          <CustomButton
            title={cancelLabel}
            height={48}
            backgroundColor={tint(0.04)}
            color={colors.text}
            onPress={onDismiss}
          />
        </View>
      )}
    </FloatingSheet>
  );
};

export default ConfirmSheet;

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
  texts: {
    gap: 12,
    alignItems: "center",
  },
  card: {
    alignSelf: "stretch",
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardTexts: {
    flex: 1,
  },
  buttons: {
    gap: 8,
  },
});
