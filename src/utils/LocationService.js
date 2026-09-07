import {
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  NativeModules,
} from "react-native";

const { GetCurrentLocation } = NativeModules;

class LocationService {
  static async getCurrentLocation() {
    try {
      const location = await GetCurrentLocation.getCurrentLocation();
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading,
        timestamp: location.timestamp,
        provider: location.provider,
      };
    } catch (err) {
      console.error("Native Location Error:", err.message);
      throw err;
    }
  }

  static async requestAndroidPermission() {
    try {
      // Check if permission is already granted
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (hasPermission) {
        return true;
      }

      // Request fine location permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message:
            "This app needs access to your precise location for better experience.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        // Try coarse location as fallback
        const coarseGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          {
            title: "Location Permission",
            message:
              "Allow approximate location access for basic functionality.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        return coarseGranted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return false;
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  }

  static async refreshLocation() {
    if (Platform.OS === "android") {
      const hasPermission = await this.requestAndroidPermission();
      if (hasPermission) {
        return await this.getCurrentLocation();
      } else {
        this.showPermissionAlert();
        throw new Error("Location permission denied");
      }
    } else {
      return await this.getCurrentLocation();
    }
  }

  static showPermissionAlert() {
    Alert.alert(
      "Location Permission Required",
      "This app needs location permission to provide location-based services. Please enable it in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
  }
}

export default LocationService;
