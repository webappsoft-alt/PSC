import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSelector } from "react-redux";

import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import SearchCard from "../SearchScreen/molecules/SearchCard";

import { del, get, post } from "../../../services/ApiRequest";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import SearchCardSkeleton from "../SearchScreen/molecules/SearchCardSkeleton";

const RequestsScreen = () => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const userData = useSelector((state) => state.users.userData);
  const [users, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState({ id: null, type: null });

  const getRequests = async () => {
    try {
      setLoading(true);
      const endpoint = "relationships/requests";
      const response = await get(endpoint);
      const fetchedUsers = response.data?.data?.users || [];
      setAllUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRequests();
  }, [isFocus]);

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

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => <Header title="Requests" />}
      scrollEnabled
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={getRequests} />
      }
    >
      <View style={{ flex: 1 }}>
        <FlatList
          data={loading ? Array.from({ length: 10 }).fill(null) : users}
          keyExtractor={(item, index) =>
            item?._id?.toString() || index.toString()
          }
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          renderItem={({ item, index }) =>
            users?.length > 0 ? (
              <SearchCard
                key={index}
                isChange
                user={item}
                isRequestsTab={true}
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
            ) : (
              <SearchCardSkeleton key={index} />
            )
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <CustomText label="No requests found" color={COLORS.gray64} />
              </View>
            )
          }
        />
      </View>
    </ScreenWrapper>
  );
};

export default RequestsScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
