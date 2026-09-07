import { useIsFocused, useNavigation } from "@react-navigation/native";
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
import TopTab from "../../../../components/TopTab";

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

const PeopleTab = ({ searchQuery, activeTab, isActive }) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const userData = useSelector((state) => state.users.userData);
  const [tab, setTab] = useState(0);
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
      let endpoint = "";

      if (selectedTab === 0) {
        endpoint = "relationships/recommended";
      } else if (selectedTab === 1) {
        endpoint = "relationships/requests";
      } else if (selectedTab === 2) {
        endpoint = "relationships/followers";
      } else if (selectedTab === 3) {
        endpoint = "relationships/following";
      } else if (selectedTab === 4) {
        endpoint = "relationships/friends";
      }

      if (query) {
        endpoint += `${endpoint.includes("?") ? "&" : "?"}searchQuery=${query}`;
      }

      const response = await get(endpoint);
      const fetchedUsers = response.data?.data?.users || [];

      // Filter for Recommended tab: exclude users already followed
      const filteredUsers =
        selectedTab === 0
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
      <View style={{ paddingHorizontal: 12 }}>
        <TopTab
          rounded
          tab={tab}
          setTab={setTab}
          tabNames={[
            "Recommended",
            "Requests",
            "Followers",
            "Following",
            "Friends",
          ]}
          marginBottom={12}
          activeColor={isDark ? COLORS.white : colors.text}
          inactiveTintColor={isDark ? COLORS.gray64 : colors.textSecondary}
          borderRadius={99}
          height={32}
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

      <FlatList
        data={loading ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : users}
        refreshControl={
          <RefreshControl
            onRefresh={() => getUsers(tab, searchQuery, true)}
            refreshing={refreshing}
            tintColor={isDark ? COLORS.white : colors.text}
          />
        }
        keyExtractor={(item) => item?._id?.toString()}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        renderItem={({ item, index }) =>
          loading ? (
            <SearchCardSkeleton key={index} isChange />
          ) : (
            <AnimatedListItem index={index}>
              <SearchCard
                isChange
                user={item}
                following={isFollowing(item)}
                isRequestsTab={tab === 1}
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
                onPress={() =>
                  navigation.navigate("UserProfile", { userId: item?._id })
                }
              />
            </AnimatedListItem>
          )
        }
        ListEmptyComponent={
          !loading && (
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
          )
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
