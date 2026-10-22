import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import {
  PscLockup,
  belowBase,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";

/**
 * "PIN Code" intro after the account is created (Figma Accept-notifications
 * 2214:10785): lockup at 82, centred block (pin 80 → 40 → title 32 → 24 →
 * text), single gold "Create a PIN code" button.
 */
const PinOnBoarding = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const p = useAuthPalette();

  return (
    <ScreenWrapper
      backgroundColor={p.bg}
      footerUnScrollable={() => (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("PinVerification", {
                mode: "define",
                purpose: "register",
              })
            }
            style={[styles.button, { backgroundColor: p.gold }]}
          >
            <CustomText
              label="Create a PIN code"
              fontSize={18}
              fontFamily={fonts.medium}
              color={p.onGold}
            />
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="lock"
              size={18}
              color={p.onGold}
            />
          </TouchableOpacity>
        </View>
      )}
    >
      <PscLockup marginTop={82 - 44} />
      <View style={styles.center}>
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name="pin"
          size={80}
          color={p.t64}
        />
        <CustomText
          label="PIN Code"
          fontSize={32}
          fontFamily={fonts.semiBold}
          letterSpacing={ls(-2, 32)}
          textAlign="center"
          color={p.text}
          marginTop={40 - capTop(32)}
        />
        <CustomText
          label={"Reinforce your next login\nwith a fast and highly secured method."}
          fontSize={14}
          letterSpacing={ls(-2, 14)}
          textAlign="center"
          color={p.t64}
          marginTop={textGap(24, 32, 14)}
          marginBottom={-belowBase(14)}
        />
      </View>
    </ScreenWrapper>
  );
};

export default PinOnBoarding;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 186 - 94 - (130 - 82 - 77),
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  button: {
    height: 48,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
