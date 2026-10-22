import { BlurView } from "@react-native-community/blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import Icons from "./Icons";

/**
 * Floating bottom sheet — port of Viral's ProfileFloatingBottomSheet:
 * blurred dimmed backdrop (fade), card slides up.
 * Figma "Filters-Sorting" inspect: outer 351 hug, r32, pad 4, fill white 16%,
 * 1px inside stroke white 16%, background blur; inner fill #121212, r28,
 * pad 12, vertical gap 20. Title SemiBold 24 −0.5, subtitle Regular 14 @64%,
 * 32px close circle.
 */
const SCREEN_HEIGHT = Dimensions.get("window").height;

const FloatingSheet = ({
  visible,
  onDismiss,
  title,
  subtitle,
  children,
  // Figma: "Repost-options" / "What Do You Want To Do?" use a 16pt title
  // (SemiBold 16 / 120% / −2%) instead of the 24pt filter-sheet title.
  titleSize = "lg",
  // Custom header node (e.g. user row); replaces the title/close row.
  header,
  // Inner column gap (Figma: filters 20, repost 32, post-more-options 16)
  gap = 20,
  // Inner padding override (Figma repost: L12 T16 R12 B24)
  innerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);
  const slide = useRef(new Animated.Value(visible ? 0 : SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slide.setValue(SCREEN_HEIGHT);
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
      return;
    }
    Animated.timing(slide, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setModalVisible(false);
    });
  }, [visible, slide]);

  return (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.6)"
        />
        <View style={styles.dim} pointerEvents="none" />
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.wrapper,
                  {
                    marginBottom: Math.max(insets.bottom, 16) + 16,
                    transform: [{ translateY: slide }],
                  },
                ]}
              >
                <View style={styles.glass}>
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType="dark"
                    blurAmount={6}
                    reducedTransparencyFallbackColor="#2A2A2A"
                  />
                  <View
                    style={[
                      styles.inner,
                      { backgroundColor: colors.background, gap },
                      innerStyle,
                    ]}
                  >
                    {/* Figma text boxes are tight (subtitle box 10pt), so the
                        20pt gap reads as subtitle-centre → next-centre 30pt.
                        RN line boxes are taller; pull the next block up. */}
                    {header ? (
                      header
                    ) : (
                    <View style={{ marginBottom: subtitle ? -10 : 0 }}>
                      <View
                        style={[
                          styles.header,
                          // Figma repost/share header: pad L16 (inner is 12)
                          titleSize === "sm" && { paddingLeft: 4 },
                        ]}
                      >
                        <CustomText
                          label={title}
                          // Figma: SemiBold 24 / 120% / −2% (lg)
                          // Figma: SemiBold 16 / 120% / −2% (sm)
                          fontSize={titleSize === "sm" ? 16 : 24}
                          letterSpacing={titleSize === "sm" ? -0.32 : -0.48}
                          fontFamily={fonts.semiBold}
                          color={colors.text}
                        />
                        <SheetCloseButton onPress={onDismiss} />
                      </View>
                      {subtitle ? (
                        <CustomText
                          label={subtitle}
                          // Figma: Medium 14 / −0.5px @64%
                          fontSize={14}
                          letterSpacing={-0.5}
                          fontFamily={fonts.medium}
                          color={COLORS.gray64}
                        />
                      ) : null}
                    </View>
                    )}
                    {children}
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

/** Figma sheet footer: Reset All (white 4%) + Confirm (white), h48 r100. */
export const SheetActions = ({ onReset, onConfirm, confirmLabel = "Confirm" }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onReset}
        style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]}
      >
        <CustomText
          label="Reset All"
          fontSize={16}
          fontFamily={fonts.medium}
          color={colors.text}
        />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onConfirm}
        style={[styles.actionBtn, { backgroundColor: COLORS.white }]}
      >
        <CustomText
          label={confirmLabel}
          fontSize={16}
          fontFamily={fonts.medium}
          color="#121212"
        />
      </TouchableOpacity>
    </View>
  );
};

/** Figma section label, e.g. "SORTING BY", "SPONSORS". */
export const SheetSectionLabel = ({ label }) => (
  <CustomText
    label={label}
    fontSize={14}
    // full 20pt line box (Poppins ascenders clip in a 14pt box); the
    // spacing around it is trimmed instead
    letterSpacing={-0.5}
    fontFamily={fonts.medium}
    color={COLORS.gray64}
    marginBottom={7}
  />
);

/** Figma: 32px translucent circle with a 18px icon (close / more / person_add). */
export const SheetIconButton = ({ name, onPress, family = "MaterialSymbolsRounded", size = 18 }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.close, { backgroundColor: colors.surfaceAlt }]}
    >
      <Icons family={family} name={name} size={size} color={colors.text} />
    </TouchableOpacity>
  );
};

export const SheetCloseButton = ({ onPress }) => (
  <SheetIconButton name="close" onPress={onPress} />
);

/**
 * Figma "Post-more-options" / "Post-creator-summary" header: 32 avatar · gap 8 ·
 * Display Name (Medium 14 / −0.5%) + badge / username (Regular 12 @48%) · right buttons.
 */
export const SheetUserHeader = ({
  avatar,
  profileColor,
  displayName,
  username,
  role,
  onPressUser,
  right,
}) => {
  const { colors } = useTheme();
  const Wrapper = onPressUser ? TouchableOpacity : View;
  return (
    <View style={[styles.header, styles.userHeader]}>
      <Wrapper
        activeOpacity={0.7}
        onPress={onPressUser}
        style={styles.userRow}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: profileColor || colors.surfaceAlt },
            ]}
          />
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <CustomText
              label={displayName}
              fontSize={14}
              letterSpacing={-0.07}
              fontFamily={fonts.medium}
              color={colors.text}
              numberOfLines={1}
            />
            {role === "individual" ? (
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="verified"
                size={16}
                color="#007BFF"
              />
            ) : null}
            {role === "company" ? (
              <Icons
                family="MaterialSymbolsRounded"
                name="star"
                size={16}
                color={COLORS.gray48}
              />
            ) : null}
          </View>
          <CustomText
            label={username}
            fontSize={12}
            color={COLORS.gray48}
            numberOfLines={1}
          />
        </View>
      </Wrapper>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
};

/**
 * Figma option row: 48 tall, r12, pad L8 R4, gap 8 — 40 circle (white 4%) with
 * a 24 icon · title Medium 14 / −0.5% · subtitle Regular 14 / −0.5% @64% ·
 * right: chevron_right / radio circle (24, stroke 48%).
 */
export const SheetOptionRow = ({
  icon,
  iconFamily = "MaterialSymbolsRounded",
  title,
  subtitle,
  onPress,
  danger = false,
  trailing = "chevron", // "chevron" | "radio" | "none"
  selected = false,
  disabled = false,
  // Figma "More-options" uses 64% icons; "Post-more-options" uses white
  iconColor,
}) => {
  const { colors } = useTheme();
  const tint = danger ? COLORS.red1 : iconColor || colors.text;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[styles.optionRow, disabled && { opacity: 0.5 }]}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor: danger
              ? "rgba(238, 16, 69, 0.16)"
              : colors.surfaceAlt,
          },
        ]}
      >
        <Icons family={iconFamily} name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <CustomText
          label={title}
          fontSize={14}
          letterSpacing={-0.07}
          fontFamily={fonts.medium}
          color={colors.text}
          numberOfLines={1}
        />
        {subtitle ? (
          <CustomText
            label={subtitle}
            fontSize={14}
            letterSpacing={-0.07}
            color={COLORS.gray64}
            numberOfLines={1}
            // Figma: title/subtitle centres sit 16 apart (tight boxes)
            marginTop={-2}
          />
        ) : null}
      </View>
      {trailing === "chevron" ? (
        <Icons
          family="MaterialSymbolsRounded"
          name="chevron_right"
          size={24}
          color={COLORS.gray64}
        />
      ) : null}
      {trailing === "radio" ? (
        <View style={styles.radioBox}>
          <View
            style={[
              styles.radio,
              { borderColor: selected ? COLORS.white : COLORS.gray48 },
            ]}
          >
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

/** Figma: full-width white Confirm button, h48 r100, Medium 16. */
export const SheetPrimaryButton = ({ label = "Confirm", onPress, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.actionBtn,
      { backgroundColor: COLORS.white, opacity: disabled ? 0.5 : 1 },
    ]}
  >
    <CustomText
      label={label}
      fontSize={16}
      fontFamily={fonts.medium}
      color="#121212"
    />
  </TouchableOpacity>
);

export default FloatingSheet;

const styles = StyleSheet.create({
  root: { flex: 1 },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  wrapper: { marginHorizontal: 12, borderRadius: 32, overflow: "hidden" },
  glass: {
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
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Figma: user header row is 32 tall (avatar); text column overflows it
  userHeader: { height: 32 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  userRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: { width: 32, height: 32, borderRadius: 100 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  optionRow: {
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingRight: 4,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  // Figma: 24 box with a 20 ring (2px stroke @48%)
  radioBox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
