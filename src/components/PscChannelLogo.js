import { memo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

// PSC official channel mark (client, Nov 2026): the dark PSC star on a gold
// square — same star path as the launch screen (AnimatedSplash)
export const PSC_OFFICIAL_USERNAME = "pscofficial";
export const isPscOfficial = (user) =>
  !!user?.username && String(user.username).toLowerCase() === PSC_OFFICIAL_USERNAME;

const GOLD = "#A19375";
const STAR =
  "M40 0C40 0 42.207 20.5997 50.8036 29.1964C59.4002 37.793 80 40 80 40C80 40 59.4002 42.207 50.8036 50.8036C42.207 59.4002 40 80 40 80C40 80 37.793 59.4002 29.1964 50.8036C20.5997 42.207 0 40 0 40C0 40 20.5997 37.793 29.1964 29.1964C37.793 20.5997 40 0 40 0Z";

const PscChannelLogo = ({ size = 40, borderRadius = 8, style }) => {
  const star = Math.round(size * 0.6);
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius }, style]}>
      <Svg width={star} height={star} viewBox="0 0 80 80">
        <Path d={STAR} fill="#121212" />
      </Svg>
    </View>
  );
};

export default memo(PscChannelLogo);

const styles = StyleSheet.create({
  box: { backgroundColor: GOLD, alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
