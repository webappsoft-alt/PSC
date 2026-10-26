import { BlurView } from "@react-native-community/blur";
import { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { GlassFill, SHOWS } from "./showsLayout";

/**
 * Figma Show-Feed "Header" (375×152 incl. 44pt status bar): pad 56 (status
 * bar + 12) / 12 / 8 / 12, gap 8, fill linear #750C73 → #121212 64% at 48%
 * (top → bottom) on a blur 16.
 *  Row 1 (44): "Shows" SemiBold 32 −0.5% · 44 search circle (white 4%, 22
 *              search @64%) — search state: 44 pill, pad 12, gap 8, 22 search
 *              @64%, Medium 16 −1% (placeholder @48%), 22 cancel @48%.
 *  Row 2 (36, pad-top 4, gap 3): For You (32, r100, white, pad 8/10, 16
 *              explore + SemiBold 14 −4% #121212) · 32 "+" circle (white 4%,
 *              16 add) · topic chips (32, r8, white 4%, pad 8, Bold Italic 14
 *              −4% UPPER @64%, 6pt #007BFF dot 4 after when the topic has
 *              new releases).
 */
export const SHOWS_HEADER_TOP = 12;
export const SHOWS_HEADER_ROW1 = 44;
export const SHOWS_HEADER_GAP = 8;
export const SHOWS_HEADER_ROW2 = 36;
export const SHOWS_HEADER_BOTTOM = 8;
export const showsHeaderHeight = (topInset = 0) =>
  topInset +
  SHOWS_HEADER_TOP +
  SHOWS_HEADER_ROW1 +
  SHOWS_HEADER_GAP +
  SHOWS_HEADER_ROW2 +
  SHOWS_HEADER_BOTTOM; // 44 + 108 = Figma 152

const ShowsHeader = ({
  topics = [],
  topic,
  onTopicChange,
  newTopics = [],
  onAddTopicPress,
  searching,
  onSearchOpen,
  onSearchClose,
  search,
  onSearchChange,
}) => {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  useEffect(() => {
    if (searching) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [searching]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SHOWS_HEADER_TOP }]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={16}
        overlayColor="transparent"
        reducedTransparencyFallbackColor={SHOWS.section}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[SHOWS.purple, "rgba(18, 18, 18, 0.64)"]}
        locations={[0, 0.48]}
        style={StyleSheet.absoluteFill}
      />

      {/* Row 1 — title + search, or the search field */}
      {searching ? (
        <View style={styles.searchBar}>
          <GlassFill fill={SHOWS.white04} />
          <Icons
            family="MaterialSymbolsRounded"
            name="search"
            size={22}
            color={SHOWS.white64}
          />
          <TextInput
            ref={inputRef}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Eg. Jordan Peterson..."
            placeholderTextColor={SHOWS.white48}
            selectionColor={SHOWS.gold}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.searchInput}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSearchClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="cancel"
              size={22}
              color={SHOWS.white48}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.titleRow}>
          <CustomText
            label="Shows"
            fontSize={32}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.16}
            color={SHOWS.white}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onSearchOpen}
            style={styles.searchButton}
          >
            <GlassFill fill={SHOWS.white04} />
            <Icons
              family="MaterialSymbolsRounded"
              name="search"
              size={22}
              color={SHOWS.white64}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Row 2 — chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTopicChange?.(null)}
          style={[
            styles.forYou,
            { backgroundColor: topic ? undefined : SHOWS.white },
          ]}
        >
          {topic ? <GlassFill fill={SHOWS.white04} /> : null}
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="explore"
            size={16}
            color={topic ? SHOWS.white64 : SHOWS.section}
          />
          <CustomText
            label="For You"
            fontSize={14}
            fontFamily={fonts.semiBold}
            letterSpacing={-0.56}
            color={topic ? SHOWS.white64 : SHOWS.section}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAddTopicPress}
          disabled={!onAddTopicPress}
          style={styles.plus}
        >
          <GlassFill fill={SHOWS.white04} />
          <Icons
            family="MaterialSymbolsRounded"
            name="add"
            size={16}
            color={SHOWS.white}
          />
        </TouchableOpacity>

        {topics.map((name) => {
          const active = topic === name;
          const hasNew = newTopics.includes(name);
          return (
            <TouchableOpacity
              key={name}
              activeOpacity={0.7}
              onPress={() => onTopicChange?.(active ? null : name)}
              style={[styles.topic, active && { backgroundColor: SHOWS.white }]}
            >
              {!active ? <GlassFill fill={SHOWS.white04} borderRadius={8} /> : null}
              <CustomText
                label={name.toUpperCase()}
                fontSize={14}
                fontFamily={fonts.BoldItalic}
                fontStyle="italic"
                letterSpacing={-0.56}
                color={active ? SHOWS.section : SHOWS.white64}
              />
              {hasNew ? <View style={styles.newDot} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default ShowsHeader;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SHOWS_HEADER_BOTTOM,
    overflow: "hidden",
  },
  titleRow: {
    height: SHOWS_HEADER_ROW1,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    height: SHOWS_HEADER_ROW1,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: SHOWS_HEADER_ROW1,
    padding: 0,
    fontSize: 16,
    fontFamily: fonts.medium,
    letterSpacing: -0.16,
    color: SHOWS.white,
  },
  chipsScroll: {
    flexGrow: 0,
    marginTop: SHOWS_HEADER_GAP,
  },
  chips: {
    height: SHOWS_HEADER_ROW2,
    paddingTop: 4,
    paddingHorizontal: 12,
    gap: 3,
    alignItems: "center",
  },
  forYou: {
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
    paddingRight: 10,
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  topic: {
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SHOWS.blue,
  },
});
