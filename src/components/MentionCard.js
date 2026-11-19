import { BlurView } from "@react-native-community/blur";
import { useEffect, useState } from "react";
import { Keyboard, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Reanimated, { FadeInDown, FadeOut } from "react-native-reanimated";

import { useTheme } from "../contexts/ThemeContext";
import MentionList from "../screens/Main/PublishPost/molecules/MentionList";

/**
 * "@" people picker as a floating card — no Figma frame for it, so it uses
 * the floating-modal card (FloatingSheet): glass r32 pad 4, white 16% fill +
 * 1px white 16% stroke + blur, inner #121212 r28 pad 12, header "Mention
 * People {n}" + 32 close circle. Used by chat, poll options and the post's
 * "What's happening" box.
 */
/** keyboard height (0 when hidden) */
const useKeyboardHeight = (enabled) => {
  // the keyboard is usually already open when the card mounts (the "@" was
  // typed with it up), and the listeners below only fire on the NEXT event —
  // so seed with the current metrics or the card hides behind the keyboard
  const [h, setH] = useState(() => (enabled && Keyboard.metrics?.()?.height) || 0);
  useEffect(() => {
    if (!enabled) return undefined;
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setH(e?.endCoordinates?.height || 0),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setH(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled]);
  return h;
};

/**
 * floating: pinned to the bottom of the screen like FloatingSheet (12 side
 * margin, bottom inset + 16), riding above the keyboard while it's open —
 * render it at the screen root (not inside a scroll view).
 */
const MentionCard = ({ query, onSelect, onClose, maxVisibleRows, style, floating = false, extraPeople }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight(floating);
  const rows = maxVisibleRows || (floating && keyboard ? 3 : 5);
  const floatingStyle = floating
    ? {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: keyboard ? keyboard + 12 : Math.max(insets.bottom, 16) + 16,
        zIndex: 1000,
        elevation: 20,
      }
    : null;
  return (
    <Reanimated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOut.duration(120)}
      style={[styles.card, floatingStyle, style]}
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={6}
        reducedTransparencyFallbackColor="#2A2A2A"
      />
      <View style={[styles.inner, { backgroundColor: colors.background }]}>
        <MentionList
          query={query}
          onSelect={onSelect}
          onClose={onClose}
          maxVisibleRows={rows}
          extraPeople={extraPeople}
        />
      </View>
    </Reanimated.View>
  );
};

export default MentionCard;

const styles = StyleSheet.create({
  card: {
    padding: 4,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  inner: {
    borderRadius: 28,
    overflow: "hidden",
    padding: 12,
  },
});
