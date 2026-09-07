import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Divider from "../../../../components/Divider";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const TimeZone = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedTimeZone, setSelectedTimeZone] = useState("UTC");
  const [loading, setLoading] = useState(false);

  const timeZones = [
    {
      id: "1",
      name: "UTC",
      subtitle: "Coordinated Universal Time (UTC+00:00)",
    },
    { id: "2", name: "GMT", subtitle: "Greenwich Mean Time (UTC+00:00)" },
    { id: "3", name: "EST", subtitle: "Eastern Standard Time (UTC-05:00)" },
    { id: "4", name: "CST", subtitle: "Central Standard Time (UTC-06:00)" },
    { id: "5", name: "MST", subtitle: "Mountain Standard Time (UTC-07:00)" },
    { id: "6", name: "PST", subtitle: "Pacific Standard Time (UTC-08:00)" },
    { id: "7", name: "AKST", subtitle: "Alaska Standard Time (UTC-09:00)" },
    { id: "8", name: "HST", subtitle: "Hawaii Standard Time (UTC-10:00)" },
    { id: "9", name: "CET", subtitle: "Central European Time (UTC+01:00)" },
    { id: "10", name: "EET", subtitle: "Eastern European Time (UTC+02:00)" },
    { id: "11", name: "MSK", subtitle: "Moscow Standard Time (UTC+03:00)" },
    { id: "12", name: "GST", subtitle: "Gulf Standard Time (UTC+04:00)" },
    { id: "13", name: "PKT", subtitle: "Pakistan Standard Time (UTC+05:00)" },
    { id: "14", name: "IST", subtitle: "India Standard Time (UTC+05:30)" },
    { id: "15", name: "BST", subtitle: "Bangladesh Standard Time (UTC+06:00)" },
    { id: "16", name: "ICT", subtitle: "Indochina Time (UTC+07:00)" },
    {
      id: "17",
      name: "CST (China)",
      subtitle: "China Standard Time (UTC+08:00)",
    },
    { id: "18", name: "JST", subtitle: "Japan Standard Time (UTC+09:00)" },
    {
      id: "19",
      name: "AEST",
      subtitle: "Australian Eastern Standard Time (UTC+10:00)",
    },
    {
      id: "20",
      name: "NZST",
      subtitle: "New Zealand Standard Time (UTC+12:00)",
    },
  ];

  useEffect(() => {
    if (userData?.profile?.timezone) {
      setSelectedTimeZone(userData.profile.timezone);
    }
  }, [userData]);

  const handleTimeZoneChange = async (timeZone) => {
    if (loading || selectedTimeZone === timeZone) return;
    setSelectedTimeZone(timeZone);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { timezone: timeZone },
      "Timezone updated successfully"
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Time Zone"} />}
      scrollEnabled={true}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      {timeZones.map((zone, index) => (
        <ToggleCard
          key={zone.id}
          title={zone.name}
          subtitle={zone.subtitle}
          value={selectedTimeZone === zone.name}
          onPress={() => handleTimeZoneChange(zone.name)}
          isBorder={true}
          isOption={true}
          marginBottom={index === timeZones.length - 1 ? 40 : 0}
        />
      ))}
    </ScreenWrapper>
  );
};

export default TimeZone;

const styles = StyleSheet.create({});
