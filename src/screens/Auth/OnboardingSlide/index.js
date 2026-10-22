import { useState } from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import ProgressiveBlur from "../../../components/ProgressiveBlur";
import CustomText from "../../../components/CustomText";
import {
  BySignature,
  ClubLockup,
  RingButton,
  belowBase,
  capTop,
  textGap,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import { COLORS } from "../../../utils/COLORS";

/**
 * Registration slides (Figma Move-People / Sightseeing), shown between the
 * profile steps: slide → Industry → slide → Working at → slide → Job title.
 */
export const SLIDES = [
  {
    image: Images.onBoardPeople,
    title:
      "Wherever you are connect with the most influential individuals and companies in the world.",
    subtitle: "There is a suited Chauffeur awaiting for your to show the way.",
    pill: "outline",
    nextField: "industry",
  },
  {
    image: Images.onBoard6,
    title: "Discover unique places only known by locals",
    subtitle: "People",
    pill: "filled",
    nextField: "company",
  },
  {
    image: Images.onBoard6,
    title: "Discover unique places only known by locals",
    subtitle: "People",
    pill: "filled",
    nextField: "jobTitle",
  },
];

const SEGMENTS = 4;

const OnboardingSlide = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const index = Math.max(
    0,
    Math.min(SLIDES.length - 1, Number(route?.params?.index) || 0),
  );
  const slide = SLIDES[index];
  const [bottomHeight, setBottomHeight] = useState(0);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {/* Figma: image FILL (cover) with an explicit screen-sized box. */}
      <Image
        source={slide.image}
        resizeMode="cover"
        style={[styles.image, { width, height }]}
      />
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />

      {/* Header: gradient #121212 → transparent, progress + lockup */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* Gradient as a background layer only: padding/children on the
            native gradient view are laid out wrongly on the new arch. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(18, 18, 18, 0.01)", "rgba(18, 18, 18, 0)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.progress}>
          {Array.from({ length: SEGMENTS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor:
                    i <= index ? COLORS.white : "rgba(255, 255, 255, 0.16)",
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.lockup}>
          <ClubLockup pillVariant={slide.pill} />
          <BySignature />
        </View>
      </View>

      {/* Bottom: Figma progressive background blur (0 → 16, top → bottom),
          FFFFFF 1% fill — sized to the measured container, behind it. */}
      {bottomHeight ? (
        <ProgressiveBlur
          pointerEvents="none"
          direction="bottom"
          tint="dark"
          intensity={16}
          height={bottomHeight}
          borderRadius={0}
          style={styles.bottomBlur}
        />
      ) : null}
      <View
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h !== bottomHeight) setBottomHeight(h);
        }}
        style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <View style={styles.texts}>
          <CustomText
            label={slide.title}
            fontSize={24}
            fontFamily={fonts.semiBold}
            color={COLORS.white}
            marginTop={-capTop(24)}
          />
          <CustomText
            label={slide.subtitle}
            fontSize={16}
            fontFamily={fonts.medium}
            color="rgba(255, 255, 255, 0.64)"
            marginTop={textGap(16, 24, 16)}
            marginBottom={-belowBase(16)}
          />
        </View>
        <View style={styles.button}>
          <RingButton
            title="Continue"
            variant="white"
            onPress={() =>
              navigation.push("ProfileDetails", {
                field: slide.nextField,
                slideIndex: index,
              })
            }
          />
        </View>
      </View>
    </View>
  );
};

export default OnboardingSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.primaryColor,
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  overlay: {
    backgroundColor: "rgba(18, 18, 18, 0.64)",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  progress: {
    flexDirection: "row",
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 100,
  },
  lockup: {
    marginTop: 24,
    alignItems: "center",
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 32,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
  },
  bottomBlur: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  texts: {
    paddingHorizontal: 12,
  },
  button: {
    marginTop: 40,
  },
});
