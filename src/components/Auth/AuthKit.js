/**
 * Auth kit — the building blocks of the "NEW on-boarding" Figma page
 * (login, registration, PIN, post-registration screens), built from the
 * inspected node values (auto-layout gaps, paddings, fonts, colours).
 *
 * Figma trims every text box to cap-height → baseline, while React Native lays
 * Poppins out in a 1.4em box (ascent 1.05em, descent 0.35em, cap 0.698em). So a
 * Figma gap next to a text is converted with capTop()/belowBase() below instead
 * of being copied 1:1 — that is what keeps the spacing identical on device.
 */
import { forwardRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";

import CustomText from "../CustomText";
import HeaderIconButton from "../HeaderIconButton";
import Icons from "../Icons";

import fonts from "../../assets/fonts";
import { Images } from "../../assets/images";
import { COLORS } from "../../utils/COLORS";
import { useTheme } from "../../contexts/ThemeContext";
import { SQUIGGLES } from "./squiggles";

/* ------------------------------------------------------------------------- */
/* Metrics                                                                    */
/* ------------------------------------------------------------------------- */

/** RN text-box top → cap top. */
export const capTop = (fs) => Math.round(fs * 0.352 * 10) / 10;
/** Baseline → RN text-box bottom. */
export const belowBase = (fs) => Math.round(fs * 0.35 * 10) / 10;
/** Figma gap between two trimmed texts → RN margin. */
export const textGap = (gap, fsAbove, fsBelow) =>
  Math.round((gap - belowBase(fsAbove) - capTop(fsBelow)) * 10) / 10;
/** Figma letter-spacing in % → RN px. */
export const ls = (pct, fs) => Math.round(((pct * fs) / 100) * 100) / 100;

/** Colours of the design (dark), with light-theme equivalents. */
export const useAuthPalette = () => {
  const { colors, isDark } = useTheme();
  const rgb = isDark ? "255, 255, 255" : "18, 18, 18";
  const a = (o) => `rgba(${rgb}, ${o})`;
  return {
    isDark,
    bg: isDark ? COLORS.primaryColor : colors.background,
    deep: isDark ? "#080808" : colors.background,
    text: isDark ? COLORS.white : COLORS.primaryColor,
    t80: a(0.8),
    t64: a(0.64),
    t48: a(0.48),
    t32: a(0.32),
    t16: a(0.16),
    t08: a(0.08),
    t04: a(0.04),
    gold: COLORS.buttonColor,
    gold04: "rgba(161, 147, 117, 0.04)",
    gold16: "rgba(161, 147, 117, 0.16)",
    gold64: "rgba(161, 147, 117, 0.64)",
    onGold: COLORS.primaryColor,
    error: "#EE1045",
    errorBg: "rgba(238, 16, 69, 0.04)",
    success: COLORS.green1,
    blue: "#007BFF",
  };
};

const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";

/* ------------------------------------------------------------------------- */
/* Registration header ("Frame 48097350")                                    */
/* ------------------------------------------------------------------------- */

/**
 * Title + step counter + subtitle, info button, progress bar.
 * Figma: padding 48/12/12/12 (status bar 44 → 4 below it), row 44, bar 4 @ +12.
 */
export const AuthStepHeader = ({
  title = "Registration",
  subtitle,
  step,
  total,
  onInfoPress,
}) => {
  const p = useAuthPalette();
  const progress =
    step && total ? Math.max(0, Math.min(1, step / total)) * 100 : 0;
  return (
    <View style={[styles.header, { backgroundColor: p.bg }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTexts}>
          <View style={styles.headerTitleRow}>
            <CustomText
              label={title}
              fontSize={20}
              fontFamily={fonts.semiBold}
              color={p.text}
            />
            {step && total ? (
              <CustomText
                label={`${step}/${total}`}
                fontSize={16}
                fontFamily={fonts.semiBold}
                color={p.text}
                marginTop={capTop(20) - capTop(16)}
              />
            ) : null}
          </View>
          {subtitle ? (
            <CustomText
              label={subtitle}
              fontSize={14}
              color={p.t64}
              numberOfLines={1}
              marginTop={textGap(10, 20, 14)}
              marginBottom={-belowBase(14)}
            />
          ) : null}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!onInfoPress}
          onPress={onInfoPress}
          style={[styles.circle44, { backgroundColor: p.t08 }]}
        >
          <Icons family={MS} name="info" size={24} color={p.text} />
        </TouchableOpacity>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: p.t08 }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: p.text },
          ]}
        />
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------------- */
/* Footer ("Footer": back + Continue + TOS disclaimer)                        */
/* ------------------------------------------------------------------------- */

export const AuthDisclaimer = ({ marginTop = 12 - 2.4 }) => {
  const p = useAuthPalette();
  const strong = { fontFamily: fonts.medium, color: p.text };
  return (
    <View style={[styles.disclaimer, { marginTop }]}>
      <Icons family={MS} name="info" size={12} color={p.t48} />
      <CustomText fontSize={12} color={p.t48} letterSpacing={ls(-3, 12)}>
        By pressing “<Text style={strong}>Continue</Text>” you agree with{" "}
        <Text style={strong}>PSC </Text>
        <Text style={[strong, styles.underline]}>TOS</Text>.
      </CustomText>
    </View>
  );
};

/**
 * Figma: padding 12/12/34/12, row gap 8 — back 48 (FFFFFF 4%, chevron 27.4 64%),
 * Continue 295×48 A19375 (disabled FFFFFF 4% / 64% label), disclaimer 12 below.
 */
export const AuthStepFooter = ({
  onPress,
  onBackPress,
  loading,
  disabled,
  title = "Continue",
  showBack = true,
  showDisclaimer = true,
}) => {
  const p = useAuthPalette();
  const insets = useSafeAreaInsets();
  const off = disabled && !loading;
  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom - 3, 9) },
      ]}
    >
      <View style={styles.footerRow}>
        {showBack ? (
          // Viral's HeaderIconButton: glyph 64% idle → 100% while pressed.
          <HeaderIconButton
            onPress={onBackPress}
            accessibilityLabel="Back"
            style={[styles.circle48, { backgroundColor: p.t04 }]}
          >
            <Icons family={MS} name="chevron_left" size={27.4} color={p.text} />
          </HeaderIconButton>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={off || loading}
          onPress={onPress}
          style={[
            styles.continueBtn,
            { backgroundColor: off ? p.t04 : p.gold },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={p.onGold} />
          ) : (
            <CustomText
              label={title}
              fontSize={17.14}
              fontFamily={fonts.medium}
              color={off ? p.t64 : p.onGold}
            />
          )}
        </TouchableOpacity>
      </View>
      {showDisclaimer ? <AuthDisclaimer /> : null}
    </View>
  );
};

/* ------------------------------------------------------------------------- */
/* Texts                                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Step question ("What’s your firstname?"): SemiBold 24, -1%, 16 below the
 * header and 12 above the field.
 */
export const AuthStepTitle = ({
  label,
  fontSize = 24,
  letterSpacing = -1,
  marginTop = 16,
  marginBottom = 12,
  nextFontSize,
  color,
}) => {
  const p = useAuthPalette();
  return (
    <CustomText
      label={label}
      fontSize={fontSize}
      fontFamily={fonts.semiBold}
      letterSpacing={ls(letterSpacing, fontSize)}
      color={color || p.text}
      marginTop={marginTop - capTop(fontSize)}
      marginBottom={
        nextFontSize
          ? textGap(marginBottom, fontSize, nextFontSize)
          : marginBottom - belowBase(fontSize)
      }
    />
  );
};

/**
 * Helper line under a field: Material "info" 12 + Regular 12 (-3%).
 * Rows are 12 high in Figma and 16.8 in RN, so a Figma gap G between two rows
 * is G - 4.8, and between a 48 field and a row it is G - 2.4.
 */
export const HINT_ROW_EXTRA = 2.4;
export const AuthHint = ({
  text,
  children,
  icon = "info",
  iconFamily = MS,
  color,
  iconColor,
  right,
  marginTop = 8 - HINT_ROW_EXTRA,
  numberOfLines,
}) => {
  const p = useAuthPalette();
  const c = color || p.t64;
  return (
    <View style={[styles.hintRow, { marginTop }]}>
      <Icons family={iconFamily} name={icon} size={12} color={iconColor || c} />
      <CustomText
        label={text}
        fontSize={12}
        color={c}
        letterSpacing={ls(-3, 12)}
        numberOfLines={numberOfLines}
        containerStyle={styles.hintText}
      >
        {children}
      </CustomText>
      {right ? (
        <CustomText
          label={right}
          fontSize={12}
          color={c}
          letterSpacing={ls(-3, 12)}
        />
      ) : null}
    </View>
  );
};

/* ------------------------------------------------------------------------- */
/* Fields                                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Text field. Plain: 48 high, radius 12, FFFFFF 4%, padding 0/12,
 * Regular 16 -3% (placeholder 48%). With `label`: 56 high, label Medium 12 64%
 * on top and the value in Medium 16 (the Login screen).
 * `onPress` turns it into a picker trigger (date / gender).
 */
export const AuthTextField = forwardRef(
  (
    {
      value,
      onChangeText,
      placeholder,
      label,
      secure,
      error,
      right,
      onPress,
      keyboardType,
      autoCapitalize = "none",
      autoCorrect = false,
      maxLength,
      editable = true,
      autoFocus,
      returnKeyType,
      onSubmitEditing,
      textContentType,
      autoComplete,
      valueFamily,
      marginTop,
    },
    ref,
  ) => {
    const p = useAuthPalette();
    const [hidden, setHidden] = useState(true);
    const labeled = !!label;
    const hasError = !!error;
    const valueColor = hasError ? p.error : p.text;
    const family = valueFamily || (labeled ? fonts.medium : fonts.regular);
    const letterSpacing = labeled ? 0 : ls(-3, 16);

    const body = onPress ? (
      <CustomText
        label={value || placeholder}
        fontSize={16}
        fontFamily={value ? family : fonts.regular}
        letterSpacing={letterSpacing}
        color={value ? valueColor : hasError ? p.error : p.t48}
        numberOfLines={1}
      />
    ) : (
      <TextInput
        ref={ref}
        value={value ?? ""}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={hasError ? p.error : p.t48}
        cursorColor={p.gold}
        selectionColor={p.gold}
        secureTextEntry={secure ? hidden : false}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        editable={editable}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        textContentType={textContentType}
        autoComplete={autoComplete}
        style={[
          styles.input,
          {
            fontFamily: family,
            letterSpacing,
            color: valueColor,
            height: labeled ? 22.4 : "100%",
          },
        ]}
      />
    );

    const Container = onPress ? TouchableOpacity : View;
    return (
      <Container
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.field,
          {
            marginTop,
            height: labeled ? 56 : 48,
            backgroundColor: hasError ? p.errorBg : p.t04,
            borderColor: hasError ? p.error : "transparent",
          },
        ]}
      >
        <View
          style={[
            styles.fieldBody,
            labeled ? styles.fieldBodyLabeled : styles.fieldBodyPlain,
          ]}
        >
          {labeled ? (
            <CustomText
              label={label}
              fontSize={12}
              fontFamily={fonts.medium}
              color={hasError ? p.error : p.t64}
            />
          ) : null}
          {body}
        </View>
        {secure ? (
          <TouchableOpacity
            hitSlop={8}
            onPress={() => setHidden((h) => !h)}
            style={styles.fieldIcon}
          >
            <Icons
              family={MSF}
              name={hidden ? "visibility" : "visibility_off"}
              size={24}
              color={p.t48}
            />
          </TouchableOpacity>
        ) : null}
        {right ? <View style={styles.fieldIcon}>{right}</View> : null}
      </Container>
    );
  },
);

/** Inline error shown under a field, same row style as the hints. */
export const AuthError = ({ text, marginTop }) => {
  const p = useAuthPalette();
  if (!text) return null;
  return (
    <AuthHint
      text={text}
      color={p.error}
      icon="error"
      iconFamily={MSF}
      marginTop={marginTop}
    />
  );
};

/* ------------------------------------------------------------------------- */
/* Cards & selection icons                                                    */
/* ------------------------------------------------------------------------- */

/** Round tick used by every selectable card. */
export const SelectIcon = ({ selected, type = "check", unselectedColor }) => {
  const p = useAuthPalette();
  if (type === "radio") {
    return (
      <Icons
        family={MS}
        name={selected ? "radio_button_checked" : "radio_button_unchecked"}
        size={24}
        color={selected ? p.gold : unselectedColor || p.t32}
      />
    );
  }
  return (
    <Icons
      family={selected ? MSF : MS}
      name={selected ? "check_circle" : "radio_button_unchecked"}
      size={24}
      color={selected ? p.gold : unselectedColor || p.t48}
    />
  );
};

/**
 * Bordered option card (Email/phone screen): stroke 1 FFFFFF 4% inside,
 * radius 12, padding 16, title Medium 16 (-0.5) + description Medium 14 48%.
 */
export const OptionCard = ({
  title,
  description,
  selected,
  onPress,
  icon,
  marginTop = 0,
}) => {
  const p = useAuthPalette();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.optionCard, { borderColor: p.t04, marginTop }]}
    >
      <View style={styles.flex1}>
        <View style={styles.rowCenter}>
          {icon ? <View style={styles.optionIcon}>{icon}</View> : null}
          <CustomText
            label={title}
            fontSize={16}
            fontFamily={fonts.medium}
            letterSpacing={-0.5}
            color={p.text}
          />
        </View>
        <CustomText
          label={description}
          fontSize={14}
          fontFamily={fonts.medium}
          letterSpacing={ls(-0.5, 14)}
          color={p.t48}
          marginTop={textGap(8, 16, 14)}
        />
      </View>
      <SelectIcon selected={selected} />
    </TouchableOpacity>
  );
};

/* ------------------------------------------------------------------------- */
/* Brand lockups                                                              */
/* ------------------------------------------------------------------------- */

/** "PSC." + BETA pill, "By Viktor Sola", signature (Figma 351 × 77, gap 12). */
export const PscLockup = ({ marginTop = 0 }) => {
  const p = useAuthPalette();
  return (
    <View style={[styles.lockup, { marginTop }]}>
      {/* Figma rows are cap-height boxes (28 / 11). A fixed height clips the
          glyphs on iOS, so the rows keep their natural height and the extra
          line-box space is taken back with negative margins. */}
      <View style={[styles.lockupRow, styles.pscRowTrim]}>
        <CustomText
          fontSize={40}
          fontFamily={fonts.medium}
          letterSpacing={ls(-2, 40)}
          color={p.text}
        >
          PSC<Text style={{ color: p.gold }}>.</Text>
        </CustomText>
        <View style={styles.betaOuter}>
          <View style={styles.betaInner}>
            <CustomText
              label="BETA"
              fontSize={12}
              fontFamily={fonts.medium}
              color={COLORS.primaryColor}
            />
          </View>
        </View>
      </View>
      <View style={[styles.lockupBy, styles.byRowTrim]}>
        <CustomText label="By" fontSize={12} color={p.t80} />
        <CustomText
          label="Viktor Sola"
          fontSize={16}
          fontFamily={fonts.medium}
          color={p.text}
        />
      </View>
      <Image
        source={Images.sign}
        resizeMode="contain"
        style={[
          styles.signature,
          { tintColor: p.isDark ? undefined : p.text },
        ]}
      />
    </View>
  );
};

/** "Private / Social Club." (SemiBold Italic 40, -6%, 88%) + GITEX pill. */
export const ClubLockup = ({ gap = 12, pillVariant = "filled" }) => {
  const p = useAuthPalette();
  const lineGap = 40 * 0.88 - 40 * 1.4; // 88% leading without a lineHeight prop
  // iOS keeps the italic face only with fontStyle "italic" (as FeedHeader).
  const textProps = {
    fontSize: 40,
    fontFamily: fonts.semiBoldItalic,
    fontStyle: "italic",
    letterSpacing: ls(-6, 40),
    textAlign: "center",
  };
  return (
    <View style={styles.center}>
      <CustomText
        {...textProps}
        label="Private"
        color={COLORS.white}
        marginTop={-capTop(40)}
      />
      <CustomText
        {...textProps}
        color={p.gold}
        marginTop={lineGap}
        marginBottom={-belowBase(40)}
      >
        Social Club
        <Text style={{ color: "rgba(161, 147, 117, 0.48)" }}>.</Text>
      </CustomText>
      <View
        style={[
          styles.gitexOuter,
          {
            marginTop: gap,
            borderColor:
              pillVariant === "outline"
                ? "rgba(255, 255, 255, 0.48)"
                : "rgba(255, 255, 255, 0.16)",
            backgroundColor:
              pillVariant === "outline"
                ? "transparent"
                : "rgba(255, 255, 255, 0.16)",
          },
        ]}
      >
        <View
          style={[
            styles.gitexInner,
            {
              backgroundColor:
                pillVariant === "outline"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(255, 255, 255, 0.16)",
            },
          ]}
        >
          <CustomText
            label="GITEX Exclusive Access"
            fontSize={10}
            fontFamily={fonts.medium}
            color={COLORS.white}
          />
        </View>
      </View>
    </View>
  );
};

/** "By Viktor Sola" + signature, centred (slides). */
export const BySignature = ({ marginTop = 12 }) => {
  const p = useAuthPalette();
  return (
    <View style={[styles.center, { marginTop }]}>
      <View style={[styles.lockupBy, styles.byRowTrimFirst]}>
        <CustomText label="By" fontSize={12} color={p.t80} />
        <CustomText
          label="Viktor Sola"
          fontSize={16}
          fontFamily={fonts.medium}
          color={COLORS.white}
        />
      </View>
      <Image source={Images.sign} resizeMode="contain" style={styles.signature} />
    </View>
  );
};

/* ------------------------------------------------------------------------- */
/* Onboarding bottom buttons ("Container")                                    */
/* ------------------------------------------------------------------------- */

/**
 * Primary: 359 × 52 ring (1px FFFFFF 48%, padding 4) around a 351 × 44 pill.
 * Secondary: 351 × 48 FFFFFF 16% pill, 8 below. Labels Medium 18.
 */
export const RingButton = ({
  title,
  onPress,
  loading,
  disabled,
  variant = "gold",
  rightIcon,
}) => {
  const p = useAuthPalette();
  const fill = variant === "white" ? COLORS.white : p.gold;
  return (
    <View style={[styles.ring, { borderColor: "rgba(255, 255, 255, 0.48)" }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={disabled || loading}
        onPress={onPress}
        style={[styles.ringPill, { backgroundColor: fill }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primaryColor} />
        ) : (
          <View style={styles.rowCenter}>
            <CustomText
              label={title}
              fontSize={18}
              fontFamily={fonts.medium}
              color={COLORS.primaryColor}
            />
            {rightIcon ? (
              <Icons
                family={MSF}
                name={rightIcon}
                size={18}
                color={COLORS.primaryColor}
                style={styles.ringIcon}
              />
            ) : null}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export const SoftButton = ({ title, onPress, loading, disabled }) => {
  const p = useAuthPalette();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.softBtn, { backgroundColor: p.t16 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={p.text} />
      ) : (
        <CustomText
          label={title}
          fontSize={18}
          fontFamily={fonts.medium}
          color={p.text}
        />
      )}
    </TouchableOpacity>
  );
};

/** Bottom area of the onboarding screens: padding 12/12/34/12, gap 8. */
export const OnboardingActions = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.actions,
        { paddingBottom: Math.max(insets.bottom, 12) },
        style,
      ]}
    >
      {children}
    </View>
  );
};

/* ------------------------------------------------------------------------- */
/* Gold squiggle background                                                   */
/* ------------------------------------------------------------------------- */

export const SquiggleBackground = ({ variant = "ads" }) => {
  const { width } = useWindowDimensions();
  const s = width / 375;
  const set = SQUIGGLES[variant] || SQUIGGLES.ads;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: set.top.x * s,
          width: set.top.w * s,
          height: set.top.h * s,
        }}
      >
        <SvgXml xml={set.top.xml} width="100%" height="100%" />
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: set.bottom.x * s,
          width: set.bottom.w * s,
          height: set.bottom.h * s,
        }}
      >
        <SvgXml xml={set.bottom.xml} width="100%" height="100%" />
      </View>
    </View>
  );
};

/* ------------------------------------------------------------------------- */
/* Option rows & modal card                                                   */
/* ------------------------------------------------------------------------- */

/**
 * Profile Privacy row: 327 × 55, FFFFFF 4%, radius 12, padding 12, title
 * Medium 16 + subtitle Light 12 64% (gap 12), radio 24.
 */
export const OptionRow = ({ title, subtitle, selected, onPress, marginTop }) => {
  const p = useAuthPalette();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.optionRow, { backgroundColor: p.t04, marginTop }]}
    >
      <View style={styles.flex1}>
        <CustomText
          label={title}
          fontSize={16}
          fontFamily={fonts.medium}
          color={p.text}
          marginTop={-capTop(16)}
          marginBottom={subtitle ? 0 : -belowBase(16)}
        />
        {subtitle ? (
          <CustomText
            label={subtitle}
            fontSize={12}
            fontFamily={fonts.light}
            color={p.t64}
            marginTop={textGap(12, 16, 12)}
            marginBottom={-belowBase(12)}
          />
        ) : null}
      </View>
      <SelectIcon selected={selected} type="radio" unselectedColor={p.t32} />
    </TouchableOpacity>
  );
};

/**
 * Enable-Location card: 4px FFFFFF-tinted rim around a #121212 radius-24
 * modal, padding 32/16/16/16.
 */
export const ModalCard = ({ children }) => {
  const p = useAuthPalette();
  return (
    <View style={[styles.modalRim, { backgroundColor: p.t16 }]}>
      <View style={[styles.modalCard, { backgroundColor: p.bg }]}>
        {children}
      </View>
    </View>
  );
};

/** Pill buttons of the modal card (303 × 48, Medium 17.14). */
export const ModalButton = ({ title, onPress, variant = "gold", loading }) => {
  const p = useAuthPalette();
  const gold = variant === "gold";
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading}
      style={[styles.modalBtn, { backgroundColor: gold ? p.gold : p.t16 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={gold ? p.onGold : p.text} />
      ) : (
        <CustomText
          label={title}
          fontSize={17.14}
          fontFamily={fonts.medium}
          color={gold ? p.onGold : p.text}
        />
      )}
    </TouchableOpacity>
  );
};

/* ------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  center: { alignItems: "center" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  underline: { textDecorationLine: "underline" },

  header: {
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    // minHeight, not height: a fixed height clips the subtitle on iOS.
    minHeight: 44,
    gap: 12,
  },
  headerTexts: {
    flex: 1,
    paddingTop: 5 - capTop(20),
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  circle44: {
    width: 44,
    height: 44,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    marginTop: 12,
    height: 4,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 1,
  },

  footer: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circle48: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtn: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  hintRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hintText: {
    flex: 1,
    marginLeft: 4,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 11,
  },
  fieldBody: {
    flex: 1,
    height: "100%",
  },
  fieldBodyPlain: {
    justifyContent: "center",
  },
  fieldBodyLabeled: {
    paddingTop: 12 - capTop(12) - 1,
  },
  input: {
    padding: 0,
    margin: 0,
    fontSize: 16,
  },
  fieldIcon: {
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingTop: 15 - capTop(16),
    paddingBottom: 15 - belowBase(14),
  },
  optionIcon: {
    marginRight: 6,
  },

  lockup: {
    alignItems: "center",
  },
  lockupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  // "PSC." 40: RN box 56 vs Figma 28 → 14 above / 14 below.
  pscRowTrim: {
    marginTop: -capTop(40),
    marginBottom: -belowBase(40),
  },
  // "Viktor Sola" 16: RN box 22.4 vs Figma 11 → 5.6 above / below; gap 12.
  byRowTrim: {
    marginTop: 12 - capTop(16),
    marginBottom: -belowBase(16),
  },
  byRowTrimFirst: {
    marginTop: -capTop(16),
    marginBottom: -belowBase(16),
  },
  betaOuter: {
    height: 24,
    borderRadius: 100,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(18, 18, 18, 0.16)",
    backgroundColor: "rgba(18, 18, 18, 0.16)",
  },
  betaInner: {
    flex: 1,
    borderRadius: 100,
    paddingHorizontal: 5,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  lockupBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signature: {
    width: 81,
    height: 20,
    marginTop: 12 - 3,
    marginBottom: -3,
  },
  gitexOuter: {
    height: 20,
    borderRadius: 100,
    borderWidth: 1,
    padding: 1,
  },
  gitexInner: {
    flex: 1,
    borderRadius: 100,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  ring: {
    alignSelf: "stretch",
    marginHorizontal: -4,
    height: 52,
    borderRadius: 100,
    borderWidth: 1,
    padding: 3,
  },
  ringPill: {
    flex: 1,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  ringIcon: {
    marginLeft: 8,
  },
  softBtn: {
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 8,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalRim: {
    width: 343,
    maxWidth: "100%",
    alignSelf: "center",
    padding: 4,
    borderRadius: 28,
  },
  modalCard: {
    borderRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalBtn: {
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
