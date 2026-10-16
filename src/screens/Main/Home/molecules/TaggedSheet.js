import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet, {
  SheetActions,
  SheetSectionLabel,
} from "../../../../components/FloatingSheet";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { post } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

/**
 * Figma "Tagged" — "See who's tagged in this post" with SPONSORS and
 * COLLABORATORS sections. Row: 40px avatar · Display Name + badges ·
 * username chip / "Job • followers 👥" · 40px "+" (follow). "+" marks
 * people, Confirm follows the marked ones, Reset All clears the marks.
 */
const PersonRow = ({ user, marked, following, onToggle }) => {
  const { colors } = useTheme();
  const name =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    "User";
  const job = user?.occupation?.jobTitle || user?.industry?.[0] || "";
  const followers = user?.followersCount ?? user?.stats?.followers?.length ?? 0;
  const isCompany = user?.role === "company";

  return (
    <View style={[styles.row, { borderBottomColor: colors.surfaceAlt }]}>
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
      <View style={{ flex: 1, marginLeft: 8 }}>
        <View style={styles.nameRow}>
          <CustomText
            label={name}
            fontSize={14}
            lineHeight={18}
            letterSpacing={-0.07}
            fontFamily={fonts.medium}
            color={colors.text}
            numberOfLines={1}
            containerStyle={{ flexShrink: 1 }}
          />
          {user?.role === "individual" || isCompany ? (
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="verified"
              size={14}
              color="#007BFF"
              style={{ marginLeft: 4 }}
            />
          ) : null}
          {user?.username ? (
            <View style={[styles.usernameChip, { backgroundColor: colors.surfaceAlt }]}>
              <CustomText
                label={user.username}
                fontSize={10}
                lineHeight={14}
                color={COLORS.gray64}
              />
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          {job ? (
            <CustomText
              label={`${job} • `}
              fontSize={12}
              lineHeight={16}
              color={COLORS.gray48}
            />
          ) : null}
          <CustomText
            label={String(followers)}
            fontSize={12}
            lineHeight={16}
            color={COLORS.gray48}
          />
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="group"
            size={12}
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
            size={20}
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
        {list.map((u) => (
          <PersonRow
            key={u?._id}
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
      <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
        {section("SPONSORS", sponsors)}
        {section("COLLABORATORS", collaborators)}
      </ScrollView>
      <SheetActions onReset={() => setMarked([])} onConfirm={confirm} />
    </FloatingSheet>
  );
};

export default TaggedSheet;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 40, height: 40, borderRadius: 100 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  usernameChip: {
    marginLeft: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  plus: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
