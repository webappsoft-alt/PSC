import { useState, useCallback, useEffect } from "react";
import {
  NativeModules,
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import {
  getLocationWithPermission,
  resetLocationRequestState,
} from "./LocationUtils";

const { GetCurrentLocation } = NativeModules;

const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message:
              "This app needs access to your location to provide location-based services.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          return false;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            "Location Permission Required",
            "Please enable location permission from app settings to use this feature.",
            [{ text: "OK" }],
          );
          return false;
        }
      }
      // iOS: try requesting via native module if available
      if (Platform.OS === "ios") {
        try {
          if (
            GetCurrentLocation &&
            typeof GetCurrentLocation.requestPermission === "function"
          ) {
            const status = await GetCurrentLocation.requestPermission();
            // Normalize common status strings/booleans
            if (status === true || status === "granted" || status === 3) {
              return true;
            }
            if (status === "denied" || status === 1) {
              return false;
            }
            if (status === "restricted" || status === "blocked") {
              Alert.alert(
                "Location Permission Required",
                "Please enable location permission from Settings to use this feature.",
                [{ text: "OK" }],
              );
              return false;
            }
            // Fallback if unknown value
            return status ? true : false;
          }
          // If no explicit request method, allow iOS to prompt on first use
          return true;
        } catch (e) {
          // If request fails, do not block; allow prompt on first use
          return true;
        }
      }
      return true;
    } catch (err) {
      console.error("Permission request error:", err);
      return false;
    }
  };

  const getCurrentLocationHook = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the updated getLocationWithPermission from LocationUtils
      const locationData = await getLocationWithPermission();

      setLocation(locationData);
      setLoading(false);
      return locationData;
    } catch (err) {
      console.error("Location error in hook:", err);
      let errorMessage = err.userFriendlyMessage || "Failed to get location";

      if (err.code === "LOCATION_REQUEST_IN_PROGRESS") {
        errorMessage = "Location request in progress. Please wait...";
        // Reset state after delay
        setTimeout(() => {
          resetLocationRequestState();
          setLoading(false);
        }, 2000);
        return null;
      } else if (err.code === "PERMISSION_DENIED") {
        errorMessage = "Location permission denied";
      } else if (err.code === "LOCATION_DISABLED") {
        errorMessage =
          "Location services are disabled. Please enable them in settings.";
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature.",
          [{ text: "OK" }],
        );
      } else if (err.code === "TIMEOUT") {
        errorMessage = "Location request timed out. Please try again.";
      } else if (err.code === "LOCATION_ERROR" || err.code === "NATIVE_MODULE_UNAVAILABLE") {
        errorMessage = "Location services are temporarily unavailable.";
      }

      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  const stopLocationService = useCallback(() => {
    try {
      GetCurrentLocation.stopLocationService();
    } catch (err) {
      console.error("Error stopping location service:", err);
    }
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation: getCurrentLocationHook,
    clearLocation,
    stopLocationService,
  };
};

export default useLocation;
