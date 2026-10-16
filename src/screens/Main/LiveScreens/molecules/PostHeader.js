import colors from "@/constants/colors";
import fonts from "../../../../assets/fonts";
import { User } from "@/types";
import { formatInstagramTime } from "@/utils/constants";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { ChevronLeft, MoreVertical } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {DeviceEventEmitter,
  Image,
  StyleSheet,
  TouchableOpacity,
  View} from "react-native";
import { useSelector } from "react-redux";
import AnimatedCircle from "./AnimatedCircle";
import CustomText from "./CustomText";
import EditBottomSheet, { EditBottomSheetRef } from "./EditBottomSheet";
import ExpoIcons from "./ExpoIcons";
import ViewsCard from "./ViewsCard";
import Text from "../../../../components/ScaledText";

const formatMMSS = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
};

interface HeaderProps {
  user?: User;
  item?: any;
  showFullUI?: boolean;
  onFollow?: () => void;
  onViewsPress?: () => void;
  handleMorePress?: () => void;
  isEpisode?: boolean;
  onBack?: () => void;
  showDots?: boolean;
  isLandscape?: boolean;
  /** When true, Viral watermark is rendered externally (e.g. EpisodePlayerView) for exact positioning */
  hideViralWatermark?: boolean;
  /** When true, show viewer count with "viewers" label and live card style (#EE1045) */
  isLive?: boolean;
  headerTopMargin?: number;
}

const PostHeader: React.FC<HeaderProps> = ({
  item,
  user,
  onFollow,
  showFullUI,
  onViewsPress,
  handleMorePress,
  isEpisode,
  onBack,
  hideViralWatermark,
  showDots = true,
  isLandscape = false,
  isLive = false,
  headerTopMargin,
}) => {
  const router = useRouter();
  const editSheetRef = useRef<EditBottomSheetRef | null>(null);
  const [tick, setTick] = useState(0);

  const userData: any = useSelector((state: any) => state?.users?.userData);
  const currentUserId = userData?.user?._id;

  const isFollowing = user?.stats?.followers?.includes(currentUserId) || false;

  useEffect(() => {
    if (!isLive) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(
      () => {
        setTick((t) => t + 1);
        intervalId = setInterval(() => setTick((t) => t + 1), 1000);
      },
      1000 - (Date.now() % 1000),
    );

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive]);

  const liveTimeLabel = useMemo(() => {
    const createdAt = item?.createdAt;
    const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
    if (!createdMs || Number.isNaN(createdMs)) return "00:00";
    const totalSeconds =
      typeof item?.liveTotalSeconds === "number"
        ? item.liveTotalSeconds
        : 45 * 60 + 10;
    const endMs = createdMs + totalSeconds * 1000;
    const remainingSeconds = Math.max(
      0,
      Math.ceil((endMs - Date.now()) / 1000),
    );
    return formatMMSS(remainingSeconds);
  }, [item?.createdAt, item?.liveTotalSeconds, tick]);

  const handleProfilePress = (e?: any) => {
    if (e) e.stopPropagation();
    const targetUserId = item?.userId || item?._id;
    if (currentUserId && currentUserId === targetUserId) {
      DeviceEventEmitter.emit("GO_TO_PROFILE_TAB");
      router.navigate("/(tabs)" as any);
      return;
    }
    router.push({
      pathname: "/profile/[userId]" as any,
      params: {
        userId: targetUserId,
        userData: JSON.stringify(user || {}),
      },
    });
  };

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: showFullUI && !isLandscape ? 56 : 12,
          marginTop: headerTopMargin,
        },
      ]}
    >
      <View style={styles.headerRow}>
        {showFullUI && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              if (isLandscape) {
                await ScreenOrientation.lockAsync(
                  ScreenOrientation.OrientationLock.PORTRAIT_UP,
                );
              } else {
                onBack ? onBack() : router.back();
              }
            }}
          >
            <BlurView intensity={16} tint="light" style={styles.iconBlur}>
              <ChevronLeft color="#FFFFFF" size={24} />
            </BlurView>
          </TouchableOpacity>
        )}
        {isEpisode ? (
          <View style={{ width: "75%" }}>
            <CustomText
              label={item?.title}
              fontFamily={Fonts.medium}
              color={colors.white}
            />
            <CustomText
              label={`E${item?.episodeNumber || 0} S${item?.seasonNumber || 0}`}
              color="#FFFFFF7A"
            />
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerLeft}
            onPress={handleProfilePress}
          >
            <AnimatedCircle size={47} strokeWidth={3} gap={2} duration={2000}>
              {user?.profile?.avatar ? (
                <Image
                  style={styles.avatar}
                  source={{ uri: user?.profile?.avatar }}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: user?.profile?.profileColor || "#FDFD97",
                    },
                  ]}
                />
              )}
            </AnimatedCircle>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {user?.name || user?.username || "Advertiser"}
                </Text>

                {user?.profile?.isVerified ? (
                  <ExpoIcons
                    size={14}
                    name="verified"
                    color="#007BFF"
                    family="MaterialIcons"
                  />
                ) : null}
              </View>
              <Text style={styles.time}>
                {user?.username || "user"}
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  {" "}
                  • {formatInstagramTime(item?.createdAt)}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.headerRight}>
          {currentUserId !== item?.userId && !isEpisode && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={onFollow}
            >
              <Text
                style={[styles.followText, isFollowing && styles.followingText]}
              >
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
          {showDots && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                // editSheetRef.current?.present();
                handleMorePress && handleMorePress();
              }}
            >
              <BlurView intensity={16} tint="dark" style={styles.blurBtnInner}>
                <MoreVertical color="#FFFFFFA3" size={20} />
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <EditBottomSheet
        ref={editSheetRef}
        user={user}
        item={item}
        displayName={user?.name || user?.username || "Advertiser"}
        username={user?.username || "user"}
        postCaption={[item?.caption || ""]}
        isOwner={currentUserId === item?.userId}
        onDeletePress={() => {
          editSheetRef.current?.dismiss();
          DeviceEventEmitter.emit("REFRESH_FEED");
        }}
        onEditPress={() => {
          editSheetRef.current?.dismiss();
          const mediaUri =
            item?.images?.[0] ||
            (item as any)?.videoUrl ||
            (item as any)?.video ||
            "";
          const mediaType =
            (item as any)?.videoUrl || (item as any)?.video ? "video" : "image";
          router.push({
            pathname: "/PublishStory/publish-story",
            params: {
              mediaUri,
              mediaType,
              postType: "reel", // or "story" based on your logic
              editData: JSON.stringify(item),
            },
          });
        }}
        onReschedulePress={() => {
          editSheetRef.current?.dismiss();
        }}
      />

      {isEpisode ? (
        <View style={styles.episodeInfo}>
          <CustomText
            label={item?.showName}
            fontFamily={Fonts.italiana}
            fontSize={28}
            color="#fff"
          />
          {!hideViralWatermark && (
            <CustomText
              label="Viral."
              fontFamily={fonts.semiBoldItalic}
              fontSize={24}
              color="#FFFFFFA3"
            />
          )}
        </View>
      ) : isLive && (item?.stats?.viewers > 0 || item?.stats?.views > 0) ? (
        <View style={styles.liveMetaRow}>
          <ViewsCard
            views={item?.stats?.viewers ?? item?.stats?.views ?? 0}
            onPress={onViewsPress}
            isLive
          />
          <View style={styles.liveTimePill}>
            <Text style={styles.liveTimeText}>{liveTimeLabel}</Text>
          </View>
        </View>
      ) : !isLive && item?.stats?.views > 0 ? (
        <ViewsCard
          views={item?.stats?.views || item?.views || 0}
          onPress={onViewsPress}
        />
      ) : null}
    </View>
  );
};

export default PostHeader;

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 12,
    zIndex: 1000,
  },
  blurBtnInner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 100,
    width: 40,
    height: 40,
    overflow: "hidden",
  },
  liveMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveTimePill: {
    backgroundColor: "#EE1045",
    borderRadius: 100,
    height: 28,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  liveTimeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    overflow: "hidden",
    marginRight: 5,
  },
  iconBlur: {
    flex: 1,
    // backgroundColor: "rgba(255, 255, 255, 0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconInner: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 100,
    backgroundColor: "#333",
  },
  userInfo: {
    justifyContent: "center",
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    lineHeight: 14 * 1.4,
  },
  time: {
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.13,
    lineHeight: 12 * 1.4,
    color: "rgba(255, 255, 255, 0.64)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followButton: {
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  followText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121212",
    fontFamily: Fonts.medium,
    lineHeight: 14 * 1.4,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF29",
  },
  followingText: {
    color: "#FFFFFF",
  },
  moreButton: {
    // width: 40,
    // height: 40,
    borderRadius: 100,
    overflow: "hidden",
  },
  episodeInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
