import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SearchCard from "../../SearchScreen/molecules/SearchCard";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import BottomSheetComponent from "../../../../components/BottomSheetComponent";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import SearchInput from "../../../../components/SearchInput";
import TopTab from "../../../../components/TopTab";
import { COLORS } from "../../../../utils/COLORS";
import Header from "../../../../components/Header";
import { get, post, del } from "../../../../services/ApiRequest";
import { ToastMessage } from "../../../../utils/ToastMessage";

const { height: screenHeight } = Dimensions.get("window");

const Friends = () => {
  const isFocus = useIsFocused();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);
  const userData = useSelector((state) => state.users.userData);
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setAllUsers] = useState([]);
  const [localFollowState, setLocalFollowState] = useState({});
  const [loading, setLoading] = useState(false);

  const getUsers = async (selectedTab = tab, query = searchQuery) => {
    try {
      setLoading(true);
      // Clear local follow state when switching tabs or searching to sync with fresh data
      setLocalFollowState({});
      let endpoint = "";

      if (selectedTab === 0) {
        // Recommended
        endpoint = "relationships/recommended";
      } else if (selectedTab === 1) {
        // Followers
        endpoint = "relationships/followers";
      } else if (selectedTab === 2) {
        // Followings
        endpoint = "relationships/following";
      } else if (selectedTab === 3) {
        // BFFS
        endpoint = "relationships/bffs";
      }

      // Add searchQuery to URL if present
      if (query) {
        endpoint += `${endpoint.includes("?") ? "&" : "?"}searchQuery=${query}`;
      }

      const response = await get(endpoint);

      const fetchedUsers = response.data?.data?.users || [];

      setAllUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocus) {
      getUsers(tab, searchQuery);
    }
  }, [isFocus, tab]);

  // Handle search with debounce
  useEffect(() => {
    if (isFocus) {
      const delayDebounceFn = setTimeout(() => {
        getUsers(tab, searchQuery);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const handleFollow = async (userId, name = "User") => {
    try {
      // Optimistic update
      setLocalFollowState((prev) => ({ ...prev, [userId]: true }));

      await post(`relationships/follow/${userId}`);
      ToastMessage(`You are now following ${name}`, "success");
      // Refresh removed here to maintain local-only updates as requested
    } catch (error) {
      console.error("Error following user:", error);
      // Revert on error
      setLocalFollowState((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnfollow = async (userId, name = "User") => {
    try {
      // Optimistic update
      setLocalFollowState((prev) => ({ ...prev, [userId]: false }));

      await del(`relationships/unfollow/${userId}`);
      ToastMessage(`Unfollowed ${name}`);
      // Refresh removed here to maintain local-only updates as requested
    } catch (error) {
      console.error("Error unfollowing user:", error);
      // Revert on error
      setLocalFollowState((prev) => ({ ...prev, [userId]: true }));
    }
  };

  const isFollowing = (user) => {
    const userId = user?._id;

    // Check local state first for optimistic UI
    if (localFollowState[userId] !== undefined) {
      return localFollowState[userId];
    }

    // Check if current user's ID is in the user's followers array
    return user?.stats?.followers?.includes(userData?._id) || false;
  };

  const handleClose = () => {
    navigation.goBack();
  };

  useEffect(() => {
    setTimeout(() => {
      sheetRef.current?.snapToIndex(0);
    }, 300);
  }, []);

  const renderUserItem = ({ item }) => {
    return (
      <SearchCard
        isChange
        user={item}
        following={isFollowing(item)}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
      />
    );
  };

  return (
    <ScreenWrapper
      translucent
      paddingHorizontal={0.01}
      backgroundImage={Images.person} // Using mock background
      headerUnScrollable={() => (
        <>
          <View style={styles.overlay} />
          <View style={{ marginTop: insets.top }}>
            <Header title={"Friends"} />
            <TopTab
              rounded
              tab={tab}
              setTab={setTab}
              tabNames={["Recommended", "FOLLOWERS", "FOLLOWINGS", "BFFS"]}
              backgroundColor="transparent"
              activeColor={COLORS.white}
              inactiveTintColor={COLORS.white}
              borderRadius={99}
              height={32}
              scrollViewPaddingHorizontal={12}
            />
          </View>
        </>
      )}
    >
      {/* Bottom Sheet for Friends List */}
      <View style={styles.sheetWrapper}>
        <BottomSheetComponent
          ref={sheetRef}
          snapPoints={["85%"]}
          initialIndex={-1}
          enablePanDownToClose={false}
          handleIndicatorStyle={styles.indicator}
        >
          <View style={styles.sheetContent}>
            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <SearchInput
                height={46}
                placeholder="Eg. Viktor, Ana..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                isChange
                CrossPress={() => {
                  setSearchQuery(""), navigation.goBack();
                }}
              />
            </View>

            <View style={styles.listHeader}>
              <CustomText
                label={
                  tab === 0
                    ? "RECOMMENDED"
                    : tab === 1
                    ? "FOLLOWERS"
                    : tab === 2
                    ? "FOLLOWINGS"
                    : "BFFS"
                }
                fontFamily={fonts.medium}
                color={COLORS.gray64}
                fontSize={14}
              />
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.buttonColor} />
              </View>
            )}

            {/* Friends List */}
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item?._id?.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <CustomText label="No friends found" color={COLORS.gray64} />
                </View>
              }
            />
          </View>
        </BottomSheetComponent>
      </View>
    </ScreenWrapper>
  );
};

export default Friends;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  headerContainer: {
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.white,
  },
  tabContainer: {
    flex: 1,
  },
  sheetWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  indicator: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: 40,
  },
  searchWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  userInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  userTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  verifiedBadge: {
    height: 14,
    width: 14,
    marginRight: 4,
  },
  usernameBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    marginLeft: 4,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  separatorDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray64,
    marginHorizontal: 6,
  },
  roleIcon: {
    width: 14,
    height: 14,
    tintColor: COLORS.gray64,
  },
  actionIcon: {
    height: 40,
    width: 40,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
});
