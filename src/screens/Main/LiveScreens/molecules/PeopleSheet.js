import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useMemo, useState } from "react";
import {ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View} from "react-native";
import { BlurView } from "@react-native-community/blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const getUserId = (user) => String(user?._id ?? user?.id ?? "").trim();

const getDisplayName = (user) =>
  user?.profile?.displayName ||
  user?.displayName ||
  user?.name ||
  user?.fullName ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  "Display Name";

const getUsername = (user) =>
  user?.username ||
  String(getDisplayName(user) || "username")
    .toLowerCase()
    .replace(/\s+/g, "");

const getAvatar = (user) =>
  user?.profile?.avatar ||
  user?.avatar ||
  user?.profileImage ||
  user?.image ||
  null;

const PeopleSheet = ({
  sheetRef,
  title,
  people,
  loading,
  onClose,
  onSheetIndexChange,
  onProfilePress,
  onMessagePress,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const filteredPeople = useMemo(() => {
    const list = Array.isArray(people) ? people : [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((user) => {
      const displayName = getDisplayName(user).toLowerCase();
      const username = getUsername(user).toLowerCase();
      return displayName.includes(q) || username.includes(q);
    });
  }, [people, query]);

  const snapPoints = useMemo(() => ["42%", "72%"], []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={1}
        style={[props.style, styles.backdropContainer]}
      >
        {Platform.OS !== "web" ? (
          <>
            <BlurView
              blurType={isDark ? "dark" : "light"}
              blurAmount={10}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(0, 0, 0, 0.64)"
                    : "rgba(0, 0, 0, 0.32)",
                },
              ]}
            />
          </>
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.64)"
                  : "rgba(0, 0, 0, 0.32)",
              },
            ]}
          />
        )}
      </BottomSheetBackdrop>
    ),
    [isDark],
  );

  const renderItem = ({ item }) => {
    const avatar = getAvatar(item);
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.personRow}
        onPress={() => onProfilePress?.(item)}
      >
        <Image
          source={
            typeof avatar === "string" && avatar
              ? { uri: avatar }
              : Images.userIcon
          }
          style={[styles.avatar, { backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(18, 18, 18, 0.08)" }]}
        />
        <View style={styles.personMeta}>
          <Text style={[styles.personName, { color: isDark ? COLORS.white : colors.text }]} numberOfLines={1}>
            {getDisplayName(item)}
          </Text>
          <Text style={[styles.personUsername, { color: isDark ? "rgba(255,255,255,0.56)" : colors.textSecondary }]} numberOfLines={1}>
            @{getUsername(item)}
          </Text>
        </View>
        {onMessagePress ? (
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.messageBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.surfaceAlt }]}
            onPress={() => onMessagePress(item)}
          >
            <Icons
              family="Feather"
              name="message-circle"
              size={18}
              color={isDark ? COLORS.white : colors.text}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      handleComponent={null}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheetBackground, { backgroundColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(18, 18, 18, 0.08)" }]}
      containerStyle={[styles.container, { marginBottom: -10 }]}
      onChange={(index) => {
        onSheetIndexChange?.(index);
        if (index === -1) {
          Keyboard.dismiss();
          setQuery("");
          onClose?.();
        }
      }}
    >
      <View style={[styles.content, { paddingBottom: insets.bottom + 12, backgroundColor: isDark ? COLORS.black : colors.surface }]}>
        <View style={styles.header}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(18, 18, 18, 0.05)" }]}>
            <Icons
              family="Feather"
              name="search"
              size={18}
              color={isDark ? "rgba(255,255,255,0.64)" : colors.textSecondary}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search..."
              placeholderTextColor={isDark ? "rgba(255,255,255,0.48)" : "rgba(18, 18, 18, 0.48)"}
              style={[styles.searchInput, { color: isDark ? COLORS.white : colors.text }]}
              onFocus={() => sheetRef?.current?.snapToIndex?.(1)}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Icons
                  family="Feather"
                  name="x"
                  size={16}
                  color={isDark ? "rgba(255,255,255,0.64)" : colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.closeBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(18, 18, 18, 0.05)" }]}
            onPress={() => sheetRef?.current?.close?.()}
          >
            <Icons
              family="MaterialCommunityIcons"
              name="window-close"
              size={18}
              color={isDark ? "rgba(255,255,255,0.72)" : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: isDark ? "rgba(255,255,255,0.64)" : colors.textSecondary }]}>{title || "SEEN BY"}</Text>
          <Text style={[styles.count, { color: isDark ? COLORS.white : colors.text }]}>{filteredPeople.length}</Text>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={isDark ? COLORS.white : COLORS.red1} />
          </View>
        ) : (
          <FlashList
            data={filteredPeople}
            renderItem={renderItem}
            keyExtractor={(item, index) => getUserId(item) || `person-${index}`}
            estimatedItemSize={72}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: isDark ? "rgba(255,255,255,0.64)" : colors.textSecondary }]}>No results found</Text>
              </View>
            }
          />
        )}
      </View>
    </BottomSheet>
  );
};

export default PeopleSheet;

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    marginHorizontal: 10,
  },
  backdropContainer: {
    backgroundColor: "transparent",
  },
  backdropDim: {
    // backgroundColor: "rgba(0,0,0,0.64)",
  },
  sheetBackground: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 32,
  },
  content: {
    flex: 1,
    margin: 5,
    padding: 12,
    borderRadius: 28,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  closeBtn: {
    height: 40,
    width: 40,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  title: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  count: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  listContent: {
    paddingBottom: 20,
  },
  personRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  personMeta: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  personName: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  personUsername: {
    color: "rgba(255,255,255,0.56)",
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  messageBtn: {
    height: 36,
    width: 36,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 15,
    fontFamily: fonts.medium,
  },
});
