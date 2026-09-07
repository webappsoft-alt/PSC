import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Divider from "../../../../components/Divider";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const FirstDayOfWeek = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [loading, setLoading] = useState(false);

  const weekDays = [
    { id: "1", name: "Sunday", subtitle: "Week starts on Sunday" },
    { id: "2", name: "Monday", subtitle: "Week starts on Monday" },
    { id: "3", name: "Tuesday", subtitle: "Week starts on Tuesday" },
    { id: "4", name: "Wednesday", subtitle: "Week starts on Wednesday" },
    { id: "5", name: "Thursday", subtitle: "Week starts on Thursday" },
    { id: "6", name: "Friday", subtitle: "Week starts on Friday" },
    { id: "7", name: "Saturday", subtitle: "Week starts on Saturday" },
  ];

  useEffect(() => {
    if (userData?.profile?.firstDayofWeek) {
      const dayStr = userData.profile.firstDayofWeek;
      const formatted =
        dayStr.charAt(0).toUpperCase() + dayStr.slice(1).toLowerCase();
      setSelectedDay(formatted);
    }
  }, [userData]);

  const handleDayChange = async (day) => {
    if (loading || selectedDay === day) return;
    setSelectedDay(day);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { firstDayofWeek: day.toLowerCase() },
      "First day of week updated successfully"
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"First Day of the Week"} />}
      scrollEnabled={true}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      {weekDays.map((day, index) => (
        <ToggleCard
          key={day.id}
          title={day.name}
          subtitle={day.subtitle}
          value={selectedDay === day.name}
          onPress={() => handleDayChange(day.name)}
          isBorder={true}
          isOption={true}
          marginBottom={index === weekDays.length - 1 ? 40 : 0}
        />
      ))}
    </ScreenWrapper>
  );
};

export default FirstDayOfWeek;

const styles = StyleSheet.create({});
