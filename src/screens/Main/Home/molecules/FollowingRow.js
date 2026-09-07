import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "../../../../assets/images";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import { ToastMessage } from "../../../../utils/ToastMessage";

const FollowingRow = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent: "space-between",
          padding: 12,
          marginTop: insets.top + 18,
        },
      ]}
    >
      <View style={[styles.row, { gap: 6 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("SearchScreen")}
        >
          <Image
            source={Images.h1}
            style={[styles.icon1, { tintColor: colors.text }]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("CameraScreen")}
        >
          <Image
            source={Images.camera}
            style={[styles.icon1, { tintColor: colors.text }]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Events")}
        >
          <Image
            source={Images.todo}
            style={[styles.icon1, { tintColor: colors.text }]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate("CreateAudio")}
        >
          <Image
            source={Images.mic}
            style={[styles.icon1, { tintColor: colors.text }]}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.row, { gap: 10 }]}>
        <View style={[styles.row, { gap: 10 }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => ToastMessage("Coming Soon")}
          >
            <Image
              source={Images.globe}
              style={[styles.icon, { tintColor: colors.text }]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => ToastMessage("Coming Soon")}
          >
            <Image
              source={Images.filter}
              style={[styles.icon, { tintColor: colors.text }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(FollowingRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    height: 32,
    width: 32,
  },
  icon1: {
    height: 40,
    width: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 99,
  },
});
