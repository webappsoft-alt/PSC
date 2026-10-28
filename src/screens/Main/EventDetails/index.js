import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import EventDetailSkeleton from "./molecules/EventDetailSkeleton";

import { COLORS } from "../../../utils/COLORS";

import { BlurView } from "@react-native-community/blur";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import ArtistDetailCard from "../../../components/ArtistDetailCard";
import CustomText from "../../../components/CustomText";
import HeaderProgressiveBlur from "../../../components/HeaderProgressiveBlur";
import ProgressiveBlur from "../../../components/ProgressiveBlur";
import LinearGradient from "react-native-linear-gradient";
import Divider from "../../../components/Divider";
import Icons from "../../../components/Icons";
import { get, post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";
import AboutEvent from "./molecules/AboutEvent";
import AllTickets from "./molecules/AllTickets";
import EventCard from "./molecules/EventCard";
import EventDates from "./molecules/EventDates";
import EventLocation from "./molecules/EventLocation";
import EventName from "./molecules/EventName";
import PaymentCard from "./molecules/PaymentCard";
import RatingOverview from "./molecules/RatingOverview";
import Tabs from "./molecules/Tabs";
import TicketBottomBar from "./molecules/TicketBottomBar";
import WhatToExpect from "./molecules/WhatToExpect";

const HEADER_MAX_HEIGHT = 380;
const HEADER_MIN_HEIGHT = 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const EventDetail = ({ navigation }) => {
  const route = useRoute();
  const { id } = route?.params;
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState({});
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [ticketPayload, setTicketPayload] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [bookedEvents, setBookedEvents] = useState([]);
  const headerTranslateY = scrollY.interpolate({
    inputRange: [-HEADER_MAX_HEIGHT, 0, HEADER_SCROLL_DISTANCE],
    outputRange: [-HEADER_MAX_HEIGHT / 2, 0, -HEADER_SCROLL_DISTANCE],
    extrapolateRight: "clamp",
  });
  const headerScale = scrollY.interpolate({
    inputRange: [-150, 0],
    outputRange: [1.2, 1],
    extrapolateRight: "clamp",
  });

  const layerFastTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 2],
    outputRange: [0, -80],
    extrapolate: "clamp",
  });

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE * 0.5, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.4, 1],
    extrapolate: "clamp",
  });
  const getEventDetail = async () => {
    try {
      const res = await get("events/" + id);
      if (res?.data?.success) {
        // console.log("event======>", res?.data?.data);
        const eventDetail = res.data.data;
        setDetail(eventDetail);

        // Fetch related events (same category)
        if (eventDetail?.category?.length > 0) {
          getRelatedEvents(eventDetail.category[0]);
        } else {
          getRelatedEvents();
        }

        // Fetch booked events (could be just general events for now)
        getBookedEvents();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getRelatedEvents = async (category = null) => {
    try {
      let endpoint = "events?limit=5";

      const res = await get(endpoint);
      if (res?.data?.success) {
        // Filter out current event
        setRelatedEvents(res.data.data.filter((e) => e._id !== id));
      }
    } catch (err) {
      console.log("Error related events:", err);
    }
  };

  const getBookedEvents = async () => {
    try {
      const res = await get("events?limit=5&sort=-createdAt");
      if (res?.data?.success) {
        setBookedEvents(res.data.data.filter((e) => e._id !== id));
      }
    } catch (err) {
      console.log("Error booked events:", err);
    }
  };
  useEffect(() => {
    getEventDetail();
  }, []);

  const handlePayloadUpdate = (payload) => {
    setTicketPayload(payload);
  };

  const submitTickets = async () => {
    try {
      setSubmitting(true);
      const res = await post("bookings", ticketPayload);
      if (res?.data?.success) {
        console.log(res?.data);
        await confirmBooking(res?.data?.data?._id);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmBooking = async (id) => {
    try {
      const res = await post("bookings/" + id + "/confirm");
      if (res?.data?.success) {
        ToastMessage(res?.data?.message, "success");
        setLoading(true);
        await getEventDetail();
      }
    } catch (err) {
      console.log(err);
    }
  };
  if (loading) {
    return <EventDetailSkeleton />;
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        style={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
          },
        )}
      >
        <View
          style={[
            styles.contentArea,
            {
              marginTop: HEADER_MAX_HEIGHT,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ translateY: layerFastTranslateY }],
            }}
          >
            <EventName detail={detail} />
            <Divider
              thickness={4}
              color={colors.surfaceAlt}
              marginTop={0}
              marginBottom={0}
            />
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <Divider
              thickness={4}
              color={colors.surfaceAlt}
              marginTop={0}
              marginBottom={0}
            />
            {activeTab == "Overview" && (
              <>
                <RatingOverview
                  detail={detail}
                  tags={detail?.genres}
                  name={detail?.eventName}
                />
                <Divider
                  thickness={4}
                  color={colors.surfaceAlt}
                  marginTop={0}
                  marginBottom={0}
                />
                <EventDates detail={detail} />
                <Divider
                  thickness={4}
                  color={colors.surfaceAlt}
                  marginTop={0}
                  marginBottom={0}
                />
                <AboutEvent about={detail?.aboutThisEvent} />
                <Divider
                  thickness={4}
                  color={colors.surfaceAlt}
                  marginTop={0}
                  marginBottom={0}
                />
                <WhatToExpect content={detail?.whatGuestCanExpect} />
                <Divider
                  thickness={4}
                  color={colors.surfaceAlt}
                  marginTop={0}
                  marginBottom={0}
                />
              </>
            )}

            <EventLocation address={detail?.address} />
            <Divider
              thickness={4}
              color={colors.surfaceAlt}
              marginTop={0}
              marginBottom={0}
            />
            <AllTickets
              ticketing={detail?.ticketing}
              id={detail?._id}
              onPayloadChange={handlePayloadUpdate}
              address={detail?.address?.address}
            />
            <Divider
              thickness={4}
              color={colors.surfaceAlt}
              marginTop={6}
              marginBottom={0}
            />
            <PaymentCard />
            <Divider
              thickness={4}
              color={colors.surfaceAlt}
              marginTop={12}
              marginBottom={0}
            />

            {relatedEvents?.length > 0 && (
              <>
                <View style={[styles.flexRow, { padding: 12 }]}>
                  <View style={[styles.flexRow, { flex: 1 }]}>
                    <CustomText
                      label={"You Might Also Like"}
                      fontSize={16}
                      fontFamily={fonts.semiBold}
                      marginRight={4}
                    />
                    <View style={styles.sponsoredWarpper}>
                      <CustomText
                        label={"Sponsored"}
                        fontSize={12}
                        fontFamily={fonts.medium}
                        color={COLORS.gray64}
                      />
                    </View>
                  </View>
                  <Icons
                    family={"Entypo"}
                    name={"chevron-down"}
                    color={COLORS.gray64}
                    size={22}
                  />
                </View>
                <FlatList
                  data={relatedEvents}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 12 }}
                  renderItem={({ item }) => (
                    <EventCard
                      item={item}
                      onPress={() =>
                        navigation.push("EventDetail", { id: item._id })
                      }
                    />
                  )}
                />
              </>
            )}

            {bookedEvents?.length > 0 && (
              <>
                <Divider
                  thickness={4}
                  color={colors.surfaceAlt}
                  marginTop={12}
                  marginBottom={0}
                />

                <View style={[styles.flexRow, { padding: 12 }]}>
                  <View style={[styles.flexRow, { flex: 1 }]}>
                    <CustomText
                      label={"Others Have Also Booked"}
                      fontSize={16}
                      fontFamily={fonts.semiBold}
                      marginRight={4}
                    />
                    <View style={styles.sponsoredWarpper}>
                      <CustomText
                        label={"Sponsored"}
                        fontSize={12}
                        fontFamily={fonts.medium}
                        color={COLORS.gray64}
                      />
                    </View>
                  </View>
                  <Icons
                    family={"Entypo"}
                    name={"chevron-down"}
                    color={COLORS.gray64}
                    size={22}
                  />
                </View>
                <FlatList
                  data={bookedEvents}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 12 }}
                  renderItem={({ item }) => (
                    <EventCard
                      item={item}
                      onPress={() =>
                        navigation.push("EventDetail", { id: item._id })
                      }
                    />
                  )}
                />
              </>
            )}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.parallaxCardContainer,
          {
            height: HEADER_MAX_HEIGHT,
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale },
            ],
          },
        ]}
      >
        <ArtistDetailCard
          item={detail}
          images={
            detail?.media?.map((item) => item?.url) || [
              "https://www.freepik.com/free-photos-vectors/event",
            ]
          }
        />
      </Animated.View>

      <View>
        <Divider thickness={4} color={colors.surfaceAlt} marginBottom={0} />
        <TicketBottomBar
          totalTickets={ticketPayload?.totalQuantity ?? 0}
          finalPrice={ticketPayload?.finalPrice ?? 0}
          onPressBook={submitTickets}
          loading={submitting}
        />
      </View>

      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        {/* Figma Event-Detail-Page header (2234:2705) at the top of the page:
            Background blur Progressive 16 → 0 + Linear #121212 64% → 0% */}
        <ProgressiveBlur
          pointerEvents="none"
          direction="top"
          tint={isDark ? "ultraThinMaterialDark" : "ultraThinMaterialLight"}
          intensity={16}
          borderRadius={0}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={
            isDark
              ? ["rgba(18, 18, 18, 0.64)", "rgba(18, 18, 18, 0)"]
              : ["rgba(250, 250, 250, 0.64)", "rgba(250, 250, 250, 0)"]
          }
          style={StyleSheet.absoluteFill}
        />
        {/* once the page scrolls the header turns into the solid PSC header
            (progressive edge at the bottom), like Conversation settings */}
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            opacity: headerBgOpacity,
          }}
        >
          <HeaderProgressiveBlur color={colors.background} />
        </Animated.View>
        <View style={styles.flexRow}>
          <View style={[styles.flexRow, { flex: 1, marginRight: 50 }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.6}
              style={styles.iconButtonWrapper}
            >
              <BlurView
                style={styles.iconButtonBlur}
                blurType={isDark ? "light" : "xlight"}
                blurAmount={16}
                reducedTransparencyFallbackColor={"#12121252"}
              >
                <Image
                  style={[
                    styles.icon,
                    {
                      height: 24,
                      width: 24,
                      resizeMode: "contain",
                      tintColor: colors.text,
                    },
                  ]}
                  source={Images.back}
                />
              </BlurView>
            </TouchableOpacity>
            <CustomText
              label={detail?.venueName || "Toscana"}
              fontFamily={fonts.semiBold}
              fontSize={20}
              marginLeft={16}
              numberOfLines={2}
            />
          </View>
          {/* <View style={[styles.flexRow, { gap: 8 }]}>
            <TouchableOpacity
              style={styles.iconButtonWrapper}
              activeOpacity={0.6}
            >
              <BlurView
                style={styles.iconButtonBlur}
                blurType="materialDark"
                blurAmount={16}
                reducedTransparencyFallbackColor={"#12121252"}
              >
                <Image
                  style={[styles.icon, { tintColor: COLORS.white }]}
                  source={PNGIcons.search}
                />
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButtonWrapper}
              activeOpacity={0.6}
            >
              <BlurView
                style={styles.iconButtonBlur}
                blurType="materialDark"
                blurAmount={16}
                reducedTransparencyFallbackColor={"#12121252"}
              >
                <Image style={styles.icon} source={PNGIcons.share} />
              </BlurView>
            </TouchableOpacity>
          </View> */}
        </View>
      </Animated.View>
    </View>
  );
};

export default EventDetail;

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollViewContent: {
      flex: 1,
    },
    parallaxCardContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      overflow: "hidden",
    },
    contentArea: {
      backgroundColor: colors.background,
    },
    stickyHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 8,
    },
    backButtonWrapper: {
      height: 40,
      width: 40,
      borderRadius: 99,
      overflow: "hidden",
    },
    backButtonBlur: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingTop: 12,
    },
    detailImg: {
      width: "100%",
      height: 375,
    },
    flexRow: {
      alignItems: "center",
      flexDirection: "row",
    },
    icon: {
      height: 20,
      width: 20,
      resizeMode: "contain",
    },
    sponsoredWarpper: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 6,
    },
    iconButtonWrapper: {
      height: 40,
      width: 40,
      borderRadius: 99,
      overflow: "hidden",
    },
    iconButtonBlur: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });
