import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import { GlassFill } from "../../BandMateMatching/molecules/matchLayout";
import Icons from "../../../../components/Icons";
import { get } from "../../../../services/ApiRequest";
import { useTheme } from "../../../../contexts/ThemeContext";
import EventDetailCard from "../../Event/molecules/EventDetailCard";
import EventDetailCardSkeleton from "../../Event/molecules/EventDetailCardSkeleton";
import JobCard from "../../Jobs/molecules/JobCard";
import { JobListSkeleton } from "../../Jobs/molecules/JobSkeletons";

/**
 * Company / Pro profile "Jobs" and "Events" tabs (Figma Careem profile tab
 * bar). Jobs: offers posted by the profile or under its directory company
 * (GET jobs?owner=). Events: events it created (GET events?userId=). Same
 * cards as the Jobs marketplace and the Events tab.
 */
const CompanyListsTab = ({ kind, userId, viewingSelf = false }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setItems(null);
    const url = kind === "jobs" ? `jobs?owner=${userId}&limit=20` : `events?userId=${userId}`;
    get(url)
      .then((r) => {
        const d = r?.data?.data;
        alive && setItems(Array.isArray(d) ? d : d?.items || []);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [kind, userId]);

  if (!items) {
    return kind === "jobs" ? (
      <View style={styles.jobs}>
        <JobListSkeleton />
      </View>
    ) : (
      <EventDetailCardSkeleton />
    );
  }
  if (!items.length) {
    // app empty-state pattern (Jobs marketplace / Events tab): 80 icon,
    // 32 BoldItalic italic title, Medium subtitle — plus the owner's CTA
    const jobs = kind === "jobs";
    return (
      <View style={styles.empty}>
        <Icons family="MaterialSymbolsRoundedFilled" name={jobs ? "work" : "event"} size={80} color="rgba(255, 255, 255, 0.48)" />
        <CustomText
          label={jobs ? "No Jobs" : "No Events"}
          fontSize={32}
          fontFamily={fonts.BoldItalic}
          fontStyle="italic"
          color="#FFFFFF"
          marginTop={12}
        />
        <CustomText
          label={jobs ? "There are no job offers right now." : "There are no events right now."}
          fontFamily={fonts.medium}
          color="rgba(255, 255, 255, 0.48)"
        />
        {viewingSelf && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.ctaBtn}
            onPress={() => navigation.navigate(jobs ? "CreateJob" : "CreateEvent")}
          >
            <GlassFill borderRadius={100} />
            <Icons family="MaterialSymbolsRounded" name="add" size={20} color="#FFFFFF" />
            <CustomText label={jobs ? "Create A Job Offer" : "Create An Event"} fontSize={16} fontFamily={fonts.medium} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  if (kind === "jobs") {
    return (
      <View style={styles.jobs}>
        {items.map((job, i) => (
          <View key={job._id}>
            {i > 0 && <View style={styles.rule} />}
            <JobCard job={job} onPress={() => navigation.navigate("JobDetail", { jobId: job._id })} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View>
      {items.map((ev, i) => (
        <EventDetailCard
          key={ev._id}
          item={ev}
          borderTopWidth={i === 0 ? 0 : 4}
          onCardPress={() => navigation.navigate("EventDetail", { id: ev._id })}
          onInfoPress={() => navigation.navigate("EventDetail", { id: ev._id })}
        />
      ))}
    </View>
  );
};

export default CompanyListsTab;

const styles = StyleSheet.create({
  // Jobs marketplace list: padding 8, cards 12 apart split by 1pt white 4%
  jobs: { backgroundColor: "#121212", padding: 8, gap: 12 },
  rule: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.04)", marginBottom: 12 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40, paddingHorizontal: 20, minHeight: 320 },
  ctaBtn: { height: 48, paddingHorizontal: 24, borderRadius: 100, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, overflow: "hidden", marginTop: 20 },
});
