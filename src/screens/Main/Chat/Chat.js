import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import SearchInput from "../../../components/SearchInput";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { useSocket } from "../../../components/SocketProvider";
import TopTab from "../../../components/TopTab";
import { getConversations } from "../../../services/ChatService";
import { COLORS } from "../../../utils/COLORS";
import ConversationBox from "./molecules/ConversationBox";
import ConversationBoxSkeleton from "./molecules/ConversationBoxSkeleton";
import AnimatedListItem from "../../../utils/AnimatedListItem";
import { useTheme } from "../../../contexts/ThemeContext";

const tabs = ["", "1 on 1", "Matches", "Requests"];

const Chat = () => {
  const navigation = useNavigation();
  const isFocus = useIsFocused();
  const [tab, setTab] = useState(0);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [search, setSearch] = useState("");
  const { userData } = useSelector((state) => state.users);
  const { socket } = useSocket();
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const [firstLoad, setFirstLoad] = useState(true);
  const [chatData, setChatData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchConversations(false, search.length > 0);
  }, [isFocus, tab, search]);

  useEffect(() => {
    if (!socket) return;
    socket.on("new:message", (data) => {
      if (data) {
        fetchConversations(false);
      }
    });

    return () => {
      socket.off("new:message");
    };
  }, [socket]);

  const fetchConversations = async (showLoading, isSearchLoading = false) => {
    if (showLoading) {
      setRefreshing(true);
    }
    if (isSearchLoading) {
      setFirstLoad(true);
    }
    try {
      if (userData?._id) {
        let params = {};
        if (tab === 2) {
          params.isMatching = true;
        } else if (tab === 3) {
          params.isRequest = true;
        }

        if (search) {
          params.search = search;
        }

        const res = await getConversations(userData._id, params);
        console.log("res---", res.data);

        if (res?.data?.success) {
          setChatData(res.data.data);
        }
      }
    } catch (error) {
      console.log("Error fetching conversations:", error);
    } finally {
      setRefreshing(false);
      setFirstLoad(false);
    }
  };

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchConversations(false)}
          tintColor={COLORS.buttonColor}
          colors={[COLORS.buttonColor]}
        />
      }
      headerUnScrollable={() => (
        <View>
          <Header
            title="Inbox"
            rightIcon={
              <TouchableOpacity
                onPress={() => {
                  if (isSearchVisible) {
                    setSearch("");
                  }
                  setIsSearchVisible(!isSearchVisible);
                }}
              >
                <Icons
                  name={isSearchVisible ? "x" : "search"}
                  family="Feather"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            }
          />
          {isSearchVisible && (
            <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
              <SearchInput
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
                autoFocus
                height={48}
                marginBottom={12}
                marginTop={-4}
              />
            </View>
          )}
          <TopTab
            rounded
            tab={tab}
            marginTop={5}
            tabNames={tabs}
            images={[Images.Bag]}
            setTab={setTab}
            fontFamily={fonts.medium}
            scrollViewPaddingHorizontal={12}
            activeTintColor={COLORS.primaryColor}
            inactiveTintColor={isDark ? "#A19375" : colors.textSecondary}
          />
        </View>
      )}
      scrollEnabled
    >
      <>
        <Divider thickness={5} marginVertical={10} />

        <TouchableOpacity
          onPress={() => setIsCollapsed(!isCollapsed)}
          style={styles.headerSection}
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <View style={styles.row}>
              <ImageFast
                source={Images.MyChat}
                resizeMode={"contain"}
                style={{ height: 13, width: 13 }}
              />
              <CustomText
                fontSize={16}
                label="My Chats"
                fontFamily={fonts.medium}
              />
            </View>
            <CustomText
              fontSize={16}
              color={colors.textSecondary}
              label={chatData.length}
              fontFamily={fonts.medium}
            />
          </View>
          <View>
            <Icons
              size={22}
              family="Entypo"
              name={isCollapsed ? "chevron-right" : "chevron-down"}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
        {!isCollapsed &&
          (firstLoad ? (
            <View>
              {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                <ConversationBoxSkeleton key={index} />
              ))}
            </View>
          ) : (
            <FlatList
              data={chatData}
              scrollEnabled={false}
              ListEmptyComponent={
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 200,
                  }}
                >
                  <CustomText label="No Chat found" />
                </View>
              }
              renderItem={({ item, index }) => (
                <AnimatedListItem index={index}>
                  <ConversationBox item={item} />
                </AnimatedListItem>
              )}
            />
          ))}
      </>
    </ScreenWrapper>
  );
};

export default Chat;

const createStyles = (colors, isDark) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#262626" : colors.border,
    paddingHorizontal: 15,
    paddingBottom: 8,
  },
});
