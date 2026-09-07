import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Divider from "../../../../components/Divider";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const DateFormat = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedFormat, setSelectedFormat] = useState("DD/MM/YYYY");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.profile?.dateFormat) {
      setSelectedFormat(userData.profile.dateFormat.toUpperCase());
    }
  }, [userData]);

  const handleFormatChange = async (format) => {
    if (loading || selectedFormat === format) return;
    setSelectedFormat(format);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { dateFormat: format.toLowerCase() },
      "Date format updated successfully"
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Date Format"} />}
      scrollEnabled={false}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      <ToggleCard
        title={"DD/MM/YYYY"}
        subtitle={"E.g. 10/06/2026"}
        value={selectedFormat === "DD/MM/YYYY"}
        onPress={() => handleFormatChange("DD/MM/YYYY")}
        isBorder={true}
        isOption={true}
      />

      <ToggleCard
        title={"MM/DD/YYYY"}
        subtitle={"E.g. 06/10/2026"}
        value={selectedFormat === "MM/DD/YYYY"}
        onPress={() => handleFormatChange("MM/DD/YYYY")}
        isBorder={true}
        isOption={true}
      />

      <ToggleCard
        title={"YYYY/MM/DD"}
        subtitle={"E.g. 2026/06/10"}
        value={selectedFormat === "YYYY/MM/DD"}
        onPress={() => handleFormatChange("YYYY/MM/DD")}
        isBorder={true}
        isOption={true}
        marginBottom={40}
      />
    </ScreenWrapper>
  );
};

export default DateFormat;

const styles = StyleSheet.create({});
