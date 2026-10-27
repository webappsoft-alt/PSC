import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

/**
 * Inbox bottom bar — Figma `Main-Chat` "Frame 10" (375×98):
 * padding 8/16/34(home indicator)/16, space-between, gradient #121212 0→100%.
 * Side buttons: 56 circle, pad 4, #1E1E1E 64% + blur 16, 1px white 8% inside.
 * Centre pill: 208×56, same glass; three 72×48 segments, active #080808.
 * Icons 24 filled — active white, inactive white 64%.
 * Order (client): 1 on 1 (person) · Groups (groups) · Circles (campaign).
 *
 * WhatsApp-style (client): inside InboxPager the bar is rendered once, outside
 * the swiping pages — Home and Settings stay put, only the active pill glides
 * between the centre icons with the swipe (`progress` = page position).
 */
const SEGMENT_PITCH = 64; // 72 wide, overlapping by 8
export const INBOX_BAR_CONTENT_HEIGHT = 8 + 56; // + bottom inset

const Glass = ({ style, children }) => (
  <View style={[styles.glass, style]}>
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="dark"
      blurAmount={16}
      reducedTransparencyFallbackColor="#1E1E1E"
    />
    <View style={[StyleSheet.absoluteFill, styles.glassTint]} />
    {children}
  </View>
);

const KEYS = ["chat", "groups", "circles"];
const ICONS = { chat: "person", groups: "groups", circles: "campaign" };

const InboxBottomBar = ({ active = "chat", progress, onSelect }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottom = Math.max(insets.bottom, 16);

  const icon = (name, on) => (
    <Icons
      family="MaterialSymbolsRoundedFilled"
      name={name}
      size={24}
      color={on ? "#FFFFFF" : "rgba(255, 255, 255, 0.64)"}
    />
  );

  const segment = (key, name, onPress) => {
    const on = active === key;
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        disabled={on || !onPress}
        onPress={onPress}
        style={[styles.segment, on && styles.segmentActive]}
      >
        {icon(name, on)}
      </TouchableOpacity>
    );
  };

  // Swipe-driven pill: indicator + icon colours follow `progress`
  const liveSegment = (key, index, onPress) => {
    const near = progress.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity
        key={key}
        activeOpacity={0.7}
        disabled={!onPress}
        onPress={onPress}
        style={styles.segment}
      >
        {icon(ICONS[key], false)}
        <Animated.View style={[StyleSheet.absoluteFill, styles.center, { opacity: near }]}>
          {icon(ICONS[key], true)}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottom }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.background}00`, colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <Glass>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.circleInner}
          onPress={() => navigation.navigate("TabStack", { screen: "Home" })}
        >
          {icon("home", false)}
        </TouchableOpacity>
      </Glass>

      {progress ? (
        <Glass style={styles.pill}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, SEGMENT_PITCH, SEGMENT_PITCH * 2],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          />
          {KEYS.map((key, i) =>
            liveSegment(
              key,
              i,
              () => onSelect?.(key),
            ),
          )}
        </Glass>
      ) : (
        <Glass style={styles.pill}>
          {segment("chat", ICONS.chat, () => navigation.popTo("Chat"))}
          {segment("groups", ICONS.groups, () => navigation.popTo("Chat"))}
          {segment("circles", ICONS.circles, () => navigation.popTo("Chat"))}
        </Glass>
      )}

      <Glass>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.circleInner}
          onPress={() => navigation.navigate("Settings")}
        >
          {icon("settings", false)}
        </TouchableOpacity>
      </Glass>
    </View>
  );
};

export default InboxBottomBar;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  glass: {
    height: 56,
    minWidth: 56,
    borderRadius: 100,
    // Figma pad 4 with an INSIDE stroke; RN borders take layout space → 3 + 1
    padding: 3,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  glassTint: {
    backgroundColor: "rgba(30, 30, 30, 0.64)",
  },
  circleInner: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma: 208 wide, segments 72 overlap by 8 (auto-layout gap −8)
  pill: {
    width: 208,
  },
  segment: {
    width: 72,
    height: 48,
    marginRight: -8,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    backgroundColor: "#080808",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  // sliding active pill (pill padding 3 + 1px border → first segment at 3)
  indicator: {
    position: "absolute",
    left: 3,
    top: 3,
    width: 72,
    height: 48,
    borderRadius: 100,
    backgroundColor: "#080808",
  },
});
