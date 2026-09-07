import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Divider from "../../../../components/Divider";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import ToggleCard from "../molecules/ToggleCard";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const TimeFormat = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedFormat, setSelectedFormat] = useState("24h");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.profile?.timeFormat) {
      setSelectedFormat(userData.profile.timeFormat);
    }
  }, [userData]);

  const handleFormatChange = async (format) => {
    if (loading || selectedFormat === format) return;
    setSelectedFormat(format);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { timeFormat: format },
      "Time format updated successfully",
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Time Format"} />}
      scrollEnabled={false}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      <ToggleCard
        title={"12h"}
        subtitle={"12-hour clock (E.g. 2:30 PM)"}
        value={selectedFormat === "12h"}
        onPress={() => handleFormatChange("12h")}
        isBorder={true}
        isOption={true}
      />

      <ToggleCard
        title={"24h"}
        subtitle={"24-hour clock (E.g. 14:30)"}
        value={selectedFormat === "24h"}
        onPress={() => handleFormatChange("24h")}
        isBorder={true}
        isOption={true}
        marginBottom={40}
      />
    </ScreenWrapper>
  );
};

export default TimeFormat;

const styles = StyleSheet.create({});
