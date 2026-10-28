import { StackActions, useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import CustomText from "../../../../components/CustomText";
import {
  ScreenHeaderSpacer,
  useScreenHeaderInset,
} from "../../../../components/ScreenWrapper";
import TopTab from "../../../../components/TopTab";

import { openPagerTab } from "../../../../navigation/TabStack";
import LockInfo from "../../Profile/molecules/LockInfo";
import SearchCard from "./SearchCard";
import SearchCardSkeleton from "./SearchCardSkeleton";

import fonts from "../../../../assets/fonts";
import { Matching } from "../../../../assets/svgs";
import { del, get, post } from "../../../../services/ApiRequest";
import AnimatedListItem from "../../../../utils/AnimatedListItem";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";
import { useTheme } from "../../../../contexts/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Signed-in user's own lists vs. another user's (opened from their profile:
// only their Followers / Following, privacy enforced by the backend).
const OWN_TABS = [
  { key: "recommended", label: "Recommended", endpoint: "relationships/recommended" },
  { key: "requests", label: "Requests", endpoint: "relationships/requests" },
  { key: "followers", label: "Followers", endpoint: "relationships/followers" },
  { key: "following", label: "Following", endpoint: "relationships/following" },
  { key: "friends", label: "Friends", endpoint: "relationships/friends" },
];
const OTHER_USER_TABS = OWN_TABS.filter(
  (t) => t.key === "followers" || t.key === "following",
);

const PeopleTab = ({
  searchQuery,
  activeTab,
  isActive,
  initialPeopleTab, // "followers" | "following" | …
  targetUserId, // set → show this user's lists instead of mine
}) => {
  const TABS = targetUserId ? OTHER_USER_TABS : OWN_TABS;
  const { colors, isDark } = useTheme();
  const headerInset = useScreenHeaderInset();
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const userData = useSelector((state) => state.users.userData);
  const [tab, setTab] = useState(() =>
    Math.max(
      TABS.findIndex((t) => t.key === initialPeopleTab),
      0,
    ),
  );
  const [locked, setLocked] = useState(false); // private account, not allowed
  const [users, setAllUsers] = useState([]);
  const [localFollowState, setLocalFollowState] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState({ id: null, type: null }); // { id: userId, type: 'accept' | 'reject' }

  const getUsers = async (
    selectedTab = tab,
    query = searchQuery,
    isRefresh = false,
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLocalFollowState({});
      const tabDef = TABS[selectedTab] || TABS[0];
      let endpoint = tabDef.endpoint;
      if (targetUserId) {
        endpoint += `?userId=${targetUserId}`;
      }

      if (query) {
        endpoint += `${endpoint.includes("?") ? "&" : "?"}searchQuery=${query}`;
      }

      const response = await get(endpoint);
      const fetchedUsers = response.data?.data?.users || [];
      setLocked(!!response.data?.data?.locked);

      // Filter for Recommended tab: exclude users already followed
      const filteredUsers =
        tabDef.key === "recommended"
          ? fetchedUsers.filter(
              (u) => !u?.stats?.followers?.includes(userData?._id),
            )
          : fetchedUsers;
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isActive || isFocus) {
      getUsers(tab, searchQuery);
    }
  }, [isActive, isFocus, tab, searchQuery]);

  const handleFollow = async (userId, name = "User") => {
    try {
      setLocalFollowState((prev) => ({ ...prev, [userId]: true }));
      const res = await post(`relationships/follow/${userId}`);
      console.log("follow----", res.data);

      ToastMessage(res.data?.message, "success");
    } catch (error) {
      console.error("Error following user:", error);
      setLocalFollowState((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId, name = "User") => {
    try {
      setLocalFollowState((prev) => ({ ...prev, [userId]: false }));
      const res = await del(`relationships/unfollow/${userId}`);
      console.log("del----", res.data);

      ToastMessage(`Unfollowed ${name}`);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setLocalFollowState((prev) => ({ ...prev, [userId]: true }));
    }
  };

  const handleAcceptRequest = async (userId, name = "User") => {
    try {
      setProcessing({ id: userId, type: "accept" });
      const res = await post(`relationships/accept/${userId}`);
      console.log("accept----", res.data);
      if (res.data?.success) {
        setAllUsers((prev) => prev.filter((u) => u._id !== userId));
        ToastMessage(`Accepted request from ${name}`, "success");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setProcessing({ id: null, type: null });
    }
  };

  const handleRejectRequest = async (userId, name = "User") => {
    try {
      setProcessing({ id: userId, type: "reject" });
      const res = await del(`relationships/reject/${userId}`);
      console.log("reject----", res.data);
      if (res.data?.success) {
        setAllUsers((prev) => prev.filter((u) => u._id !== userId));
        ToastMessage(`Rejected request from ${name}`);
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    } finally {
      setProcessing({ id: null, type: null });
    }
  };

  const isFollowing = (user) => {
    const userId = user?._id;
    if (localFollowState[userId] !== undefined) {
      return localFollowState[userId];
    }
    return user?.stats?.followers?.includes(userData?._id) || false;
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={loading ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : users}
        refreshControl={
          <RefreshControl
            onRefresh={() => getUsers(tab, searchQuery, true)}
            refreshing={refreshing}
            progressViewOffset={headerInset}
            tintColor={isDark ? COLORS.white : colors.text}
          />
        }
        keyExtractor={(item) => item?._id?.toString()}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        // starts below the floating blurred header; the tabs scroll under it
        ListHeaderComponent={
          <>
            <ScreenHeaderSpacer />
            <View>
              <TopTab
                rounded
                tab={tab}
                setTab={setTab}
                tabNames={TABS.map((t) => t.label)}
                marginBottom={12}
                activeColor={isDark ? COLORS.white : colors.text}
                inactiveTintColor={isDark ? COLORS.gray64 : colors.textSecondary}
                borderRadius={99}
                height={32}
                scrollToActive
              />

              {/* <CustomText
                label={
                  tab === 0
                    ? "Recommended"
                    : tab === 1
                    ? "Followers"
                    : tab === 2
                    ? "Following"
                    : "Friends"
                }
                fontFamily={fonts.medium}
                fontSize={16}
                marginBottom={8}
              /> */}
            </View>
          </>
        }
        renderItem={({ item, index }) =>
          loading ? (
            <SearchCardSkeleton key={index} isChange />
          ) : (
            <AnimatedListItem index={index}>
              <SearchCard
                isChange
                user={item}
                following={isFollowing(item)}
                isRequestsTab={TABS[tab]?.key === "requests"}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                isAccepting={
                  processing.id === item?._id && processing.type === "accept"
                }
                isRejecting={
                  processing.id === item?._id && processing.type === "reject"
                }
                isSelf={item?._id === userData?._id}
                onPress={() => {
                  // My own row → the Profile tab of the bottom bar, not a
                  // second copy of my profile
                  if (item?._id && item._id === userData?._id) {
                    // v7: navigate("TabStack") would push a new copy (opening
                    // on Home); popTo returns to the existing one
                    navigation.dispatch(StackActions.popTo("TabStack"));
                    openPagerTab("Profile");
                    return;
                  }
                  navigation.navigate("UserProfile", { userId: item?._id });
                }}
              />
            </AnimatedListItem>
          )
        }
        ListEmptyComponent={
          !loading &&
          (locked ? (
            <LockInfo />
          ) : (
            <View style={styles.emptyContainer}>
              <Matching
                height={80}
                width={80}
                color={isDark ? COLORS.gray64 : colors.iconMuted}
              />
              <CustomText
                label="No People"
                fontSize={32}
                fontFamily={fonts.BoldItalic}
                color={colors.text}
                marginTop={12}
                fontStyle={"italic"}
              />
              <CustomText
                label="There are no people right now."
                fontFamily={fonts.medium}
                color={isDark ? COLORS.gray48 : colors.textSecondary}
              />
            </View>
          ))
        }
      />
    </View>
  );
};

export default PeopleTab;

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  emptyContainer: {
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
});
