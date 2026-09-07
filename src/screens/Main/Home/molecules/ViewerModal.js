import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import Divider from "../../../../components/Divider";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { get } from "../../../../services/ApiRequest";
import { COLORS } from "../../../../utils/COLORS";
import { BlurView } from "@react-native-community/blur";

const ViewerModal = ({ isVisible, onDisable, viewersCount, postId }) => {
  const insets = useSafeAreaInsets();

  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ views: viewersCount });

  useEffect(() => {
    if (isVisible && postId) {
      fetchViewers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, postId]);

  const fetchViewers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get(`posts/${postId}/views`);

      if (response?.data?.success) {
        setViewers(response.data.data.viewers || []);
        if (response.data.data.stats) {
          setStats(response.data.data.stats);
        }
      } else {
        setError("Failed to load viewers");
      }
    } catch (err) {
      console.error("Error fetching viewers:", err);
      setError("Something went wrong while loading viewers");
    } finally {
      setLoading(false);
    }
  };

  const renderViewerItem = ({ item }) => {
    const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim();
    const avatar = item.profile?.avatar;
    const category = item.profile?.category || "Public";

    return (
      <TouchableOpacity style={styles.viewerItem} activeOpacity={0.7}>
        <View style={styles.viewerInfoLeft}>
          {avatar ? (
            <ImageFast source={{ uri: avatar }} style={styles.viewerAvatar} />
          ) : (
            <View
              style={[
                styles.viewerAvatar,
                {
                  backgroundColor: item.profile?.profileColor || COLORS.gray48,
                },
              ]}
            />
          )}
          <View style={styles.viewerTextContainer}>
            <View style={styles.nameRow}>
              <CustomText
                label={fullName || "User"}
                color={COLORS.white}
                fontFamily={fonts.medium}
                fontSize={14}
              />
              {/* Assuming verification status might come from item.isVerified or similar if added later */}
              {item.isVerified && (
                <Image source={Images.verified} style={styles.verifiedBadge} />
              )}
              <View style={styles.usernameBadge}>
                <CustomText
                  label={`@${item.username}`}
                  color={COLORS.gray64}
                  fontFamily={fonts.medium}
                  fontSize={12}
                />
              </View>
            </View>
            <View style={styles.roleRow}>
              <CustomText
                label={category}
                color={COLORS.gray64}
                fontFamily={fonts.medium}
                fontSize={12}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.centerContainer}>
        <CustomText
          label={error || "No viewers yet"}
          color={COLORS.gray48}
          fontSize={14}
          textAlign="center"
        />
      </View>
    );
  };

  return (
    <CustomModal isBlur isChange isVisible={isVisible} onDisable={onDisable}>
      <View>
        <View style={styles.mainContainer}>
          <View style={styles.headerContainer}>
            <View
              style={[
                styles.row,
                { paddingTop: insets.top, paddingHorizontal: 12 },
              ]}
            >
              <TouchableOpacity
                onPress={onDisable}
                activeOpacity={0.6}
                style={[
                  styles.backIcon,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                  },
                ]}
              >
                <Icons
                  name="keyboard-arrow-left"
                  family="MaterialIcons"
                  size={26}
                  color={COLORS.white}
                />
              </TouchableOpacity>

              <View>
                <CustomText
                  label={`${stats.views} Viewers`}
                  color={COLORS.white}
                  fontFamily={fonts.semiBold}
                  textTransform="capitalize"
                  fontSize={20}
                />
              </View>
            </View>

            <Divider
              marginTop={8}
              marginBottom={0}
              thickness={4}
              color="rgba(255, 255, 255, 0.04)"
            />

            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator color={COLORS.buttonColor} size="large" />
                </View>
              ) : (
                <FlatList
                  data={viewers}
                  renderItem={renderViewerItem}
                  keyExtractor={(item) => item._id}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={renderEmpty}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default ViewerModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.black,
    borderRadius: 22,
  },
  headerContainer: {
    backgroundColor: COLORS.primaryColor,
    flex: 1,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 40,
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF0A",
    padding: 16,
    height: 64,
  },
  viewerInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  viewerAvatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  viewerTextContainer: {
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
});
