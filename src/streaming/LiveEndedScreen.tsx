import Blur from "@/components/Blur";
import CustomText from "@/components/CustomText";
import ExpoIcons from "@/components/ExpoIcons";
import { Images } from "@/assets/images";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {Image, StyleSheet, TouchableOpacity, View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/assets/fonts";
import Text from "../components/ScaledText";

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function LiveEndedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    durationSeconds?: string;
    totalViewers?: string;
  }>();
  const durationSeconds = Number(params.durationSeconds || "0");
  const totalViewers = Number(params.totalViewers || "0");

  return (
    <View style={styles.container}>
      <View style={[styles.topControls, { paddingTop: insets.top + 2 }]}>
        <View style={[styles.row, { gap: 12 }]}>
          <TouchableOpacity
            style={[styles.controlButton, { overflow: "hidden" }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Blur blurType="light" />
            <Image source={Images.back} style={{ height: 20, width: 20 }} />
          </TouchableOpacity>
          <CustomText
            label={"Back"}
            fontFamily={"Poppins_600SemiBold"}
            fontSize={20}
          />
        </View>
      </View>

      <View style={styles.emptyContainer}>
        <ExpoIcons
          family="MaterialIcons"
          name="photo-camera"
          size={62}
          color="#FFFFFFCC"
        />
        <CustomText label="Live Ended" textStyle={styles.emptyText1} />
        <CustomText
          label={`Lasted: ${formatDuration(durationSeconds)}`}
          textStyle={styles.emptyText}
        />
        <View style={styles.viewerRow}>
          <ExpoIcons
            family="MaterialIcons"
            name="group"
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.viewerCount}>{Math.max(0, totalViewers)}</Text>
          <Text style={styles.viewerLabel}>viewers</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 14 * 1.4,
    color: "rgba(255, 255, 255, 0.48)",
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: -12,
  },
  emptyText1: {
    fontSize: 32,
    lineHeight: 32 * 1.4,
    color: "#ffffff",
    fontFamily: "Poppins_700Bold_Italic",
    textAlign: "center",
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:'center',
    marginTop:-5
  },
  viewerCount: {
    color: "#fff",
    fontSize: 14,
    fontFamily: fonts.medium,
    marginLeft: 8,
    marginRight: 4,
    paddingTop:2
  },
  viewerLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 30,
    fontFamily: fonts.medium,
  },
});
