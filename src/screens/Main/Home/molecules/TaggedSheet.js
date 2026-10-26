import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet, {
  SheetActions,
  SheetPrimaryButton,
  SheetSectionLabel,
} from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { post } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import UserBadge from "../../../../components/UserBadge";

/**
 * Figma "Tagged" — "See who's tagged in this post" with SPONSORS and
 * COLLABORATORS sections. Row: 40px avatar · Display Name + badges ·
 * username chip / "Job • followers 👥" · 40px "+" (follow). "+" marks
 * people, Confirm follows the marked ones, Reset All clears the marks.
 */
const PersonRow = ({ user, marked, following, onToggle, isFirst, isLast }) => {
  const { colors } = useTheme();
  const name =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    "User";
  const job = user?.occupation?.jobTitle || user?.industry?.[0] || "";
  const followers = user?.followersCount ?? user?.stats?.followers?.length ?? 0;
  const isCompany = user?.role === "company";

  return (
    <View
      style={[
        styles.row,
        // Figma: line between rows only, none after the last one
        isLast
          ? { borderBottomWidth: 0, paddingBottom: 0 }
          : { borderBottomColor: colors.surfaceAlt },
        // Figma: rows are 40pt; 8 · 1px line · 8 between them, nothing
        // above the first or below the last (label cap → avatar = 19)
        isFirst && { paddingTop: 0, marginTop: -2 },
      ]}
    >
      {user?.profile?.avatar ? (
        <ImageFast
          source={{ uri: user.profile.avatar }}
          style={[styles.avatar, isCompany && { borderRadius: 8 }]}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            isCompany && { borderRadius: 8 },
            { backgroundColor: user?.profile?.profileColor || COLORS.gray3 },
          ]}
        />
      )}
      <View style={{ flex: 1, marginLeft: 8, marginRight: 16 }}>
        <View style={styles.nameRow}>
          {/* Figma: Medium 16 / −0.5px white */}
          <CustomText
            label={name}
            fontSize={16}
            lineHeight={20}
            letterSpacing={-0.5}
            fontFamily={fonts.medium}
            color={colors.text}
            numberOfLines={1}
            containerStyle={{ flexShrink: 1 }}
          />
          <UserBadge user={user} style={{ marginLeft: 4 }} />
          {user?.username ? (
            <View style={[styles.usernameChip, { backgroundColor: colors.surfaceAlt }]}>
              {/* Figma: Regular 10 / 10 / 0%, centred, @64% */}
              <CustomText
                label={user.username}
                fontSize={10}
                lineHeight={12}
                textAlign="center"
                color={COLORS.gray64}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          {job ? (
            <CustomText
              label={`${job} • `}
              fontSize={14}
              color={COLORS.gray48}
            />
          ) : null}
          <CustomText
            label={String(followers)}
            fontSize={14}
            color={COLORS.gray48}
          />
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="group"
            size={14}
            color={COLORS.gray48}
            style={{ marginLeft: 2 }}
          />
        </View>
      </View>
      {!following ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggle}
          style={[
            styles.plus,
            { backgroundColor: marked ? COLORS.white : colors.surfaceAlt },
          ]}
        >
          <Icons
            family="MaterialSymbolsRounded"
            name={marked ? "check" : "add"}
            size={18}
            color={marked ? "#121212" : colors.text}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const TaggedSheet = ({ visible, onDismiss, sponsors = [], collaborators = [] }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const following = userData?.stats?.following || [];
  const [marked, setMarked] = useState([]);

  useEffect(() => {
    if (visible) setMarked([]);
  }, [visible]);

  const toggle = (id) =>
    setMarked((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const confirm = async () => {
    const ids = marked.filter((id) => id && id !== userData?._id);
    onDismiss?.();
    if (!ids.length) return;
    try {
      await Promise.all(ids.map((id) => post(`relationships/follow/${id}`)));
      dispatch(
        setUserData({
          ...userData,
          stats: {
            ...userData?.stats,
            following: Array.from(new Set([...following, ...ids])),
          },
        }),
      );
      ToastMessage(
        ids.length === 1 ? "Followed" : `Followed ${ids.length} people`,
        "success",
      );
    } catch (e) {
      ToastMessage("Could not follow", "error");
    }
  };

  const section = (label, list) =>
    list.length ? (
      <View key={label}>
        <SheetSectionLabel label={label} />
        {list.map((u, i) => (
          <PersonRow
            key={u?._id}
            isFirst={i === 0}
            isLast={i === list.length - 1}
            user={u}
            marked={marked.includes(u?._id)}
            following={following.includes(u?._id) || u?._id === userData?._id}
            onToggle={() => toggle(u?._id)}
          />
        ))}
      </View>
    ) : null;

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      title="Tagged"
      subtitle={"See who’s tagged in this post"}
    >
      <ScrollView
        style={{ maxHeight: 480 }}
        // Figma: last avatar → next section label cap = 23
        contentContainerStyle={{ gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {section("SPONSORS", sponsors)}
        {section("COLLABORATORS", collaborators)}
      </ScrollView>
      {/* Figma: last row → buttons 23 */}
      <View style={{ marginTop: 2 }}>
        <SheetActions onReset={() => setMarked([])} onConfirm={confirm} />
      </View>
    </FloatingSheet>
  );
};

/**
 * Figma "Follow-Button" (node 7574-12179): same glass sheet and rows as
 * "Tagged" — "Follow" / "Select who you want to follow", CREATOR and
 * COLLABORATORS sections, a 40px "+" per person that follows them right away,
 * and a full-width white "Follow All" button.
 */
export const FollowSheet = ({
  visible,
  onDismiss,
  creator,
  collaborators = [],
}) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const following = userData?.stats?.following || [];
  const [busy, setBusy] = useState(false);

  const isFollowing = (id) =>
    following.map(String).includes(String(id)) ||
    String(id) === String(userData?._id);

  const addFollowing = (ids) =>
    dispatch(
      setUserData({
        ...userData,
        stats: {
          ...userData?.stats,
          following: Array.from(new Set([...following, ...ids])),
        },
      }),
    );

  const followOne = async (u) => {
    const id = u?._id;
    if (!id || isFollowing(id)) return;
    addFollowing([id]);
    try {
      await post(`relationships/follow/${id}`);
      ToastMessage(
        `You are now following ${u?.firstName || u?.username || "User"}`,
        "success",
      );
    } catch (e) {
      dispatch(setUserData(userData));
      ToastMessage("Could not follow", "error");
    }
  };

  const people = [creator, ...collaborators].filter(Boolean);

  const followAll = async () => {
    if (busy) return;
    const ids = Array.from(
      new Set(people.map((u) => u?._id).filter((id) => id && !isFollowing(id))),
    );
    onDismiss?.();
    if (!ids.length) return;
    setBusy(true);
    addFollowing(ids);
    try {
      await Promise.all(ids.map((id) => post(`relationships/follow/${id}`)));
      ToastMessage(
        ids.length === 1 ? "Followed" : `Followed ${ids.length} people`,
        "success",
      );
    } catch (e) {
      dispatch(setUserData(userData));
      ToastMessage("Could not follow", "error");
    } finally {
      setBusy(false);
    }
  };

  const section = (label, list) =>
    list.length ? (
      <View key={label}>
        <SheetSectionLabel label={label} />
        {list.map((u, i) => (
          <PersonRow
            key={u?._id || i}
            isFirst={i === 0}
            isLast={i === list.length - 1}
            user={u}
            // followed people keep the button, filled white with a check
            marked={isFollowing(u?._id)}
            following={String(u?._id) === String(userData?._id)}
            onToggle={() => followOne(u)}
          />
        ))}
      </View>
    ) : null;

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      title="Follow"
      subtitle="Select who you want to follow"
    >
      <ScrollView
        style={{ maxHeight: 480 }}
        // Figma: last avatar → next section label cap = 23
        contentContainerStyle={{ gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {section("CREATOR", creator ? [creator] : [])}
        {section("COLLABORATORS", collaborators)}
      </ScrollView>
      {/* Figma: last row → button 23, full-width white h48 r100 */}
      <View style={{ marginTop: 2 }}>
        <SheetPrimaryButton
          label="Follow All"
          onPress={followAll}
          disabled={busy}
        />
      </View>
    </FloatingSheet>
  );
};

export default TaggedSheet;

const styles = StyleSheet.create({
  // Figma: avatar 40 · 8 · info (hug) · 16 · 40px "+" ; rows split by a 1px line
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 100 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  // Figma: hug × 16 (min), pad H4, r100, white 4%, 4 from the badges
  usernameChip: {
    marginLeft: 4,
    paddingHorizontal: 4,
    minHeight: 16,
    justifyContent: "center",
    borderRadius: 100,
  },
  metaRow: { flexDirection: "row", alignItems: "center" },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
