import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import UserBadge from "../../../../components/UserBadge";
import { useTheme } from "../../../../contexts/ThemeContext";
import { get } from "../../../../services/ApiRequest";
import InitialsFill from "../../../../components/InitialsFill";
import { SheetCloseButton } from "../../../../components/FloatingSheet";

const MAX_ROWS = 5;

/**
 * "@" people picker for poll options — ported from Viral's comment
 * MentionList: the people you follow, filtered by what is typed after "@",
 * titled "Mention People" with the count. Shown inline under the option being
 * typed (the publish form is a scroll view, not a sheet).
 */
// one row: 40 avatar + 8 / 8 padding
const ROW_H = 56;

// does this user match what was typed after the "@"?
const matchesQuery = (u, q) => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    `${u?.firstName || ""} ${u?.lastName || ""}`.toLowerCase().includes(needle) ||
    (u?.username || "").toLowerCase().includes(needle)
  );
};

// `extraPeople`: always-available candidates (the conversation's members in a
// chat), shown first — the people you follow are merged in after them
const MentionList = ({ query, onSelect, onClose, maxVisibleRows, extraPeople }) => {
  const { colors } = useTheme();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = (query || "").trim();
        const res = await get(
          `relationships/following${q ? `?searchQuery=${encodeURIComponent(q)}` : ""}`,
        );
        if (id !== requestId.current) return;
        setPeople(res?.data?.data?.users || []);
      } catch (e) {
        if (id === requestId.current) setPeople([]);
        // the members passed in still show on a failed request
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // members first, then the people you follow, deduped by id
  const members = (extraPeople || []).filter((u) => u?._id && matchesQuery(u, (query || "").trim()));
  const memberIds = new Set(members.map((u) => String(u._id)));
  const shown = [...members, ...people.filter((u) => u?._id && !memberIds.has(String(u._id)))];

  return (
    <View style={[styles.container, onClose && styles.cardContainer]}>
      {onClose ? (
        // floating card (chat): FloatingSheet "sm" header — SemiBold 16
        // −2% title, count, 32 close circle
        <View style={styles.cardHeader}>
          <View style={[styles.titleRow, styles.cardTitle]}>
            <CustomText
              label="Mention People"
              fontSize={16}
              letterSpacing={-0.32}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            <CustomText
              label={`${shown.length}`}
              fontSize={16}
              letterSpacing={-0.32}
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
          </View>
          <SheetCloseButton onPress={onClose} />
        </View>
      ) : (
      <View style={styles.titleRow}>
        <CustomText
          label="Mention People"
          fontSize={14}
          fontFamily={fonts.medium}
          color={colors.textSecondary}
        />
        <CustomText
          label={`${shown.length}`}
          fontSize={14}
          fontFamily={fonts.medium}
          color={colors.text}
        />
      </View>
      )}
      {loading && shown.length === 0 ? (
        [0, 1, 2].map((i) => <RowSkeleton key={i} colors={colors} />)
      ) : shown.length === 0 ? (
        <CustomText
          label="No results found"
          fontSize={14}
          color={colors.textSecondary}
          textAlign="center"
          marginVertical={16}
        />
      ) : (
        // card (chat): everyone matching, scrolling past `maxVisibleRows`
        // (3 while the keyboard is up, so the card never reaches the header)
        <Rows scroll={!!maxVisibleRows} maxHeight={(maxVisibleRows || MAX_ROWS) * ROW_H}>
        {shown.slice(0, maxVisibleRows ? 50 : MAX_ROWS).map((u) => (
          <TouchableOpacity
            key={u?._id}
            activeOpacity={0.7}
            onPress={() => onSelect?.(u)}
            style={styles.row}
          >
            {u?.profile?.avatar ? (
              <ImageFast source={{ uri: u.profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { overflow: "hidden" }]}>
                <InitialsFill user={u} size={40} />
              </View>
            )}
            <View style={styles.texts}>
              <View style={styles.nameRow}>
                <CustomText
                  label={`${u?.firstName || ""} ${u?.lastName || ""}`.trim()}
                  fontFamily={fonts.medium}
                  numberOfLines={1}
                  containerStyle={styles.shrink}
                />
                <UserBadge user={u} />
              </View>
              <CustomText
                label={u?.username ? `@${u.username}` : ""}
                fontSize={12}
                color={colors.textSecondary}
                numberOfLines={1}
              />
            </View>
          </TouchableOpacity>
        ))}
        </Rows>
      )}
    </View>
  );
};

const Rows = ({ scroll, maxHeight, children }) =>
  scroll ? (
    <ScrollView
      style={{ maxHeight }}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  ) : (
    <>{children}</>
  );

const RowSkeleton = ({ colors }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const box = (style) => (
    <Animated.View style={[{ backgroundColor: colors.surfaceAlt, opacity }, style]} />
  );
  return (
    <View style={styles.row}>
      {box({ width: 40, height: 40, borderRadius: 20 })}
      <View style={{ gap: 6 }}>
        {box({ width: 140, height: 12, borderRadius: 4 })}
        {box({ width: 90, height: 10, borderRadius: 4 })}
      </View>
    </View>
  );
};

export default MentionList;

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  cardContainer: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  cardTitle: { paddingBottom: 0 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 4,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  texts: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  shrink: {
    flexShrink: 1,
  },
});
