import { BlurView } from "@react-native-community/blur";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { useTheme } from "../../../../contexts/ThemeContext";
import { post } from "../../../../services/ApiRequest";
import { setNewFollower } from "../../../../store/reducer/NotiSlice";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import UserBadge from "../../../../components/UserBadge";

/**
 * Figma `Home-Feed` (moments state), section under the header:
 *  - NEW FOLLOWER toast: 351×60, r20, fill white 16% + 1px inside stroke #121212 16%,
 *    background blur, inner row pad 12/16 gap 10: 32px avatar · NEW FOLLOWER
 *    (Medium 10, −0.5%, 48%) / Name (Medium 14, −0.5%, white) + badge · 32px
 *    circles (person_add, close)
 *  - composer: 40 tall r100 white 4%, pad 12/4, gap 8: 👋 + "Hey! What's new…?"
 *    (Medium 14, 48%) · 3 × 40px circles (camera, poll, mic) gap 10
 */
const CIRCLE = 40;

const CircleButton = ({ name, onPress, size = CIRCLE, iconSize = 20, filled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        height: size,
        width: size,
        borderRadius: 99,
        backgroundColor: colors.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icons
        family={filled ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"}
        name={name}
        size={iconSize}
        color={COLORS.white}
      />
    </TouchableOpacity>
  );
};

const NewFollowerToast = ({ follower, onDismiss }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const [busy, setBusy] = useState(false);
  const user = follower?.user || follower;
  const userId = user?._id || user?.userId;
  const name =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username ||
    "New follower";
  const alreadyFollowing = (userData?.stats?.following || []).includes(userId);

  const followBack = useCallback(async () => {
    if (!userId || busy || alreadyFollowing) return;
    setBusy(true);
    try {
      await post(`relationships/follow/${userId}`);
      ToastMessage(`You are now following ${user?.firstName || name}`, "success");
      dispatch(setNewFollower(null));
    } catch (e) {
      ToastMessage("Could not follow back", "error");
    } finally {
      setBusy(false);
    }
  }, [userId, busy, alreadyFollowing, user?.firstName, name, dispatch]);

  if (!userId) return null;

  return (
    <View style={styles.toastOuter}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={12}
        reducedTransparencyFallbackColor="#1E1E1E"
      />
      <View style={styles.toastInner}>
        {user?.profile?.avatar ? (
          <ImageFast source={{ uri: user.profile.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: user?.profile?.profileColor || COLORS.gray3 },
            ]}
          />
        )}
        <View style={{ flex: 1 }}>
          <CustomText
            label="NEW FOLLOWER"
            fontSize={10}
            lineHeight={14}
            letterSpacing={-0.05}
            fontFamily={fonts.medium}
            color={COLORS.gray48}
          />
          <View style={styles.row}>
            <CustomText
              label={name}
              fontSize={14}
              lineHeight={18}
              letterSpacing={-0.07}
              fontFamily={fonts.medium}
              color={COLORS.white}
              numberOfLines={1}
              containerStyle={{ flexShrink: 1 }}
            />
            <UserBadge user={user} size={16} style={{ marginLeft: 4 }} />
          </View>
        </View>
        <CircleButton
          name={alreadyFollowing ? "how_to_reg" : "person_add"}
          filled
          size={32}
          iconSize={18}
          onPress={followBack}
        />
        <CircleButton name="close" size={32} iconSize={18} onPress={onDismiss} />
      </View>
    </View>
  );
};

const FeedComposerRow = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const newFollower = useSelector((state) => state.notification.newFollower);

  return (
    <View style={[styles.section, { backgroundColor: colors.background }]}>
      {newFollower ? (
        <NewFollowerToast
          follower={newFollower}
          onDismiss={() => dispatch(setNewFollower(null))}
        />
      ) : null}

      <View style={styles.composerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("CreatePost")}
          style={[styles.composer, { backgroundColor: colors.surfaceAlt }]}
        >
          <View style={styles.wave}>
            <Icons
              family="MaterialSymbolsRoundedFilled"
              name="waving_hand"
              size={14}
              color="#121212"
            />
          </View>
          <CustomText
            label={"Hey! What’s new…?"}
            fontSize={14}
            lineHeight={18}
            fontFamily={fonts.medium}
            color={COLORS.gray48}
            marginLeft={8}
            numberOfLines={1}
          />
        </TouchableOpacity>
        <CircleButton
          name="photo_camera"
          filled
          onPress={() => navigation.navigate("CameraScreen")}
        />
        <CircleButton
          name="ballot"
          filled
          onPress={() => navigation.navigate("CreatePost", { postType: "poll" })}
        />
        <CircleButton
          name="mic"
          filled
          onPress={() => navigation.navigate("CreateAudio")}
        />
      </View>
    </View>
  );
};

export default FeedComposerRow;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  row: { flexDirection: "row", alignItems: "center" },
  toastOuter: {
    borderRadius: 20,
    padding: 4,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(18, 18, 18, 0.16)",
    overflow: "hidden",
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(18, 18, 18, 0.72)",
  },
  avatar: { height: 32, width: 32, borderRadius: 99 },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  composer: {
    flex: 1,
    height: CIRCLE,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 4,
  },
  wave: {
    height: 24,
    width: 24,
    borderRadius: 99,
    backgroundColor: "#F2E9D6",
    alignItems: "center",
    justifyContent: "center",
  },
});
