import { StyleSheet } from "react-native";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import Header from "../../../../components/Header";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import Divider from "../../../../components/Divider";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const PreferredAddress = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedOption, setSelectedOption] = useState("friendly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.profile?.addressing) {
      setSelectedOption(userData.profile.addressing);
    }
  }, [userData]);

  const handleOptionChange = async (value) => {
    if (loading || selectedOption === value) return;
    setSelectedOption(value);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { addressing: value },
      "Preferred addressing updated successfully"
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Set Preferred Addressing"} />}
      scrollEnabled={false}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      <ToggleCard
        title={"Friendly"}
        subtitle={"E.g. Hi Ana, how was your day?"}
        value={selectedOption === "friendly"}
        onPress={() => handleOptionChange("friendly")}
        isBorder={true}
        isOption={true}
      />

      <ToggleCard
        title={"Corporate/Formal"}
        subtitle={"E.g. Hello Mr. Johnson, how was your day?"}
        value={selectedOption === "corporate"}
        onPress={() => handleOptionChange("corporate")}
        isBorder={true}
        isOption={true}
        marginBottom={40}
      />
    </ScreenWrapper>
  );
};

export default PreferredAddress;

const styles = StyleSheet.create({});
