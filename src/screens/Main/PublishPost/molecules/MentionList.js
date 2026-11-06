import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import UserBadge from "../../../../components/UserBadge";
import { useTheme } from "../../../../contexts/ThemeContext";
import { get } from "../../../../services/ApiRequest";
import InitialsFill from "../../../../components/InitialsFill";

const MAX_ROWS = 5;

/**
 * "@" people picker for poll options — ported from Viral's comment
 * MentionList: the people you follow, filtered by what is typed after "@",
 * titled "Mention People" with the count. Shown inline under the option being
 * typed (the publish form is a scroll view, not a sheet).
 */
const MentionList = ({ query, onSelect }) => {
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
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <CustomText
          label="Mention People"
          fontSize={14}
          fontFamily={fonts.medium}
          color={colors.textSecondary}
        />
        <CustomText
          label={`${people.length}`}
          fontSize={14}
          fontFamily={fonts.medium}
          color={colors.text}
        />
      </View>
      {loading ? (
        [0, 1, 2].map((i) => <RowSkeleton key={i} colors={colors} />)
      ) : people.length === 0 ? (
        <CustomText
          label="No results found"
          fontSize={14}
          color={colors.textSecondary}
          textAlign="center"
          marginVertical={16}
        />
      ) : (
        people.slice(0, MAX_ROWS).map((u) => (
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
        ))
      )}
    </View>
  );
};

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
