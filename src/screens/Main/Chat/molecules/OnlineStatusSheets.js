import { Fragment } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Figma Chat page "Filters-Sorting-Online-Status" (7913:2977 / 7887:2820),
 * on the app's FloatingSheet (351 · r32 · white 16% glass · inner #121212 r28,
 * pad 12/12/16/12, gap 20, title SemiBold 24, 32 close).
 * Rows 24 tall, gap 12, 1px white 16% dividers; [dot 20 · gap 8] label Medium
 * 16 −0.5 (selected white, others 48%) · radio 24 (ring 20 @48%).
 */
export const PRESENCE = {
  online: { label: "Online", color: "#37B874" },
  idle: { label: "Idle", color: "#FF4D00" },
  dnd: { label: "Do Not Disturb", color: "#EE1045" },
  invisible: { label: "Invisible", color: "#262626" },
};

const Rows = ({ options, value, onSelect }) => {
  const { colors, isDark } = useTheme();
  const dim = isDark ? "rgba(255, 255, 255, 0.48)" : "rgba(18, 18, 18, 0.48)";
  const line = isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(18, 18, 18, 0.16)";
  return (
    <View style={styles.rows}>
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <Fragment key={o.value}>
            {i > 0 && <View style={[styles.line, { backgroundColor: line }]} />}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.row}
              onPress={() => onSelect(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              {!!o.color && (
                <View style={[styles.dot, { backgroundColor: o.color }]} />
              )}
              <CustomText
                label={o.label}
                fontSize={16}
                fontFamily={fonts.medium}
                letterSpacing={-0.5}
                color={selected ? colors.text : dim}
                containerStyle={styles.label}
              />
              <Icons
                family="MaterialSymbolsRounded"
                name={
                  selected ? "radio_button_checked" : "radio_button_unchecked"
                }
                size={24}
                color={selected ? "#A19375" : dim} // Figma: checked radio gold
              />
            </TouchableOpacity>
          </Fragment>
        );
      })}
    </View>
  );
};

/** Avatar tap: my own status (online · idle · do not disturb · invisible). */
export const OnlineStatusSheet = ({
  visible,
  onDismiss,
  value = "online",
  onSelect,
}) => (
  <FloatingSheet
    visible={visible}
    onDismiss={onDismiss}
    title="Online Status"
    closeIconSize={16}
    closeIconColor="muted"
  >
    <Rows
      value={value}
      onSelect={(v) => {
        onSelect?.(v);
        onDismiss?.();
      }}
      options={Object.entries(PRESENCE).map(([key, p]) => ({
        value: key,
        label: p.label,
        color: p.color,
      }))}
    />
  </FloatingSheet>
);

/** Filter chip: which chats to list. */
export const ChatOnlineStatusSheet = ({
  visible,
  onDismiss,
  onlineOnly,
  onChange,
}) => (
  <FloatingSheet
    visible={visible}
    onDismiss={onDismiss}
    title="Chat Online Status"
    closeIconSize={16}
    closeIconColor="muted"
  >
    <Rows
      value={onlineOnly ? "online" : "both"}
      onSelect={(v) => {
        onChange?.(v === "online");
        onDismiss?.();
      }}
      options={[
        { value: "online", label: "Show online only" },
        { value: "both", label: "Both Online & Offline" },
      ]}
    />
  </FloatingSheet>
);

const styles = StyleSheet.create({
  rows: {
    gap: 12,
  },
  row: {
    // height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 100,
  },
  label: {
    flex: 1,
  },
  line: {
    height: 1,
  },
});
