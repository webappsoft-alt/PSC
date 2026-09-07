import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import BottomSheetComponent from "../../../../components/BottomSheetComponent";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ImageFast from "../../../../components/ImageFast";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import SearchInput from "../../../../components/SearchInput";
import TopTab from "../../../../components/TopTab";
import { get } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const { height: screenHeight } = Dimensions.get("window");

const PeopleSelection = ({
  isVisible,
  onClose,
  onConfirm,
  selectionType = "collaborators",
  initialSelected = [],
}) => {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef(null);
  const userData = useSelector((state) => state.users.userData);
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(initialSelected);
  const [loading, setLoading] = useState(false);

  // Sync selected users when initialSelected changes or modal becomes visible
  useEffect(() => {
    if (isVisible) {
      setSelectedUsers(initialSelected);
    }
  }, [isVisible, initialSelected]);

  const getUsers = async (selectedTab = tab, query = searchQuery) => {
    try {
      setLoading(true);
      let endpoint = "";

      if (selectedTab === 0) {
        endpoint = "relationships/recommended";
      } else if (selectedTab === 1) {
        endpoint = "relationships/followers";
      } else if (selectedTab === 2) {
        endpoint = "relationships/following";
      } else if (selectedTab === 3) {
        endpoint = "relationships/bffs";
      }

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
    if (isVisible) {
      getUsers(tab, searchQuery);
    }
  }, [isVisible, tab]);

  useEffect(() => {
    if (isVisible) {
      const delayDebounceFn = setTimeout(() => {
        getUsers(tab, searchQuery);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery]);

  const toggleSelection = (user) => {
    const isSelected = selectedUsers.some((u) => u._id === user._id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers([
        ...selectedUsers,
        {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profilePicture: user.profilePicture,
        },
      ]);
    }
  };

  const isUserSelected = (user) => {
    return selectedUsers.some((u) => u._id === user._id);
  };

  const handleConfirmAction = () => {
    onConfirm?.(selectedUsers);
    onClose();
  };

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 300);
    }
  }, [isVisible]);

  const renderUserItem = ({ item }) => {
    const selected = isUserSelected(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.userRow}
        onPress={() => toggleSelection(item)}
      >
        <View style={styles.userInfoLeft}>
          <ImageFast
            source={
              item?.profile?.avatar
                ? { uri: item.profile.avatar }
                : item?.profilePicture && { uri: item?.profilePicture }
            }
            style={[
              styles.userAvatar,
              {
                backgroundColor:
                  item?.profile?.avatar || item?.profilePicture
                    ? COLORS.transparent
                    : item?.profile?.profileColor,
              },
            ]}
          />
          <View style={styles.userTextContainer}>
            <View style={styles.nameRow}>
              <CustomText
                label={item?.firstName + " " + item?.lastName}
                fontFamily={fonts.medium}
                marginRight={4}
              />
              <Image source={Images.verified} style={styles.verifiedBadge} />
              <View style={styles.usernameBadge}>
                <CustomText
                  label={item?.username}
                  fontSize={10}
                  color={colors.textSecondary}
                />
              </View>
            </View>
            <View style={styles.roleRow}>
              <CustomText
                label={item?.occupation?.jobTitle}
                color={colors.textSecondary}
              />
              <View style={styles.separatorDot} />
              <CustomText
                label={item?.followersCount || 0}
                color={colors.textSecondary}
                fontSize={12}
                marginRight={4}
              />
              <Image source={Images.friendGray} style={[styles.roleIcon, { tintColor: colors.textSecondary }]} />
            </View>
          </View>
        </View>
        <ImageFast
          removeLoading
          source={selected ? Images.unfollowMinus : Images.plusGrayBg}
          style={styles.actionIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <ScreenWrapper
        translucent
        paddingHorizontal={0.01}
        backgroundImage={Images.person}
        headerUnScrollable={() => (
          <>
            <View style={styles.overlay} />
            <View style={{ marginTop: insets.top }}>
              <Header
                title={
                  selectionType === "collaborators"
                    ? "Select Collaborators"
                    : "Select Sponsors"
                }
                onBackPress={onClose}
              />
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
        <View style={styles.sheetWrapper}>
          <BottomSheetComponent
            ref={sheetRef}
            snapPoints={["85%"]}
            initialIndex={-1}
            enablePanDownToClose={false}
            handleIndicatorStyle={styles.indicator}
          >
            <View style={styles.sheetContent}>
              <View style={styles.searchWrapper}>
                <SearchInput
                  height={46}
                  placeholder="Eg. Viktor, Ana..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  isChange
                  CrossPress={() => {
                    setSearchQuery("");
                    onClose();
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
                  color={colors.textSecondary}
                  fontSize={14}
                />
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.buttonColor} />
                </View>
              )}

              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item?._id?.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <CustomText
                      label="No friends found"
                      color={colors.textSecondary}
                    />
                  </View>
                }
              />
            </View>
          </BottomSheetComponent>
        </View>
      </ScreenWrapper>
      <View style={[styles.footer, { bottom: insets.bottom }]}>
        <CustomButton
          title={`Confirm (${selectedUsers.length})`}
          backgroundColor={colors.text}
          color={colors.background}
          onPress={handleConfirmAction}
          height={48}
          borderRadius={99}
          width="90%"
        />
      </View>
    </Modal>
  );
};

export default PeopleSelection;

const createStyles = (colors, isDark) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
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
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(18, 18, 18, 0.2)",
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
    borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : colors.border,
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
    backgroundColor: colors.white04,
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
    backgroundColor: colors.textSecondary,
    marginHorizontal: 6,
  },
  roleIcon: {
    width: 14,
    height: 14,
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
  footer: {
    position: "absolute",
    zIndex: 999,
    alignSelf: "center",
    width: "100%",
  },
});
