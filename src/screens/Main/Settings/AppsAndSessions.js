import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import CustomText from "../../../components/CustomText";
import CustomButton from "../../../components/CustomButton";
import Divider from "../../../components/Divider";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { ToastMessage } from "../../../utils/ToastMessage";

const initialSessions = [
  {
    id: "1",
    device: "iPhone 15 Pro",
    location: "Zurich, Switzerland",
    status: "Active now",
    isCurrent: true,
    ip: "194.230.145.88",
  },
  {
    id: "2",
    device: "MacBook Pro • Apple Safari",
    location: "Geneva, Switzerland",
    status: "Last active 2 hours ago",
    isCurrent: false,
    ip: "194.230.145.92",
  },
  {
    id: "3",
    device: "iPad Air",
    location: "Lugano, Switzerland",
    status: "Last active yesterday",
    isCurrent: false,
    ip: "85.62.110.19",
  },
];

const AppsAndSessions = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [sessions, setSessions] = useState(initialSessions);
  const [loading, setLoading] = useState(false);

  const handleTerminateSession = (id) => {
    setSessions((prev) => prev.filter((item) => item.id !== id));
    ToastMessage("Session logged out successfully", "success");
  };

  const handleLogoutAllOther = () => {
    setLoading(true);
    setTimeout(() => {
      setSessions((prev) => prev.filter((item) => item.isCurrent));
      setLoading(false);
      ToastMessage("Logged out of all other sessions", "success");
    }, 600);
  };

  const renderSessionItem = ({ item, index }) => (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <View style={styles.deviceRow}>
            <CustomText
              label={item.device}
              fontSize={16}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            {item.isCurrent && (
              <CustomText
                label="• Current session"
                fontSize={13}
                fontFamily={fonts.medium}
                color="#16A34A"
              />
            )}
          </View>
          <CustomText
            label={`${item.location} • IP: ${item.ip}`}
            fontSize={13}
            color={colors.textSecondary}
            marginTop={4}
          />
          <CustomText
            label={item.status}
            fontSize={12}
            color={item.isCurrent ? "#16A34A" : colors.textSecondary}
            marginTop={4}
          />
        </View>

        {!item.isCurrent && (
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDark ? "rgba(238,16,69,0.15)" : "#EE104514",
              },
            ]}
            onPress={() => handleTerminateSession(item.id)}
            activeOpacity={0.7}
          >
            <CustomText
              label="Log out"
              fontSize={13}
              fontFamily={fonts.medium}
              color="#EE1045"
            />
          </TouchableOpacity>
        )}
      </View>

      {index !== sessions.length - 1 && (
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
      headerUnScrollable={() => <Header title="Apps and sessions" />}
    >
      <View style={styles.container}>
        <CustomText
          label="See information about when you logged into your account and manage your active login sessions."
          fontSize={14}
          lineHeight={14 * 1.4}
          color={colors.textSecondary}
          marginBottom={24}
          marginTop={8}
        />

        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />

        {sessions.length > 1 && (
          <View style={{ marginTop: 28 }}>
            <CustomButton
              title="Log out of all other sessions"
              backgroundColor={isDark ? "rgba(238,16,69,0.15)" : "#EE104514"}
              color="#EE1045"
              onPress={handleLogoutAllOther}
              loading={loading}
              height={48}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default AppsAndSessions;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
