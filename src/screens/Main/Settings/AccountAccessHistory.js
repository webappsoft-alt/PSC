import React from "react";
import { FlatList, StyleSheet, View } from "react-native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";

import fonts from "../../../assets/fonts";
import { useTheme } from "../../../contexts/ThemeContext";

const historyData = [
  {
    id: "101",
    event: "Successful sign-in",
    device: "iPhone 15 Pro",
    location: "Zurich, Switzerland",
    time: "Today, 14:32",
    ip: "194.230.145.88",
    status: "Verified",
    statusColor: "#16A34A",
  },
  {
    id: "102",
    event: "Password verification check",
    device: "System Security Audit",
    location: "Zurich, Switzerland",
    time: "Yesterday, 19:10",
    ip: "Internal",
    status: "Routine",
    statusColor: "#4347FF",
  },
  {
    id: "103",
    event: "New device login detected",
    device: "MacBook Pro • Safari",
    location: "Geneva, Switzerland",
    time: "Aug 1, 09:15",
    ip: "194.230.145.92",
    status: "Verified",
    statusColor: "#16A34A",
  },
  {
    id: "104",
    event: "Two-Factor verification check",
    device: "iPhone 15 Pro",
    location: "Zurich, Switzerland",
    time: "Jul 28, 18:40",
    ip: "194.230.145.88",
    status: "Verified",
    statusColor: "#16A34A",
  },
];

const AccountAccessHistory = () => {
  const { colors } = useTheme();

  const renderHistoryItem = ({ item, index }) => (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <View style={styles.eventRow}>
            <CustomText
              label={item.event}
              fontSize={16}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${item.statusColor}1A` },
              ]}
            >
              <CustomText
                label={item.status}
                fontSize={11}
                fontFamily={fonts.medium}
                color={item.statusColor}
              />
            </View>
          </View>

          <CustomText
            label={`${item.device} • ${item.location}`}
            fontSize={13}
            color={colors.textSecondary}
            marginTop={4}
          />
          <CustomText
            label={`${item.time} • IP: ${item.ip}`}
            fontSize={12}
            color={colors.textSecondary}
            marginTop={4}
          />
        </View>
      </View>

      {index !== historyData.length - 1 && (
        <Divider
          thickness={1}
          color={colors.surfaceAlt}
          marginTop={14}
          marginBottom={14}
        />
      )}
    </View>
  );

  return (
    <ScreenWrapper
      scrollEnabled
      headerUnScrollable={() => <Header title="Account access history" />}
    >
      <View style={styles.container}>
        <CustomText
          label="Review the chronological log of sign-ins, device authentications, and security verifications performed on your account."
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={24}
          marginTop={8}
        />

        <FlatList
          data={historyData}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default AccountAccessHistory;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  row: {
    paddingVertical: 4,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
});
