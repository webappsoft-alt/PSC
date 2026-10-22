import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomText from "../CustomText";
import {
  OnboardingActions,
  SquiggleBackground,
  belowBase,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "./AuthKit";
import fonts from "../../assets/fonts";

/**
 * Shared frame of Allow-personalized-ads / Accept-notifications / Profile
 * Privacy / Welcome / No Connection: #121212 with the gold squiggles, content
 * centred between y = 130 and y = 626 (padding 130/24/186/24), actions pinned
 * to the bottom (154 high, top at 658).
 */
const PromptLayout = ({ variant = "ads", children, actions }) => {
  const p = useAuthPalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <StatusBar
        barStyle={p.isDark ? "light-content" : "dark-content"}
        backgroundColor={p.bg}
      />
      <SquiggleBackground variant={variant} />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (130 - 44),
            paddingBottom: actions ? 658 - 626 : 186 - 34,
          },
        ]}
      >
        {children}
      </View>
      {actions ? <OnboardingActions>{actions}</OnboardingActions> : null}
      {!actions ? <View style={{ height: insets.bottom }} /> : null}
    </View>
  );
};

/** Icon 80 → 40 → title (SemiBold 32, -2%) → 24 → body (14, -2%, 64%). */
export const PromptTexts = ({ icon, title, body, note }) => {
  const p = useAuthPalette();
  const last = note ? 12 : 14;
  return (
    <View style={styles.center}>
      {icon}
      <CustomText
        label={title}
        fontSize={32}
        fontFamily={fonts.semiBold}
        letterSpacing={ls(-2, 32)}
        textAlign="center"
        color={p.text}
        marginTop={(icon ? 40 : 0) - capTop(32)}
      />
      {body ? (
        <CustomText
          label={body}
          fontSize={14}
          letterSpacing={ls(-2, 14)}
          textAlign="center"
          color={p.t64}
          marginTop={textGap(24, 32, 14)}
          marginBottom={note ? 0 : -belowBase(14)}
        />
      ) : null}
      {note ? (
        <CustomText
          label={note}
          fontSize={12}
          letterSpacing={ls(-2, 12)}
          textAlign="center"
          color={p.t64}
          marginTop={textGap(24, 14, 12)}
          marginBottom={-belowBase(last)}
        />
      ) : null}
    </View>
  );
};

export default PromptLayout;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  center: {
    alignItems: "center",
  },
});
