import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { setUserData } from "../store/reducer/usersSlice";
import { setToken } from "../store/reducer/AuthConfig";

import LoginRequiredModal from "../components/LoginRequiredModal";
import PlayerCard from "../screens/Main/Home/molecules/PlayerCard";

import FollowNotification from "../components/FollowNotification";
import { useSocket } from "../components/SocketProvider";
import CaptureSelfi from "../screens/Auth/ProScreens/CaptureSelfi.js";
import ImageCamera from "../screens/Auth/ProScreens/ImageCamera.js";
import KYCResult from "../screens/Auth/ProScreens/KycResult.js";
import TakeIDBack from "../screens/Auth/ProScreens/TakeIdBack.js";
import TakeIDFront from "../screens/Auth/ProScreens/TakeIdFrontt.js";
import TakeSelfi from "../screens/Auth/ProScreens/TakeSelfi.js";
import VerifyIdentity from "../screens/Auth/ProScreens/VerifyIdentity.js";
import CameraScreen from "../screens/Main/CameraScreen";
import Chat from "../screens/Main/Chat/Chat";
import InboxScreen from "../screens/Main/Chat/InboxScreen";
import OnlineFriends from "../screens/Main/Chat/OnlineFriends";
import InboxPager from "../screens/Main/Chat/InboxPager";
import CreateGroupInvite from "../screens/Main/Chat/CreateGroupInvite";
import SearchCircles from "../screens/Main/Chat/SearchCircles";
import ScheduleMeeting from "../screens/Main/Chat/meeting/ScheduleMeeting";
import Meetings from "../screens/Main/Chat/meeting/Meetings";
import ConversationSettings from "../screens/Main/Chat/ConversationSettings";
import ReportChat from "../screens/Main/Chat/ReportChat";
import DisappearingMessages from "../screens/Main/Chat/DisappearingMessages";
import ChatTheme from "../screens/Main/Chat/ChatTheme";
import SelectLocation from "../screens/Main/Chat/meeting/SelectLocation";
import SelectPickupOnMap from "../screens/Main/Chat/meeting/SelectPickupOnMap";
import MatchingFilters from "../screens/Main/BandMateMatching/MatchingFilters";
import CommentScreen from "../screens/Main/CommentScreen";
import AddItems from "../screens/Main/CreateEvent/AddItems.js";
import Branding from "../screens/Main/CreateEvent/Branding.js";
import FoodBeverage from "../screens/Main/CreateEvent/FoodBeverage.js";
import CreateEvent from "../screens/Main/CreateEvent/index.js";
import TicketDetail from "../screens/Main/CreateEvent/TicketDetail.js";
import CustomCameraScreen from "../screens/Main/CustomCameraScreen.js";
import EventDetail from "../screens/Main/EventDetails/index.js";
import AmbientVideoScreen from "../screens/Main/Home/AmbientVideoScreen.js";
import CameraS from "../screens/Main/Home/Camera.js";
import DetailPage from "../screens/Main/Home/DetailPage";
import DetailPageWithId from "../screens/Main/Home/DetailPageWithId.js";
import InvestmentScreen from "../screens/Main/Home/InvestmentScreen";
import MainScreen from "../screens/Main/Home/MainScreen.js";
import StoryViewer from "../screens/Main/Home/molecules/StoryViewer";
import StoryViewerById from "../screens/Main/Home/molecules/StoryViewerById.js";
import ProgressiveBlur from "../screens/Main/Home/ProgressiveBlur.js";
import Notification from "../screens/Main/Notification/index.js";
import AddPicture from "../screens/Main/Profile/molecules/AddPicture.js";
import QrScreen from "../screens/Main/Profile/QrScreen.js";
import PoliticalInformation from "../screens/Main/Profile/PoliticalInformation";
import RequestsScreen from "../screens/Main/Profile/RequestsScreen.js";
import UserProfile from "../screens/Main/Profile/UserProfile";
import CreatePost from "../screens/Main/PublishPost/Index";
import Friends from "../screens/Main/PublishPost/molecules/Friends.js";
import SampleScreen from "../screens/Main/SampleScreens/SampleScreen.js";
import SearchScreen from "../screens/Main/SearchScreen";
import PostFilter from "../screens/Main/SearchScreen/PostFilter.js";
import Settings from "../screens/Main/Settings";
import DataUsage from "../screens/Main/Settings/AccessibilityPreferences/DataUsage.js";
import DateFormat from "../screens/Main/Settings/AccessibilityPreferences/DateFormat.js";
import Display from "../screens/Main/Settings/AccessibilityPreferences/Display.js";
import FirstDayOfWeek from "../screens/Main/Settings/AccessibilityPreferences/FirstDayOfWeek.js";
import AccessibilityPreferences from "../screens/Main/Settings/AccessibilityPreferences/index.js";
import Language from "../screens/Main/Settings/AccessibilityPreferences/Language.js";
import PreferredAddress from "../screens/Main/Settings/AccessibilityPreferences/PreferredAddress.js";
import PreferredCountry from "../screens/Main/Settings/AccessibilityPreferences/PreferredCountry.js";
import TimeFormat from "../screens/Main/Settings/AccessibilityPreferences/TimeFormat.js";
import TimeRegion from "../screens/Main/Settings/AccessibilityPreferences/TimeRegion.js";
import TimeZone from "../screens/Main/Settings/AccessibilityPreferences/TimeZone.js";
import Visions from "../screens/Main/Settings/AccessibilityPreferences/Visions.js";
import AccountAccess from "../screens/Main/Settings/AccountAccess";
import TwoFactorAuth from "../screens/Main/Settings/TwoFactorAuth";
import AppsAndSessions from "../screens/Main/Settings/AppsAndSessions";
import ConnectedAccounts from "../screens/Main/Settings/ConnectedAccounts";
import AccountAccessHistory from "../screens/Main/Settings/AccountAccessHistory";
import AccountInfo from "../screens/Main/Settings/AccountInfo.js";
import ChangePassword from "../screens/Main/Settings/ChangePassword";
import ChangeUsername from "../screens/Main/Settings/ChangeUsername";
import DeactivateAccount from "../screens/Main/Settings/DeactivateAccount";
import DownloadData from "../screens/Main/Settings/DownloadData";
import Monetization from "../screens/Main/Settings/Monetization";
import PayoutSetting from "../screens/Main/Settings/Monetization/PayoutSetting.js";
import YourEarnings from "../screens/Main/Settings/Monetization/YourEarnings.js";
import NotificationSetting from "../screens/Main/Settings/NotificationSetting";
import EmailNotification from "../screens/Main/Settings/NotificationSetting/EmailNotification";
import NotificationFilter from "../screens/Main/Settings/NotificationSetting/NotificationFilter";
import NotificationPreference from "../screens/Main/Settings/NotificationSetting/NotificationPreference";
import Plans from "../screens/Main/Settings/Plans.js";
import PlansViral from "../screens/Main/Settings/PlansViral.js";
import YourAccount from "../screens/Main/Settings/YourAccount";
import Shorts from "../screens/Main/Shorts";
import CreateShort from "../screens/Main/Shorts/CreateShort.js";
import PublishShort from "../screens/Main/Shorts/PublishShort.js";
import ShortWithId from "../screens/Main/Shorts/ShortWithId.js";
import { setNewFollower, setNotificationDot } from "../store/reducer/NotiSlice.js";
import HomeStack from "./HomeStack.js";
import TabStack from "./TabStack";
// Live Streaming Screens
import LiveEndedScreen from "../screens/LiveEnded/LiveEndedScreen.js";
import LiveStreamingScreen from "../screens/LiveStreaming/LiveStreamingScreen.js";
import ViewerWatchScreen from "../screens/Main/LiveScreens/ViewerWatchScreen.js";
import PublishLive from "../screens/PublishStory/PublishLive.js";
import ViewStreamScreen from "../screens/ViewStream/ViewStreamScreen.js";
import CreateAudio from "../screens/Main/Audio/CreateAudio.js";
import CreateEpisode from "../screens/Main/TvShow/CreateEpisode";
import ShowDetail from "../screens/Main/TvShow/ShowDetail";
import SelectShow from "../screens/Main/TvShow/SelectShow";
import SelectGenre from "../screens/Main/TvShow/SelectGenre";
import ShowOptionPicker from "../screens/Main/TvShow/ShowOptionPicker";

const Stack = createNativeStackNavigator();

const MainStack = () => {
  const { socket } = useSocket();
  const followNotificationRef = useRef(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const token = useSelector((state) => state.authConfig.token);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);
  const [asyncToken, setAsyncToken] = useState(null);

  const checkNotificationSocket = () => {
    socket?.on("notification", (data) => {
      dispatch(setNotificationDot(true));
      // Surface a follow as the feed's "NEW FOLLOWER" toast
      const n = data?.notification || data;
      if (n?.type === "follow") {
        const user = n?.senderId || n?.sender || n?.user || null;
        if (user && typeof user === "object") {
          dispatch(setNewFollower({ id: n?._id, user }));
        }
      }
    });
  };

  useEffect(() => {
    checkNotificationSocket();
  }, [socket]);

  useEffect(() => {
    const checkToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setAsyncToken(storedToken);
      setIsTokenLoaded(true);
    };
    checkToken();
  }, [token]);

  const showLoginModal = isTokenLoaded && !token && !asyncToken;

  useEffect(() => {
    if (isTokenLoaded && !token && !asyncToken) {
      const autoLogout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("refreshToken");
        dispatch(setUserData(null));
        dispatch(setToken(null));
        navigation.reset({
          index: 0,
          routes: [{ name: "AuthStack" }],
        });
      };
      autoLogout();
    }
  }, [isTokenLoaded, token, asyncToken]);

  useEffect(() => {
    if (!socket) return;

    socket.on("follow", (data) => {
      console.log("Follow callback data:", data);
      followNotificationRef.current?.show(data);
    });

    return () => {
      socket.off("follow");
    };
  }, [socket]);

  return (
    <>
      <Stack.Navigator
        initialRouteName="TabStack"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="TabStack" component={TabStack} />
        <Stack.Screen name="SampleScreen" component={SampleScreen} />
        <Stack.Screen
          options={{
            gestureEnabled: false,
          }}
          name="CreatePost"
          component={CreatePost}
        />
        <Stack.Screen
          name="CameraScreen"
          component={CameraScreen}
          options={{
            animation: "slide_from_left",
            gestureEnabled: false,
          }}
        />
        {/* Inbox + Online Friends pager with one shared bottom bar */}
        <Stack.Screen name="Chat" component={InboxPager} />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen name="InboxScreen" component={InboxScreen} />
        <Stack.Screen name="OnlineFriends" component={OnlineFriends} />
        <Stack.Screen
          name="ConversationSettings"
          component={ConversationSettings}
        />
        <Stack.Screen name="ReportChat" component={ReportChat} />
        <Stack.Screen name="DisappearingMessages" component={DisappearingMessages} />
        <Stack.Screen name="ChatTheme" component={ChatTheme} />
        <Stack.Screen name="SelectLocation" component={SelectLocation} />
        <Stack.Screen name="SelectPickupOnMap" component={SelectPickupOnMap} />
        <Stack.Screen name="CreateGroupInvite" component={CreateGroupInvite} />
        <Stack.Screen name="SearchCircles" component={SearchCircles} />
        <Stack.Screen name="ScheduleMeeting" component={ScheduleMeeting} />
        <Stack.Screen name="Meetings" component={Meetings} />
        <Stack.Screen name="FilterScreen" component={MatchingFilters} />
        <Stack.Screen name="InvestmentScreen" component={InvestmentScreen} />
        <Stack.Screen name="CommentScreen" component={CommentScreen} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
        <Stack.Screen name="DetailPage" component={DetailPage} />
        <Stack.Screen
          name="StoryViewer"
          component={StoryViewer}
          options={{
            // presentation: "transparentModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          // options={{
          //   gestureEnabled: false,
          // }}
          name="Shorts"
          component={Shorts}
        />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="YourAccount" component={YourAccount} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="ChangeUsername" component={ChangeUsername} />
        <Stack.Screen name="DeactivateAccount" component={DeactivateAccount} />
        <Stack.Screen name="DownloadData" component={DownloadData} />
        <Stack.Screen name="AccountAccess" component={AccountAccess} />
        <Stack.Screen name="TwoFactorAuth" component={TwoFactorAuth} />
        <Stack.Screen name="AppsAndSessions" component={AppsAndSessions} />
        <Stack.Screen name="ConnectedAccounts" component={ConnectedAccounts} />
        <Stack.Screen
          name="AccountAccessHistory"
          component={AccountAccessHistory}
        />
        <Stack.Screen
          name="NotificationFilter"
          component={NotificationFilter}
        />
        <Stack.Screen
          name="NotificationSetting"
          component={NotificationSetting}
        />
        <Stack.Screen name="EmailNotification" component={EmailNotification} />
        <Stack.Screen
          name="NotificationPreference"
          component={NotificationPreference}
        />
        <Stack.Screen name="Monetization" component={Monetization} />
        <Stack.Screen name="DataUsage" component={DataUsage} />
        <Stack.Screen name="PreferredAddress" component={PreferredAddress} />
        <Stack.Screen name="PreferredCountry" component={PreferredCountry} />
        <Stack.Screen name="TimeRegion" component={TimeRegion} />
        <Stack.Screen name="TimeFormat" component={TimeFormat} />
        <Stack.Screen name="FirstDayOfWeek" component={FirstDayOfWeek} />
        <Stack.Screen name="DateFormat" component={DateFormat} />
        <Stack.Screen name="TimeZone" component={TimeZone} />
        <Stack.Screen name="Visions" component={Visions} />
        <Stack.Screen name="Language" component={Language} />
        <Stack.Screen name="Display" component={Display} />
        <Stack.Screen name="PayoutSetting" component={PayoutSetting} />
        <Stack.Screen name="YourEarnings" component={YourEarnings} />
        <Stack.Screen name="AccountInfo" component={AccountInfo} />
        <Stack.Screen name="Plans" component={Plans} />
        <Stack.Screen
          name="AccessibilityPreferences"
          component={AccessibilityPreferences}
        />

        <Stack.Screen name="MainScreen" component={MainScreen} />
        <Stack.Screen name="CameraS" component={CameraS} />
        <Stack.Screen name="HomeStack" component={HomeStack} />
        <Stack.Screen
          options={{
            gestureEnabled: false,
          }}
          name="CreateShort"
          component={CreateShort}
        />
        <Stack.Screen name="Friends" component={Friends} />
        <Stack.Screen
          name="CustomCameraScreen"
          component={CustomCameraScreen}
        />
        <Stack.Screen
          name="AmbientVideoScreen"
          component={AmbientVideoScreen}
        />
        <Stack.Screen name="AddPicture" component={AddPicture} />
        <Stack.Screen name="Notification" component={Notification} />
        <Stack.Screen name="CreateEvent" component={CreateEvent} />
        <Stack.Screen name="Branding" component={Branding} />
        <Stack.Screen name="FoodBeverage" component={FoodBeverage} />
        <Stack.Screen name="TicketDetail" component={TicketDetail} />
        <Stack.Screen name="EventDetail" component={EventDetail} />
        <Stack.Screen name="AddItems" component={AddItems} />
        <Stack.Screen name="ProgressiveBlur" component={ProgressiveBlur} />

        {/* pro screens  */}
        <Stack.Screen name="VerifyIdentity" component={VerifyIdentity} />
        <Stack.Screen name="TakeIDFront" component={TakeIDFront} />
        <Stack.Screen name="TakeIdBack" component={TakeIDBack} />
        <Stack.Screen name="KYCResult" component={KYCResult} />
        <Stack.Screen name="TakeSelfi" component={TakeSelfi} />
        <Stack.Screen name="ImageCamera" component={ImageCamera} />
        <Stack.Screen name="CaptureSelfi" component={CaptureSelfi} />

        {/* other screen  */}
        <Stack.Screen name="PlansViral" component={PlansViral} />
        <Stack.Screen name="DetailPageWithId" component={DetailPageWithId} />
        <Stack.Screen name="StoryViewerById" component={StoryViewerById} />
        <Stack.Screen name="ShortWithId" component={ShortWithId} />
        <Stack.Screen name="PublishShort" component={PublishShort} />
        <Stack.Screen name="QrScreen" component={QrScreen} />
        <Stack.Screen
          name="PoliticalInformation"
          component={PoliticalInformation}
        />
        <Stack.Screen name="PostFilter" component={PostFilter} />
        <Stack.Screen name="RequestsScreen" component={RequestsScreen} />

        {/* audio screen */}
        <Stack.Screen name="CreateAudio" component={CreateAudio} />
        {/* Shows: Create An Episode + its pickers (Figma Shows page) */}
        <Stack.Screen name="CreateEpisode" component={CreateEpisode} />
        <Stack.Screen name="ShowDetail" component={ShowDetail} />
        <Stack.Screen name="SelectShow" component={SelectShow} />
        <Stack.Screen name="SelectGenre" component={SelectGenre} />
        <Stack.Screen name="ShowOptionPicker" component={ShowOptionPicker} />

        {/* Live Streaming Screens */}
        {/* host wali side pr data enter wali screen */}
        <Stack.Screen
          name="PublishLive"
          component={PublishLive}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        {/* host ki live screen ha yh  */}
        <Stack.Screen
          name="LiveStreaming"
          component={LiveStreamingScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        {/* yh wo ha jo andr wali screen ha user side pr  */}
        <Stack.Screen
          name="ViewStream"
          component={ViewStreamScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        {/* yh live end hony wlai ha  */}
        <Stack.Screen
          name="LiveEnded"
          component={LiveEndedScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        {/* watchscreen yh wo mainstack wali ha user side  */}

        <Stack.Screen
          name="ViewerWatchScreen"
          component={ViewerWatchScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>

      {/* global ui */}
      {}
      <PlayerCard />
      <FollowNotification ref={followNotificationRef} />
      <LoginRequiredModal isVisible={showLoginModal} />
    </>
  );
};

export default MainStack;
