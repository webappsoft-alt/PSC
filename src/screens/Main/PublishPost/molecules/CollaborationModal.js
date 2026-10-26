import { BlurView } from "@react-native-community/blur";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import { get } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import UserBadge from "../../../../components/UserBadge";

const CollaborationModal = ({
  isVisible,
  onClose,
  onConfirm,
  initialCollaborators = [],
  initialSponsors = [],
}) => {
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] =
    useState(initialCollaborators);
  const [selectedSponsors, setSelectedSponsors] = useState(initialSponsors);

  useEffect(() => {
    if (isVisible) {
      fetchFollowings();
      setSelectedCollaborators(initialCollaborators);
      setSelectedSponsors(initialSponsors);
    }
  }, [isVisible]);

  const fetchFollowings = async () => {
    try {
      setLoading(true);
      const response = await get("relationships/following");
      setFollowingUsers(response.data?.data?.users || []);
    } catch (error) {
      console.error("Error fetching followings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCollaborator = (user) => {
    const isSelected = selectedCollaborators.find((u) => u._id === user._id);
    if (isSelected) {
      setSelectedCollaborators(
        selectedCollaborators.filter((u) => u._id !== user._id)
      );
    } else {
      setSelectedCollaborators([
        ...selectedCollaborators,
        { _id: user._id, firstName: user.firstName },
      ]);
    }
  };

  const handleSelectSponsor = (user) => {
    const isSelected = selectedSponsors.find((u) => u._id === user._id);
    if (isSelected) {
      setSelectedSponsors(selectedSponsors.filter((u) => u._id !== user._id));
    } else {
      setSelectedSponsors([
        ...selectedSponsors,
        { _id: user._id, firstName: user.firstName },
      ]);
    }
  };

  const handleReset = () => {
    setSelectedCollaborators([]);
    setSelectedSponsors([]);
  };

  const handleConfirm = () => {
    onConfirm?.({
      collaborators: selectedCollaborators,
      sponsors: selectedSponsors,
    });
    onClose();
  };

  const renderUserItem = (item, type) => {
    const isSelected =
      type === "collaborator"
        ? selectedCollaborators.some((u) => u._id === item._id)
        : selectedSponsors.some((u) => u._id === item._id);

    return (
      <TouchableOpacity
        key={item._id}
        style={styles.optionRow}
        onPress={() =>
          type === "collaborator"
            ? handleSelectCollaborator(item)
            : handleSelectSponsor(item)
        }
      >
        <View style={styles.optionLeft}>
          <ImageFast
            source={
              item.profilePicture ? { uri: item.profilePicture } : Images.person
            }
            style={styles.optionIcon}
          />
          <View style={styles.optionTextContainer}>
            <View style={styles.row}>
              <CustomText
                label={`${item.firstName} ${item.lastName}`}
                fontFamily={fonts.medium}
                marginRight={4}
              />
              <UserBadge user={item} style={{ marginRight: 2 }} />
              <View
                style={{
                  padding: 5,
                  paddingVertical: 2,
                  backgroundColor: COLORS.white16,
                  borderRadius: 99,
                  marginLeft: 2,
                }}
              >
                <CustomText
                  label={item.username}
                  fontSize={10}
                  color={COLORS.gray64}
                />
              </View>
            </View>

            <View style={styles.row}>
              <CustomText
                label={`${item.occupation?.jobTitle || "User"} `}
                color={COLORS.gray64}
                marginRight={4}
              />
              <View
                style={{
                  height: 4,
                  width: 4,
                  borderRadius: 99,
                  backgroundColor: COLORS.gray64,
                  marginRight: 4,
                }}
              />
              <Image source={Images.friendGray} style={styles.verifiedBadge} />
            </View>
          </View>
        </View>

        <ImageFast
          removeLoading
          source={isSelected ? Images.unfollowMinus : Images.plusGrayBg}
          style={styles.forwardIcon}
        />
      </TouchableOpacity>
    );
  };

  return (
    <CustomModal
      isBlur
      isVisible={isVisible}
      onDisable={onClose}
      reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
    >
      <View
        style={{
          backgroundColor: COLORS.white16,
          padding: 6,
          margin: 10,
          borderRadius: 26,
          maxHeight: 400,
        }}
      >
        <BlurView
          style={{
            maxHeight: "100%",
            width: "100%",
            borderRadius: 26,
          }}
          blurType="light"
          blurAmount={26}
          reducedTransparencyFallbackColor="#FFFFFF29"
        />
        <View style={styles.modalContainer}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <CustomText
                label={"Tagged"}
                fontFamily={fonts.semiBold}
                fontSize={24}
              />
              <CustomText
                label={"See who’s tagged in this post"}
                fontFamily={fonts.medium}
                color={COLORS.gray64}
              />
            </View>
            <View style={styles.headerActions}>
              <ImageFast
                removeLoading
                onPress={onClose}
                source={Images.crossBg || Images.cross}
                style={styles.actionIcon}
              />
            </View>
          </View>

          <FlatList
            data={[]}
            keyExtractor={() => "dummy"}
            renderItem={null}
            ListHeaderComponent={() => (
              <>
                <CustomText
                  label={"SPONSORS"}
                  fontFamily={fonts.medium}
                  color={COLORS.gray64}
                  marginTop={10}
                />

                {loading ? (
                  <ActivityIndicator
                    color={COLORS.buttonColor}
                    style={{ marginTop: 20 }}
                  />
                ) : (
                  followingUsers.map((item) => renderUserItem(item, "sponsor"))
                )}

                <CustomText
                  label={"COLLABORATORS"}
                  fontFamily={fonts.medium}
                  color={COLORS.gray64}
                  marginTop={10}
                />

                {loading ? (
                  <ActivityIndicator
                    color={COLORS.buttonColor}
                    style={{ marginTop: 20 }}
                  />
                ) : (
                  followingUsers.map((item) =>
                    renderUserItem(item, "collaborator")
                  )
                )}
              </>
            )}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={[
              styles.row,
              { marginTop: 20, gap: 4, justifyContent: "center" },
            ]}
          >
            <CustomButton
              title={"Reset All"}
              width="49%"
              backgroundColor={COLORS.white04}
              color={COLORS.white}
              onPress={handleReset}
            />
            <CustomButton
              title={"Confirm"}
              width="49%"
              backgroundColor={COLORS.white}
              onPress={handleConfirm}
            />
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default CollaborationModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.black, // Fallback or main background
    borderRadius: 24,
    width: "100%",
    alignSelf: "center",
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    height: 32,
    width: 32,
    borderRadius: 24,
    backgroundColor: COLORS.inputBg,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedBadge: {
    height: 14,
    width: 14,
    marginRight: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionIcon: {
    height: 32,
    width: 32,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  reportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  reportLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reportIcon: {
    height: 40,
    width: 40,
    tintColor: "rgba(238, 16, 69, 1)",
    marginRight: 12,
  },
  forwardIcon: {
    height: 40,
    width: 40,
  },
  optionsSection: {
    marginTop: 16,
    gap: 4,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.white04,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    height: 40,
    width: 40,
    borderRadius: 99,
    marginRight: 8,
  },
  optionTextContainer: {
    flex: 1,
  },
});
