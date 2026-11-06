import { useNavigation } from "@react-navigation/native";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import fonts from "../../../../assets/fonts";
import CustomSwitch from "../../../../components/CustomSwitch";
import CustomText from "../../../../components/CustomText";
import GlassBackButton from "../../../../components/GlassBackButton";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { GlassFill } from "../../BandMateMatching/molecules/matchLayout";

/**
 * Shared pieces of the Jobs module (Figma Matching › Add-An-Experience,
 * Select-Company / Job-Title / Employment-Type / Education, Job-Listing).
 * Every value is the Figma inspect value; texts never carry a lineHeight —
 * CustomText draws 1.4 × fontSize line boxes, so gaps between trimmed Figma
 * texts lose 0.35 × fontSize per side (X).
 */
export const MS = "MaterialSymbolsRounded";
export const MSF = "MaterialSymbolsRoundedFilled";
export const X = (fs) => Math.round(fs * 0.35 * 10) / 10;

export const WHITE_4 = "rgba(255, 255, 255, 0.04)";
export const WHITE_8 = "rgba(255, 255, 255, 0.08)";
export const WHITE_16 = "rgba(255, 255, 255, 0.16)";
export const WHITE_46 = "rgba(255, 255, 255, 0.46)";
export const WHITE_48 = "rgba(255, 255, 255, 0.48)";
export const WHITE_64 = "rgba(255, 255, 255, 0.64)";
export const GOLD = "#A19375";
export const INK = "#121212";
export const SHEET_BG = "#262626";

export const HEADER_TOP_GAP = 8; // Figma header padding 52 − 44 status bar

/**
 * Figma "Header" 375 × 100 (Add-An-Experience, My-Job-Offers): padding
 * 52 / 12 / 8 / 12, row gap 12: back 40 circle (white 4% + blur) · title
 * SemiBold 20 −0.5% left-aligned · optional right control.
 */
export const CareerHeader = ({ title, onBack, right, gap = 12, titleLetterSpacing = -0.1, backFill }) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.header, { gap }]}>
      <GlassBackButton
        onPress={onBack || (() => navigation.goBack())}
        color={WHITE_64}
        fill={backFill}
      />
      <CustomText
        label={title}
        fontSize={20}
        letterSpacing={titleLetterSpacing}
        fontFamily={fonts.semiBold}
        color="#FFFFFF"
        numberOfLines={1}
        containerStyle={styles.grow}
      />
      {right}
    </View>
  );
};

/** Figma close button: 40 circle white 4% + blur, `close` 24 white 64% */
export const CloseCircle = ({ onPress }) => (
  <GlassBackButton onPress={onPress} icon="close" color={WHITE_64} accessibilityLabel="Close" />
);

/**
 * Figma search pill (Select-Company 40h / Job-Listing 44h): r100 white 4%,
 * padding 16 / 10, `search` icon white 64%, Medium text, clear icon.
 */
export const SearchPill = ({
  value,
  onChangeText,
  placeholder,
  height = 40,
  iconSize = 20,
  fontSize = 14,
  letterSpacing = -0.14,
  autoFocus,
  onSubmitEditing,
  // Figma Job-Listing search (8204:8889): padding 12, gap 10, placeholder
  // white 64%, `cancel` 22 always shown
  placeholderColor = WHITE_48,
  paddingHorizontal = 16,
  gap = 8,
  clearSize,
  clearAlways = false,
  clearFamily = MS,
  clearColor = WHITE_64,
  onClear,
}) => (
  <View style={[styles.searchPill, { height, paddingHorizontal, gap }]}>
    <GlassFill borderRadius={100} />
    <Icons family={MS} name="search" size={iconSize} color={WHITE_64} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      autoFocus={autoFocus}
      autoCorrect={false}
      returnKeyType={onSubmitEditing ? "done" : "search"}
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={!onSubmitEditing}
      style={[styles.searchInput, { fontSize, letterSpacing }]}
    />
    {(!!value || clearAlways) && (
      <TouchableOpacity
        onPress={() => {
          onChangeText("");
          onClear?.();
        }}
        hitSlop={8}
        activeOpacity={0.6}
      >
        <Icons family={clearFamily} name="cancel" size={clearSize || iconSize} color={clearColor} />
      </TouchableOpacity>
    )}
  </View>
);

/** Section title — Medium 18 −0.5% */
export const SectionTitle = ({ label }) => (
  // trimmed to the Figma 13pt text box, so section padding / gaps are exact
  <CustomText
    label={label}
    fontSize={18}
    letterSpacing={-0.09}
    fontFamily={fonts.medium}
    color="#FFFFFF"
    marginTop={-X(18)}
    marginBottom={-X(18)}
  />
);

/**
 * Figma field box 56h r12 white 4% padding 12, row gap 10: label Medium 12
 * uppercase white 64% (8 tall trimmed) · 10 · value Medium 16 −0.5
 * (11 tall trimmed); `chevron_right` 24 white 46% / a switch / nothing.
 */
export const FieldBox = ({
  label,
  value,
  placeholder = "Select",
  onPress,
  leading,
  trailing = "chevron",
  switchValue,
  onSwitch,
  valueColor,
  valueLetterSpacing = -0.5,
  switchColor,
  switchDisabled,
  valueRowGap = 6,
  // Add-An-Experience chevrons are white 46%, New Job Offer / sheets 64%
  chevronColor = WHITE_46,
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper activeOpacity={0.8} onPress={onPress} style={styles.field}>
      <View style={styles.fieldColumn}>
        <CustomText
          label={label}
          fontSize={12}
          fontFamily={fonts.medium}
          textTransform="uppercase"
          color={WHITE_64}
          numberOfLines={1}
          marginTop={(8 - 12 * 1.4) / 2}
          marginBottom={(8 - 12 * 1.4) / 2}
        />
        <View style={[styles.fieldValueRow, { gap: valueRowGap }]}>
          {leading}
          <CustomText
            label={value || placeholder}
            fontSize={16}
            letterSpacing={valueLetterSpacing}
            fontFamily={fonts.medium}
            color={value ? valueColor || "#FFFFFF" : WHITE_48}
            numberOfLines={1}
            marginTop={(11 - 16 * 1.4) / 2}
            marginBottom={(11 - 16 * 1.4) / 2}
            containerStyle={styles.shrink}
          />
        </View>
      </View>
      {trailing === "chevron" && <Icons family={MS} name="chevron_right" size={24} color={chevronColor} />}
      {trailing === "switch" && (
        <CustomSwitch value={!!switchValue} setValue={onSwitch} bgColor={switchColor} disabled={switchDisabled} />
      )}
    </Wrapper>
  );
};

/** Field box with a typed value (same box as FieldBox; label + TextInput Medium 16 −0.5) */
export const TextFieldBox = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize }) => (
  <View style={styles.field}>
    <View style={styles.fieldColumn}>
      <CustomText
        label={label}
        fontSize={12}
        fontFamily={fonts.medium}
        textTransform="uppercase"
        color={WHITE_64}
        numberOfLines={1}
        marginTop={(8 - 12 * 1.4) / 2}
        marginBottom={(8 - 12 * 1.4) / 2}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={WHITE_48}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={styles.fieldInput}
      />
    </View>
  </View>
);

/** Figma helper row under a field: `info` 12 white 48% · 4 · Regular 12 −3% */
export const HelperRow = ({ label, icon = "info", color = WHITE_48, letterSpacing = -0.36 }) => (
  <View style={styles.helperRow}>
    <Icons family={MS} name={icon} size={12} color={color} />
    <CustomText
      label={label}
      fontSize={12}
      letterSpacing={letterSpacing}
      color={color}
      marginTop={-X(12)}
      marginBottom={-X(12)}
      containerStyle={styles.shrink}
    />
  </View>
);

/** 24 radio (Figma Select-* rows): white 48% ring, gold dot when selected */
export const Radio = ({ selected }) => (
  <Icons
    family={MS}
    name={selected ? "radio_button_checked" : "radio_button_unchecked"}
    size={24}
    color={selected ? GOLD : WHITE_48}
  />
);

/** "Dell Technologies" → "DT" */
export const nameInitials = (name) =>
  String(name || "")
    .split(/[\s\-_.,&()/'"+]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/**
 * Company / school logo: image, else (PSC avatar rule) the name's initials
 * on white 8%, else a `domain` glyph on white 4%.
 */
export const LogoBox = ({ uri, size = 32, radius, icon = "domain", name }) => {
  const initials = !uri ? nameInitials(name) : "";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size / 4),
        backgroundColor: initials ? WHITE_8 : WHITE_4,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <ImageFast source={{ uri }} style={{ width: size, height: size }} />
      ) : initials ? (
        <CustomText label={initials} fontSize={Math.round(size * 0.36)} fontFamily={fonts.semiBold} color="#FFFFFF" />
      ) : (
        <Icons family={MSF} name={icon} size={Math.round(size * 0.5)} color={WHITE_48} />
      )}
    </View>
  );
};

/** Figma rating chip 28h p0/8 r100: 1px white 4% border, Medium 12 white 48%;
 * selected: white fill, #121212 text */
export const SelectChip = ({ label, selected, onPress, disabled, flex }) => (
  <TouchableOpacity
    activeOpacity={0.8}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.chip,
      flex && styles.grow,
      selected ? styles.chipOn : styles.chipOff,
      disabled && !selected && { opacity: 0.4 },
    ]}
  >
    <CustomText
      label={label}
      fontSize={12}
      fontFamily={fonts.medium}
      color={selected ? INK : WHITE_48}
      numberOfLines={1}
    />
  </TouchableOpacity>
);

/** Figma footer 94h padding 12 / 12 / 34: Continue 48h r100 gold, Medium 18 */
export const FooterButton = ({ label = "Continue", onPress, disabled, loading }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 0 }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled || loading}
        onPress={onPress}
        style={[styles.footerBtn, (disabled || loading) && { opacity: 0.5 }]}
      >
        <CustomText label={loading ? "Saving…" : label} fontSize={18} fontFamily={fonts.medium} color={INK} />
      </TouchableOpacity>
    </View>
  );
};

/** 1px white 4% row separator */
export const Separator = () => <View style={styles.separator} />;

/** 3px dot between inline metas ("Jan 2026 - Present • 3 yrs") */
export const Dot = ({ color = WHITE_48 }) => <View style={[styles.dot, { backgroundColor: color }]} />;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  header: {
    paddingTop: HEADER_TOP_GAP,
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    height: "100%",
    fontFamily: fonts.medium,
    color: "#FFFFFF",
  },
  field: {
    height: 56,
    borderRadius: 12,
    backgroundColor: WHITE_4,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fieldColumn: { flex: 1, gap: 10 },
  fieldInput: {
    // 22 tall so iOS doesn't clip descenders; −3 margins keep the 11 box
    height: 22,
    marginTop: -5.5,
    marginBottom: -5.5,
    padding: 0,
    fontFamily: fonts.medium,
    fontSize: 16,
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  fieldValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  helperRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  chip: {
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOff: { borderWidth: 1, borderColor: WHITE_4 },
  chipOn: { backgroundColor: "#FFFFFF" },
  // Figma "Frame 10" (Add-An-Experience): solid #121212, 1pt #262626 line
  // above it (the page's section gap), padding 12/12/34
  footer: { paddingHorizontal: 12, paddingTop: 12, backgroundColor: INK, borderTopWidth: 1, borderTopColor: SHEET_BG },
  footerBtn: {
    height: 48,
    borderRadius: 100,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 1, backgroundColor: WHITE_4 },
  dot: { width: 3, height: 3, borderRadius: 100 },
});
