import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ScreenWrapper from "../../../components/ScreenWrapper";
import CustomText from "../../../components/CustomText";

const SampleScreen = () => {
  return (
    <ScreenWrapper translucent>
      <CustomText label={"Usama"} />
    </ScreenWrapper>
  );
};

export default SampleScreen;

const styles = StyleSheet.create({});
