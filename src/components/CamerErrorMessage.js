import { useNavigation } from "@react-navigation/native";
import {
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";

const CameraErrorMessage = () => {
  const navigation = useNavigation();

  const openSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        const settingsUrl = "app-settings:";
        const canOpen = await Linking.canOpenURL(settingsUrl);
        if (canOpen) {
          await Linking.openURL(settingsUrl);
        } else {
          Alert.alert(
            "Error",
            "Unable to open settings. Please open them manually.",
          );
        }
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "An unexpected error occurred while opening settings.",
      );
    }
  };

  return (
    <View style={[styles.container]}>
      <StatusBar backgroundColor={COLORS.black} />
      <View style={styles.modal}>
        <CustomText
          fontSize={16}
          color={COLORS.white}
          alignSelf={"center"}
          label={"Permission Required!"}
          fontFamily={"Poppins_600SemiBold"}
        />
        <View style={{ paddingHorizontal: 13 }}>
          <CustomText
            fontSize={13}
            marginBottom={20}
            color={COLORS.white}
            textAlign={"center"}
            textTransform={"none"}
            label={`Open settings to enable the permission to use the Camera`}
          />
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.goBack()}
          >
            <CustomText
              label={"Later"}
              color={COLORS.white}
              alignSelf={"center"}
              fontFamily={"Poppins_600SemiBold"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn1} onPress={openSettings}>
            <CustomText
              color={"#000"}
              label={"Settings"}
              alignSelf={"center"}
              fontFamily={"Poppins_600SemiBold"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CameraErrorMessage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    zIndex: 2,
  },
  btn: {
    borderWidth: 2,
    borderColor: COLORS.gray2,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    width: 120,
  },
  btn1: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    borderRadius: 10,
    width: 120,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 10,
    marginBottom: 3,
  },
  modal: {
    backgroundColor: COLORS.black,
    borderRadius: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    width: "90%",
    paddingHorizontal: 8,
    alignItems: "center",
  },
});
