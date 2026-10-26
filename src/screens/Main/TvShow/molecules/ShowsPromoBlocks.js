import { ImageBackground, StyleSheet, TouchableOpacity, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { GlassFill, SHOWS, baseline, capGap, capTop } from "./showsLayout";

/**
 * Figma Show-Feed static blocks (image background + white 24%):
 *  · "How Does It Work" (3738:3159): pad 24/12/16/12, gap 32; title Medium 32
 *    −3% #121212; 3 cards (gap 4) r15 #121212 16% + 1 stroke #121212 16% on
 *    blur 16, pad 3 → inner r12 #121212 pad 12/8/8/8 gap 8: title Medium 12
 *    lh125%, body Regular 9 lh125% white 80%, 24 gold circle with the step.
 *  · "What Would Like To See More?" (3738:3340): pad 24/12/24/12, gap 32;
 *    title Medium 32 lh120% −3% white; 48 white r12 rows (gap 4, pad 12):
 *    Medium 16 −0.5% #121212 + 24 radio (gold / #121212 32%) or chevron @64%.
 */
const DARK = SHOWS.section;
const OVERLAY = "rgba(255, 255, 255, 0.24)";
const CARD_FILL = "rgba(18, 18, 18, 0.16)";

const STEPS = [
  { title: "Pick A Show", body: "Browse shows by topic and save the ones you want to watch." },
  { title: "Unlock Episodes", body: "Buy an episode or subscribe to the creator to watch it." },
  { title: "Watch Anywhere", body: "Pick up where you left off on any of your devices." },
];

export const HowItWorks = () => (
  <ImageBackground source={Images.showsFeedBg} resizeMode="cover" style={styles.section}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: OVERLAY }]} />
    <CustomText
      label="How Does It Work"
      fontSize={32}
      fontFamily={fonts.medium}
      letterSpacing={-0.96}
      color={DARK}
      marginTop={capTop(32)}
      marginBottom={baseline(32)}
    />
    <View style={styles.steps}>
      {STEPS.map((step, i) => (
        <View key={step.title} style={styles.stepCard}>
          <GlassFill fill={CARD_FILL} borderRadius={15} />
          <View style={styles.stepInner}>
            <View>
              <CustomText
                label={step.title}
                fontSize={12}
                fontFamily={fonts.medium}
                color={SHOWS.white}
                marginTop={capTop(12)}
              />
              <CustomText
                label={step.body}
                fontSize={9}
                color="rgba(255, 255, 255, 0.8)"
                marginTop={capGap(8, 12, 9)}
              />
            </View>
            <View style={styles.stepNumber}>
              <CustomText
                label={String(i + 1)}
                fontSize={12}
                fontFamily={fonts.medium}
                letterSpacing={-0.06}
                color={DARK}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  </ImageBackground>
);

export const SEE_MORE_OPTIONS = [
  { id: "original", label: "More Original Shows" },
  { id: "popular", label: "More Popular Shows" },
];

export const SeeMore = ({ value, onChange, onSomethingElse }) => (
  <ImageBackground
    source={Images.showsFeedBg}
    resizeMode="cover"
    style={[styles.section, { paddingBottom: 24 }]}
  >
    <View style={[StyleSheet.absoluteFill, { backgroundColor: OVERLAY }]} />
    <CustomText
      label="What Would Like To See More?"
      fontSize={32}
      fontFamily={fonts.medium}
      letterSpacing={-0.96}
      color={SHOWS.white}
      marginTop={capTop(32)}
      marginBottom={baseline(32)}
    />
    <View style={styles.options}>
      {SEE_MORE_OPTIONS.map((opt) => {
        const checked = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.8}
            onPress={() => onChange?.(opt.id)}
            style={styles.option}
          >
            <CustomText
              label={opt.label}
              fontSize={16}
              fontFamily={fonts.medium}
              letterSpacing={-0.08}
              color={DARK}
              numberOfLines={1}
              containerStyle={styles.shrink}
            />
            <Icons
              family="MaterialSymbolsRounded"
              name={checked ? "radio_button_checked" : "radio_button_unchecked"}
              size={24}
              color={checked ? SHOWS.gold : "rgba(18, 18, 18, 0.32)"}
            />
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity activeOpacity={0.8} onPress={onSomethingElse} style={styles.option}>
        <CustomText
          label="Something Else"
          fontSize={16}
          fontFamily={fonts.medium}
          letterSpacing={-0.08}
          color={DARK}
          numberOfLines={1}
          containerStyle={styles.shrink}
        />
        <Icons
          family="MaterialSymbolsRounded"
          name="chevron_right"
          size={24}
          color="rgba(18, 18, 18, 0.64)"
        />
      </TouchableOpacity>
    </View>
  </ImageBackground>
);

const styles = StyleSheet.create({
  section: {
    paddingTop: 24,
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 32,
    overflow: "hidden",
  },
  shrink: {
    flexShrink: 1,
  },
  steps: {
    flexDirection: "row",
    gap: 4,
  },
  stepCard: {
    flex: 1,
    height: 133,
    padding: 3,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: CARD_FILL,
    overflow: "hidden",
  },
  stepInner: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: DARK,
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: "space-between",
    gap: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 100,
    backgroundColor: SHOWS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  options: {
    gap: 4,
  },
  option: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: SHOWS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
});
