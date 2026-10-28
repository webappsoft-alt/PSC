import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import CustomSwitch from "../../../../components/CustomSwitch";
import CustomText from "../../../../components/CustomText";
import HeaderProgressiveBlur from "../../../../components/HeaderProgressiveBlur";
import Icons from "../../../../components/Icons";
import { GlassFill, SHOWS, baseline, capGap, capTop } from "./showsLayout";

/**
 * Figma Shows create-flow building blocks ("Create An Episode", "New Show",
 * "Select-Show", "Select-Genre", "Age Rating"). Every field is the
 * "Bar-de-recherche" box: 56 high, r12, white 4% (on a blur — opacity =
 * blur), pad 12; label Medium 12 UPPER @64% · 10 · value Medium 14 white;
 * 24 chevron_right @64%. Info lines sit 6 below: 12 info icon · 4 · Regular
 * 12 −3%.
 */
export const FIELD_HEIGHT = 56;
export const LABEL_SIZE = 12;

/* ───────────────────────────── header ──────────────────────────────── */

/**
 * Header (status bar + 56): pad 8 / 12 / 8 / 12, progressive blur; 40 back circle
 * (white 4%, 24 chevron_left @64%) · 16 · SemiBold 20 −0.5%; optional right
 * node. `children` render under the row (search field, chips).
 */
export const FormHeader = ({
  title,
  onBack,
  right,
  children,
  gap = 12,
  // Figma: Create An Episode / Age Rating pad 52 (status bar + 8) and a
  // 16 back → title gap; Select-Show pad 56 (+ 12) and 12
  topPad = 8,
  titleGap = 16,
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + topPad }]}>
      {/* Figma Header: progressive blur 16 → 0 + #121212 1%; the form
          scrolls under it */}
      <HeaderProgressiveBlur />
      <View style={styles.headerRow}>
        <View style={[styles.headerLeft, { gap: titleGap }]}>
          {onBack ? <CircleButton icon="chevron_left" onPress={onBack} /> : null}
          <CustomText
            label={title}
            fontSize={20}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.1}
            color={SHOWS.white}
            numberOfLines={1}
            containerStyle={styles.flex}
          />
        </View>
        {right}
      </View>
      {children ? <View style={{ marginTop: gap }}>{children}</View> : null}
    </View>
  );
};

/** 40 translucent circle with a 24 glyph @64% (back / add / close). */
export const CircleButton = ({ icon, onPress, size = 24, filled }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    style={styles.circle}
  >
    <GlassFill fill={SHOWS.white04} />
    <Icons
      family={filled ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"}
      name={icon}
      size={size}
      color={SHOWS.white64}
    />
  </TouchableOpacity>
);

/* ───────────────────────────── texts ───────────────────────────────── */

/** "General Details" / "Availability" / "Price": Medium 18 −0.5% white. */
export const SectionTitle = ({ label, subtitle }) => (
  <View>
    <CustomText
      label={label}
      fontSize={18}
      fontFamily={fonts.medium}
      letterSpacing={-0.09}
      color={SHOWS.white}
      marginTop={capTop(18)}
      marginBottom={subtitle ? 0 : baseline(18)}
    />
    {subtitle ? (
      <CustomText
        label={subtitle}
        fontSize={14}
        fontFamily={fonts.medium}
        color={SHOWS.white64}
        marginTop={capGap(16, 18, 14)}
        marginBottom={baseline(14)}
      />
    ) : null}
  </View>
);

/**
 * Info line under a field: 12 info icon · 4 · Regular 12 −3%. `parts` lets
 * words switch to Medium white (TOS / delete notes).
 */
export const InfoLine = ({
  label,
  parts,
  color = SHOWS.white64,
  icon = "info",
  iconColor,
  iconSize = 12,
  center,
  multiline,
  style,
}) => (
  <View
    style={[
      styles.info,
      center && styles.infoCenter,
      multiline && styles.infoMultiline,
      style,
    ]}
  >
    <Icons
      family={icon === "cancel" ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"}
      name={icon}
      size={iconSize}
      color={iconColor || color}
      style={multiline ? styles.infoIconTop : null}
    />
    <CustomText
      fontSize={12}
      letterSpacing={-0.36}
      color={color}
      containerStyle={center ? null : styles.flexShrink}
      // multi-line notes: first line's cap aligned with the icon row
      marginTop={multiline ? -2.4 : 0}
    >
      {parts
        ? parts.map((part, i) => (
            <Text
              key={i}
              style={
                part.strong
                  ? { fontFamily: fonts.medium, color: SHOWS.white }
                  : null
              }
            >
              {part.text}
            </Text>
          ))
        : label}
    </CustomText>
  </View>
);

/* ───────────────────────────── fields ──────────────────────────────── */

export const FieldLabel = ({ label }) => (
  <CustomText
    label={label}
    textTransform="uppercase"
    fontSize={LABEL_SIZE}
    fontFamily={fonts.medium}
    color={SHOWS.white64}
    marginTop={capTop(LABEL_SIZE)}
    numberOfLines={1}
  />
);

/** Box with the translucent fill (r12). */
export const FieldBox = ({ children, style, height = FIELD_HEIGHT }) => (
  <View style={[styles.box, height ? { height } : null, style]}>
    <GlassFill fill={SHOWS.white04} borderRadius={12} />
    {children}
  </View>
);

/**
 * Tappable field: label + value (Medium 14 or 16) + chevron.
 * `valueNode` replaces the text (cast names with badges, currency flag).
 */
export const SelectField = ({
  label,
  value,
  placeholder,
  valueSize = 14,
  valueNode,
  onPress,
  disabled,
  style,
  chevron = "chevron_right",
}) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled}>
    <FieldBox style={style}>
      <View style={styles.fieldColumn}>
        <FieldLabel label={label} />
        <View
          style={{
            marginTop: capGap(10, LABEL_SIZE, valueSize),
            marginBottom: baseline(valueSize),
          }}
        >
          {valueNode || (
            <CustomText
              label={value || placeholder || ""}
              fontSize={valueSize}
              fontFamily={fonts.medium}
              letterSpacing={valueSize === 16 ? -0.32 : 0}
              color={value ? SHOWS.white : SHOWS.white48}
              numberOfLines={1}
            />
          )}
        </View>
      </View>
      <Icons
        family="MaterialSymbolsRounded"
        name={chevron}
        size={24}
        color={SHOWS.white64}
      />
    </FieldBox>
  </TouchableOpacity>
);

/**
 * Text field: label + TextInput (Medium 14 white, placeholder @48%).
 * `height` > 56 → multiline (Synopsis 178 / New Show synopsis 120).
 */
export const InputField = forwardRef(
  (
    {
      label,
      value,
      onChangeText,
      placeholder,
      valueSize = 14,
      height = FIELD_HEIGHT,
      keyboardType,
      maxLength,
      multiline,
      style,
      inputProps,
    },
    ref,
  ) => {
    const lineBox = valueSize * 1.4;
    return (
      <FieldBox
        height={height}
        style={[multiline && styles.boxMultiline, style]}
      >
        <View style={[styles.fieldColumn, multiline && styles.fieldColumnTop]}>
          <FieldLabel label={label} />
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={SHOWS.white48}
            selectionColor={SHOWS.gold}
            keyboardType={keyboardType}
            maxLength={maxLength}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            style={[
              styles.input,
              {
                fontSize: valueSize,
                letterSpacing: valueSize === 16 ? -0.32 : 0,
                marginTop: capGap(10, LABEL_SIZE, valueSize),
                marginBottom: multiline ? 0 : baseline(valueSize),
                height: multiline ? undefined : lineBox,
              },
              multiline && styles.inputMultiline,
            ]}
            {...inputProps}
          />
        </View>
      </FieldBox>
    );
  },
);

/** Field with a toggle: label + Yes/No + the PSC switch (gold). */
export const ToggleField = ({ label, value, onValueChange, valueSize = 14 }) => (
  <FieldBox>
    <View style={styles.fieldColumn}>
      <FieldLabel label={label} />
      <CustomText
        label={value ? "Yes" : "No"}
        fontSize={valueSize}
        fontFamily={fonts.medium}
        letterSpacing={valueSize === 16 ? -0.32 : 0}
        color={SHOWS.white}
        marginTop={capGap(10, LABEL_SIZE, valueSize)}
        marginBottom={baseline(valueSize)}
      />
    </View>
    <View style={styles.switchSlot}>
      <CustomSwitch value={value} setValue={onValueChange} bgColor={SHOWS.gold} />
    </View>
  </FieldBox>
);

/** A field + its info line (6 apart). */
export const FieldGroup = ({ children, info }) => (
  <View>
    {children}
    {info}
  </View>
);

/** 1pt white 4% rule between form blocks. */
export const FormDivider = () => <View style={styles.divider} />;

/* ─────────────────────────── list rows ─────────────────────────────── */

/** 24 radio: unchecked white @16% (or 48%), checked gold. */
export const Radio = ({ checked, idleColor = SHOWS.white16 }) => (
  <Icons
    family="MaterialSymbolsRounded"
    name={checked ? "radio_button_checked" : "radio_button_unchecked"}
    size={24}
    color={checked ? SHOWS.gold : idleColor}
  />
);

/** 64pt list row (pad 16), 1pt white 4% separator after it. */
export const ListRow = ({ children, onPress, last }) => (
  <>
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.listRow}>
      {children}
    </TouchableOpacity>
    {!last ? <View style={styles.listSeparator} /> : null}
  </>
);

/* ─────────────────────────── bottom CTA ────────────────────────────── */

/** Fixed bottom bar: #121212, pad 8 / 12 / home indicator; 48 gold pill. */
export const BottomCTA = ({ label, onPress, disabled, loading }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.ctaButton, (disabled || loading) && styles.ctaDisabled]}
      >
        <CustomText
          label={loading ? "Please wait..." : label}
          fontSize={18}
          fontFamily={fonts.medium}
          color={SHOWS.section}
        />
      </TouchableOpacity>
    </View>
  );
};

/** Sheet buttons (New Show): Cancel (white 4%) · Confirm (gold / white 16%). */
export const SheetButtons = ({ onCancel, onConfirm, confirmLabel = "Confirm", disabled, loading }) => (
  <View style={styles.sheetButtons}>
    <TouchableOpacity activeOpacity={0.8} onPress={onCancel} style={styles.sheetButton}>
      <GlassFill fill={SHOWS.white04} />
      <CustomText label="Cancel" fontSize={16} fontFamily={fonts.medium} color={SHOWS.white} />
    </TouchableOpacity>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onConfirm}
      disabled={disabled || loading}
      style={[styles.sheetButton, !(disabled || loading) && { backgroundColor: SHOWS.gold }]}
    >
      {disabled || loading ? <GlassFill fill={SHOWS.white16} /> : null}
      <CustomText
        label={loading ? "Please wait..." : confirmLabel}
        fontSize={16}
        fontFamily={fonts.medium}
        color={SHOWS.section}
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    marginTop: 6,
    minHeight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoCenter: {
    justifyContent: "center",
  },
  infoMultiline: {
    alignItems: "flex-start",
  },
  infoIconTop: {
    marginTop: 0,
  },
  box: {
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  boxMultiline: {
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 12,
  },
  fieldColumn: {
    flex: 1,
  },
  fieldColumnTop: {
    alignSelf: "stretch",
  },
  input: {
    padding: 0,
    fontFamily: fonts.medium,
    color: SHOWS.white,
  },
  inputMultiline: {
    flex: 1,
  },
  switchSlot: {
    height: 28,
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: SHOWS.white04,
  },
  listRow: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listSeparator: {
    height: 1,
    backgroundColor: SHOWS.white04,
  },
  cta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: SHOWS.section,
  },
  ctaButton: {
    height: 48,
    borderRadius: 100,
    backgroundColor: SHOWS.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    opacity: 0.48,
  },
  sheetButtons: {
    flexDirection: "row",
    gap: 4,
  },
  sheetButton: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});
