import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const HEADER_MAX_HEIGHT = 380;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const EventDetailSkeleton = () => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.65],
  });

  const SkeletonBox = ({ width, height, borderRadius = 8, style }) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );

  // ---------- Section Divider ----------
  const Divider = () => <View style={styles.divider} />;

  // ---------- Hero image placeholder ----------
  const HeroSkeleton = () => (
    <View style={[styles.heroContainer, { paddingTop: insets.top }]}>
      {/* back button */}
      <SkeletonBox width={40} height={40} borderRadius={99} />
    </View>
  );

  // ---------- EventName skeleton ----------
  // row: avatar (28) + name text + message icon circle (40)
  const EventNameSkeleton = () => (
    <View style={styles.eventNameRow}>
      <View style={styles.row}>
        <SkeletonBox width={28} height={28} borderRadius={99} />
        <SkeletonBox
          width={140}
          height={16}
          borderRadius={4}
          style={{ marginLeft: 8 }}
        />
      </View>
      <SkeletonBox width={40} height={40} borderRadius={99} />
    </View>
  );

  // ---------- Tabs skeleton ----------
  const TabsSkeleton = () => (
    <View style={styles.tabsRow}>
      <SkeletonBox width={80} height={30} borderRadius={99} />
      <SkeletonBox
        width={60}
        height={30}
        borderRadius={99}
        style={{ marginLeft: 6 }}
      />
    </View>
  );

  // ---------- RatingOverview skeleton ----------
  // Event name large title + stock pill
  const RatingOverviewSkeleton = () => (
    <View style={styles.ratingCard}>
      <SkeletonBox width={SCREEN_WIDTH - 60} height={28} borderRadius={6} />
      <View style={{ height: 10 }} />
      <SkeletonBox width={140} height={22} borderRadius={99} />
    </View>
  );

  // ---------- EventDates skeleton ----------
  // section header + 2 date cards
  const EventDatesSkeleton = () => (
    <View style={styles.sectionPadding}>
      {/* heading row */}
      <View style={[styles.row, { marginBottom: 12 }]}>
        <SkeletonBox width={120} height={16} borderRadius={4} />
        <SkeletonBox
          width={22}
          height={22}
          borderRadius={4}
          style={{ marginLeft: "auto" }}
        />
      </View>
      {/* start date card */}
      <View style={styles.dateCard}>
        <View style={{ flex: 1 }}>
          <SkeletonBox width={80} height={11} borderRadius={4} />
          <View style={{ height: 4 }} />
          <SkeletonBox width={200} height={16} borderRadius={4} />
        </View>
        <SkeletonBox width={32} height={32} borderRadius={99} />
      </View>
      {/* end date card */}
      <View style={styles.dateCard}>
        <View style={{ flex: 1 }}>
          <SkeletonBox width={80} height={11} borderRadius={4} />
          <View style={{ height: 4 }} />
          <SkeletonBox width={180} height={16} borderRadius={4} />
        </View>
        <SkeletonBox width={32} height={32} borderRadius={99} />
      </View>
    </View>
  );

  // ---------- AboutEvent skeleton ----------
  const AboutEventSkeleton = () => (
    <View style={styles.sectionPadding}>
      <SkeletonBox width={170} height={24} borderRadius={6} />
      <View style={{ height: 10 }} />
      <SkeletonBox width={SCREEN_WIDTH - 24} height={13} borderRadius={4} />
      <View style={{ height: 5 }} />
      <SkeletonBox width={SCREEN_WIDTH - 40} height={13} borderRadius={4} />
      <View style={{ height: 5 }} />
      <SkeletonBox width={SCREEN_WIDTH - 60} height={13} borderRadius={4} />
      <View style={{ height: 5 }} />
      <SkeletonBox width={SCREEN_WIDTH - 80} height={13} borderRadius={4} />
    </View>
  );

  // ---------- WhatToExpect skeleton (same shape as AboutEvent) ----------
  const WhatToExpectSkeleton = () => (
    <View style={styles.sectionPadding}>
      <SkeletonBox width={190} height={24} borderRadius={6} />
      <View style={{ height: 10 }} />
      <SkeletonBox width={SCREEN_WIDTH - 24} height={13} borderRadius={4} />
      <View style={{ height: 5 }} />
      <SkeletonBox width={SCREEN_WIDTH - 50} height={13} borderRadius={4} />
      <View style={{ height: 5 }} />
      <SkeletonBox width={SCREEN_WIDTH - 100} height={13} borderRadius={4} />
    </View>
  );

  // ---------- EventLocation skeleton ----------
  // title + address row + map placeholder + address card
  const EventLocationSkeleton = () => (
    <View style={styles.sectionPadding}>
      <SkeletonBox width={200} height={26} borderRadius={6} />
      <View style={{ height: 6 }} />
      <SkeletonBox width={220} height={16} borderRadius={4} />
      {/* map */}
      <SkeletonBox
        width={SCREEN_WIDTH - 24}
        height={180}
        borderRadius={14}
        style={{ marginTop: 10, marginBottom: 10 }}
      />
      {/* address card */}
      <View style={styles.addressCard}>
        <View style={{ flex: 1 }}>
          <SkeletonBox width={70} height={11} borderRadius={4} />
          <View style={{ height: 4 }} />
          <SkeletonBox width={200} height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );

  // ---------- AllTickets skeleton ----------
  const AllTicketsSkeleton = () => (
    <View>
      {/* heading */}
      <View style={styles.ticketsHeading}>
        <SkeletonBox width={110} height={18} borderRadius={4} />
        <View style={{ height: 4 }} />
        <SkeletonBox width={220} height={13} borderRadius={4} />
      </View>

      {/* date chips row */}
      <View style={[styles.dateChipsContainer, { marginHorizontal: 12 }]}>
        <View style={styles.row}>
          <SkeletonBox width={100} height={42} borderRadius={8} />
          <SkeletonBox
            width={100}
            height={42}
            borderRadius={8}
            style={{ marginLeft: 10 }}
          />
          <SkeletonBox
            width={100}
            height={42}
            borderRadius={8}
            style={{ marginLeft: 10 }}
          />
        </View>
      </View>

      {/* day card */}
      <View style={styles.dayCard}>
        <SkeletonBox width={64} height={74} borderRadius={12} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <SkeletonBox width={80} height={22} borderRadius={4} />
          <View style={{ height: 6 }} />
          <SkeletonBox width={160} height={13} borderRadius={4} />
          <View style={{ height: 4 }} />
          <SkeletonBox width={140} height={13} borderRadius={4} />
        </View>
      </View>

      {/* ticket cards */}
      {[1, 2].map((i) => (
        <View key={i} style={styles.ticketCard}>
          <View style={{ flex: 1 }}>
            <SkeletonBox width={130} height={16} borderRadius={4} />
            <View style={{ height: 6 }} />
            <SkeletonBox
              width={SCREEN_WIDTH - 140}
              height={12}
              borderRadius={4}
            />
            <View style={{ height: 4 }} />
            <SkeletonBox width={80} height={12} borderRadius={4} />
          </View>
          <View style={styles.ticketRight}>
            <SkeletonBox width={60} height={20} borderRadius={4} />
            <View style={{ height: 8 }} />
            <SkeletonBox width={80} height={30} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );

  // ---------- PaymentCard skeleton ----------
  const PaymentCardSkeleton = () => (
    <View style={styles.sectionPadding}>
      {/* header */}
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <View style={styles.row}>
          <SkeletonBox width={20} height={20} borderRadius={4} />
          <SkeletonBox
            width={140}
            height={16}
            borderRadius={4}
            style={{ marginLeft: 8 }}
          />
        </View>
        <SkeletonBox width={22} height={22} borderRadius={4} />
      </View>
      {/* info pill */}
      <SkeletonBox
        width={SCREEN_WIDTH - 24}
        height={44}
        borderRadius={12}
        style={{ marginTop: 12 }}
      />
      {/* payment method text */}
      <SkeletonBox
        width={160}
        height={16}
        borderRadius={4}
        style={{ marginTop: 20 }}
      />
      {/* payment icons grid */}
      <View style={styles.paymentGrid}>
        {[...Array(5)].map((_, i) => (
          <SkeletonBox key={i} width={36} height={24} borderRadius={6} />
        ))}
      </View>
    </View>
  );

  // ---------- Bottom Bar skeleton ----------
  const BottomBarSkeleton = () => (
    <View style={styles.bottomBar}>
      <View style={[styles.row, { marginBottom: 10 }]}>
        <SkeletonBox width={120} height={10} borderRadius={4} />
      </View>
      <View style={[styles.row, { gap: 10 }]}>
        <SkeletonBox
          width={SCREEN_WIDTH - 24 - 48 - 10}
          height={48}
          borderRadius={24}
        />
        <SkeletonBox width={48} height={48} borderRadius={99} />
      </View>
      <View
        style={[
          styles.row,
          { justifyContent: "center", marginTop: 12, gap: 16 },
        ]}
      >
        <SkeletonBox width={120} height={12} borderRadius={4} />
        <SkeletonBox width={110} height={12} borderRadius={4} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Hero image placeholder ── */}
      <View style={styles.heroPlaceholder}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity, backgroundColor: colors.surfaceAlt },
          ]}
        />
        {/* sticky header buttons */}
        <View style={[styles.heroHeader, { paddingTop: insets.top }]}>
          <SkeletonBox width={40} height={40} borderRadius={99} />
          <SkeletonBox
            width={140}
            height={20}
            borderRadius={4}
            style={{ marginLeft: 16 }}
          />
        </View>
      </View>

      {/* ── Content below hero ── */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View style={{ marginTop: HEADER_MAX_HEIGHT }}>
          {/* EventName */}
          <EventNameSkeleton />
          <Divider />

          {/* Tabs */}
          <TabsSkeleton />
          <Divider />

          {/* RatingOverview */}
          <RatingOverviewSkeleton />
          <Divider />

          {/* EventDates */}
          <EventDatesSkeleton />
          <Divider />

          {/* AboutEvent */}
          <AboutEventSkeleton />
          <Divider />

          {/* WhatToExpect */}
          <WhatToExpectSkeleton />
          <Divider />

          {/* EventLocation */}
          <EventLocationSkeleton />
          <Divider />

          {/* AllTickets */}
          <AllTicketsSkeleton />
          <Divider />

          {/* PaymentCard */}
          <PaymentCardSkeleton />
        </View>
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View>
        <View style={styles.divider} />
        <BottomBarSkeleton />
      </View>
    </View>
  );
};

export default EventDetailSkeleton;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MAX_HEIGHT,
    overflow: "hidden",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  divider: {
    height: 4,
    backgroundColor: colors.surfaceAlt,
  },

  // EventName
  eventNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginVertical: 10,
  },

  // Rating
  ratingCard: {
    marginHorizontal: 12,
    marginVertical: 12,
  },

  // Generic
  sectionPadding: {
    padding: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  // EventDates
  dateCard: {
    height: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  // EventLocation
  addressCard: {
    height: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
  },

  // AllTickets
  ticketsHeading: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateChipsContainer: {
    backgroundColor: colors.surfaceAlt,
    padding: 4,
    borderRadius: 12,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 14,
  },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  ticketRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },

  // PaymentCard
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },

  // Bottom bar
  bottomBar: {
    paddingBottom: 30,
    backgroundColor: colors.background,
    padding: 12,
    paddingTop: 4,
  },
});
