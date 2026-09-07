import React from "react";
import {View, StyleSheet} from "react-native";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import Text from "./ScaledText";
const CopyrightFooter = ({ paddingTop = 32, paddingBottom = 56 }) => {
  return (
    <View style={[styles.container, { paddingTop, paddingBottom }]}>
      <Text style={styles.text}>
        ©2025 <Text style={styles.bold}>Sola Group</Text>. All rights reserved.{" "}
        <Text style={styles.bold}>Sola Group, SG</Text>, the{" "}
        <Text style={styles.bold}>Sola Group</Text> logo,{" "}
        <Text style={styles.bold}>BandMate, BandMate</Text> (stylized),{" "}
        <Text style={styles.bold}>BM, BM</Text> logo are trademarks or
        registered of <Text style={styles.bold}>Sola Group</Text> in the USA and
        elsewhere.{"\n"}
        All other trademarks are the property of their respective owners.
      </Text>
    </View>
  );
};

export default CopyrightFooter;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: COLORS.gray48,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 10 * 1.4,
  },
  bold: {
    color: "#fff",
    fontSize: 10,
    lineHeight: 10 * 1.4,
    fontFamily: fonts.medium,
  },
});
