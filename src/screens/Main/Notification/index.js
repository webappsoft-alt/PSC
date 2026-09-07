import { useIsFocused } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useTheme } from "../../../contexts/ThemeContext";
import { get, post, put } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import NotificationCard from "./NotificationCard";
import { useSocket } from "../../../components/SocketProvider";
import { useDispatch } from "react-redux";
import { setNotificationDot } from "../../../store/reducer/NotiSlice";
import NotificationSkeleton from "./molecules/NotificationSkeleton";

const Notification = ({ navigation }) => {
  const socket = useSocket();
  const dispatch = useDispatch();
  const isFocus = useIsFocused();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const fetchNotifications = async (isLoading = true, isRefresh = true) => {
    if (!isRefresh && (!hasNextPage || isMoreLoading)) return;

    try {
      if (isRefresh) {
        setLoading(isLoading);
      } else {
        setIsMoreLoading(true);
      }

      const currentPage = isRefresh ? 1 : page + 1;
      const response = await get(`notification?page=${currentPage}&limit=300`);
      console.log(`res page ${currentPage}--`, response.data?.data);

      if (response?.data?.success) {
        const newData = response.data.data || [];
        if (isRefresh) {
          setNotifications(newData);
          setPage(1);
          setHasNextPage(newData.length === 20);
        } else {
          setNotifications((prev) => [...prev, ...newData]);
          setPage(currentPage);
          setHasNextPage(newData.length === 20);
        }
        dispatch(setNotificationDot(false));

        // Mark all as read after fetching (only on first page/refresh)
        if (isRefresh) {
          await put("notification/mark-as-read");
        }
      }
    } catch (error) {
      console.error("fetchNotifications error", error);
    } finally {
      setLoading(false);
      setIsMoreLoading(false);
    }
  };

  const handleNotificationPress = (item) => {
    const type = item?.type;
    console.log("type----->", type);

    if (type === "message") {
      navigation.navigate("InboxScreen", {
        recipientId: item?.senderId?._id,
        recipientName: `${item?.senderId?.firstName || ""} ${
          item?.senderId?.lastName || ""
        }`.trim(),
        otherUser: item?.senderId,
      });
    } else if (
      type === "comment" ||
      (type === "reaction" && item?.title == "New Reaction")
    ) {
      const postId = item?.action?.target?.split("/")?.pop();
      navigation.navigate("DetailPageWithId", { postId });
    } else if (type === "follow" || type === "matching") {
      navigation.navigate("UserProfile", { userId: item?.senderId?._id });
    } else if (type === "story") {
      const storyId = item?.action?.target?.split("/")?.pop();
      const isExpired = moment().diff(moment(item?.createdAt), "hours") >= 24;

      if (isExpired) {
        ToastMessage("Story expires", "error");
      } else {
        navigation.navigate("StoryViewerById", { storyId });
      }
    } else if (type === "reaction") {
      const storyId = item?.relatedEntities?.story?._id;
      navigation.navigate("StoryViewerById", { storyId });
    } else if (type === "request") {
      navigation.navigate("RequestsScreen");
    }
  };

  useEffect(() => {
    if (isFocus) {
      fetchNotifications();
    }
  }, [isFocus]);

  const groupedNotifications = useMemo(() => {
    const today = [];
    const yesterday = [];
    const more = [];

    notifications.forEach((item) => {
      const date = moment(item.createdAt);
      if (date.isSame(moment(), "day")) {
        today.push(item);
      } else if (date.isSame(moment().subtract(1, "day"), "day")) {
        yesterday.push(item);
      } else {
        more.push(item);
      }
    });

    return { today, yesterday, more };
  }, [notifications]);

  const checkNotificationSocket = () => {
    socket?.socket?.on("notification", (data) => {
      fetchNotifications(false, true);
    });
  };

  useEffect(() => {
    checkNotificationSocket();
  }, [socket]);

  return (
    <ScreenWrapper
      scrollEnabled
      paddingHorizontal={0.1}
      headerUnScrollable={() => <Header title="Notifications" />}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => fetchNotifications(true, true)}
        />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        if (isCloseToBottom) {
          fetchNotifications(false, false);
        }
      }}
    >
      <Divider thickness={4} marginTop={8} />

      {loading && notifications.length === 0 ? (
        <View style={{ marginTop: 8 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <NotificationSkeleton key={item} />
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText
            label="No new notifications"
            color={colors.textSecondary}
            fontSize={16}
            fontFamily={fonts.medium}
          />
        </View>
      ) : (
        <View>
          {groupedNotifications.today.length > 0 && (
            <>
              <CustomText
                label="Today"
                fontSize={18}
                marginBottom={12}
                lineHeight={18 * 1.4}
                fontFamily={fonts.medium}
                color={colors.text}
                textStyle={styles.sectionTitle}
              />
              {groupedNotifications?.today?.map((item) => (
                <NotificationCard
                  key={item._id}
                  item={item}
                  onPress={() => handleNotificationPress(item)}
                />
              ))}
              <Divider thickness={5} marginBottom={16} marginTop={10} />
            </>
          )}

          {groupedNotifications.yesterday.length > 0 && (
            <>
              <CustomText
                label="Yesterday"
                fontFamily={fonts.medium}
                fontSize={18}
                marginBottom={12}
                lineHeight={18 * 1.4}
                color={colors.text}
                textStyle={styles.sectionTitle}
              />
              {groupedNotifications.yesterday.map((item) => (
                <NotificationCard
                  key={item._id}
                  item={item}
                  onPress={() => handleNotificationPress(item)}
                />
              ))}
              <Divider thickness={5} marginBottom={16} marginTop={10} />
            </>
          )}

          {groupedNotifications.more.length > 0 && (
            <>
              <CustomText
                label="More Than 3 Days Ago"
                fontFamily={fonts.medium}
                fontSize={18}
                marginBottom={12}
                lineHeight={18 * 1.4}
                color={colors.text}
                textStyle={styles.sectionTitle}
              />
              {groupedNotifications.more.map((item) => (
                <NotificationCard
                  key={item._id}
                  item={item}
                  onPress={() => handleNotificationPress(item)}
                />
              ))}
            </>
          )}
          {isMoreLoading && (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={COLORS.buttonColor} />
            </View>
          )}
          <View style={{ height: 24 }} />
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 18,
    marginTop: 4,
  },
  backIcon: {
    backgroundColor: COLORS.cardColor,
    borderRadius: 99,
    padding: 10,
    marginRight: 8,
  },
  readAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardColor,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: "center",
  },
  allGoodBox: {
    backgroundColor: COLORS.buttonColor,
    marginBottom: 16,
    padding: 12,
    paddingTop: 6,
    borderTopColor: COLORS.lightGray,
    borderBottomColor: COLORS.lightGray,
  },

  allGoodContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.black,
    borderRadius: 12,
    // marginBottom: 12,
    padding: 12,
    gap: 12,
  },
  checkIcon: {
    width: 32,
    height: 32,
  },
  sectionTitle: {
    marginLeft: 12,
  },
});

export default Notification;
