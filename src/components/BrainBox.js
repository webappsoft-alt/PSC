import { NativeEventEmitter, NativeModules } from "react-native";
import React, { useEffect, useCallback, useRef } from "react";
import { PermissionsAndroid, View, Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import {
  setLocation,
  setSelectedAccessibility,
  setSelectedComfort,
  setSelectedExterior,
  setSelectedVehicle,
  setTotalDuration,
} from "../store/reducer/usersSlice";
import { put } from "../services/ApiRequest";
import SocketProvider from "./SocketProvider";

const { LocationModule } = NativeModules;

const BrainBox = ({ children }) => {
  const dispatch = useDispatch();
  const isToken = useSelector((state) => state.authConfig.token);
  const isRunning = useSelector(
    (state) => state.users.isBackgroundServiceRunning
  );
  // const isToken = true;
  // const isRunning = true;

  // Keep track of service state to prevent unnecessary restarts
  const serviceStateRef = useRef(false);
  const eventListenerRef = useRef(null);

  // Handle location permission requests
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        ]);

        return (
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.ACCESS_COARSE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else if (Platform.OS === "ios") {
        // For iOS, we'll handle permissions in the native module
        // The LocationModule will request permissions when needed
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Permission request error:", err);
      return false;
    }
  };

  // Send location updates to the API
  const sendLocationToAPI = async (data) => {
    console.log("=========data", data);
    // if (isToken && isRunning) {
    //   try {
    //     const body = {
    //       location: {
    //         type: "Point",
    //         coordinates: [data?.longitude, data?.latitude],
    //       },
    //     };
    //     await put("users/update-location", body);
    //     console.log("Location sent to API successfully");
    //   } catch (error) {
    //     console.error("API Error:", error);
    //   }
    // }
  };

  // Initialize location event listener
  const setupLocationListener = useCallback(() => {
    if (!isToken || !isRunning) return null;

    const eventEmitter = new NativeEventEmitter(LocationModule);
    return eventEmitter.addListener("locationUpdate", (event) => {
      console.log("locationUpdate", event);
      if (isToken && isRunning) {
        sendLocationToAPI(event);
      }
    });
  }, [isToken, isRunning]);

  // Start location service
  const startLocationService = useCallback(async () => {
    if (!isToken) return false;

    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        await LocationModule.startLocationService();
        console.log("Location service started successfully");
        return true;
      } catch (error) {
        console.error("Error starting location service:", error);
        return false;
      }
    }
    return false;
  }, [isToken]);

  // Stop location service
  const stopLocationService = useCallback(async () => {
    try {
      if (eventListenerRef.current) {
        eventListenerRef.current.remove();
        eventListenerRef.current = null;
      }
      await LocationModule.stopLocationService();
      console.log("Location service stopped successfully");
      return true;
    } catch (error) {
      console.error("Error stopping location service:", error);
      return false;
    }
  }, []);

  // Main service state management
  useEffect(() => {
    const handleServiceState = async () => {
      const shouldRun = isRunning && isToken;

      if (shouldRun === serviceStateRef.current) return;
      serviceStateRef.current = shouldRun;

      if (shouldRun) {
        const started = await startLocationService();
        if (started) {
          eventListenerRef.current = setupLocationListener();
        }
      } else {
        await stopLocationService();
      }
    };

    handleServiceState();

    return () => {
      stopLocationService();
      serviceStateRef.current = false;
    };
  }, [
    isRunning,
    isToken,
    startLocationService,
    stopLocationService,
    setupLocationListener,
  ]);

  useEffect(() => {
    dispatch(setSelectedVehicle({}));
    dispatch(setSelectedComfort([]));
    dispatch(setSelectedExterior([]));
    dispatch(setSelectedAccessibility([]));
    dispatch(setTotalDuration(""));
  }, []);

  return (
    <SocketProvider>
      <View style={{ flex: 1 }}>{children}</View>
    </SocketProvider>
  );
};

export default BrainBox;
