import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee from "@notifee/react-native";
import {
  getMessaging,
  AuthorizationStatus,
  requestPermission as messagingRequestPermission,
  registerDeviceForRemoteMessages,
  getToken as messagingGetToken,
} from "@react-native-firebase/messaging";
import axios from "axios";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Location from "expo-location";
import moment from "moment";
import { PermissionsAndroid, Platform } from "react-native";
import { ToastMessage } from "./ToastMessage";

import Constants from "expo-constants";

export const API_KEY = "AIzaSyB3Tj9fWzywtOncQ7vNjcErxRM5E--WlDA";

const parseNativeUploadBody = (body) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const uploadMultipartWithFallback = async ({
  url,
  fileUri,
  fieldName,
  mimeType,
  token,
  buildFormData,
}) => {
  if (Platform.OS !== "web" && fileUri) {
    try {
      const nativeResponse = await FileSystemLegacy.uploadAsync(url, fileUri, {
        fieldName,
        httpMethod: "POST",
        mimeType,
        uploadType: FileSystemLegacy.FileSystemUploadType.MULTIPART,
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const parsedBody = parseNativeUploadBody(nativeResponse?.body);
      const isSuccessStatus =
        nativeResponse?.status >= 200 && nativeResponse?.status < 300;
      if (isSuccessStatus && parsedBody) {
        return parsedBody;
      }
    } catch (error) {
      console.log(
        "Native upload failed, falling back to axios:",
        error?.message || error,
      );
    }
  }

  const formData = buildFormData();
  const res = await axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  return res?.data;
};

export const uploadAndGetUrl = async (file) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const imageUri = file?.path || file?.fileCopyUri || file?.uri || "";
    const uploadResponse = await uploadMultipartWithFallback({
      url: `https://viral.sola-group.ch/api/upload-image`,
      // url: `https://xjnhtpzb-10000.inc1.devtunnels.ms/api/upload-image`,
      fileUri: imageUri,
      fieldName: "image",
      mimeType: file?.type || "image/jpeg",
      token,
      buildFormData: () => {
        const formData = new FormData();
        formData.append("image", {
          type: file?.type || "image/jpeg",
          name: file?.name || file?.fileName || "photo.jpg",
          uri: imageUri,
        });
        return formData;
      },
    });
    return uploadResponse?.image;
  } catch (err) {
    console.log("================err", err?.response?.data || err);
    ToastMessage(
      err?.response?.data?.message || "Something failed! Please try again",
      "error",
    );
  }
};

export const uploadFileGetUrl = async (file, filetype = "application/pdf") => {
  try {
    const token = await AsyncStorage.getItem("token");
    const fileUri = file?.localUri || file?.uri || file?.path || "";
    return await uploadMultipartWithFallback({
      url: `https://viral.sola-group.ch/api/upload-file`,
      // url: `https://xjnhtpzb-10000.inc1.devtunnels.ms/api/upload-file`,
      fileUri,
      fieldName: "file",
      mimeType: filetype,
      token,
      buildFormData: () => {
        const formData = new FormData();
        formData.append("file", {
          uri: fileUri,
          type: filetype,
          name: file?.name || "file",
        });
        return formData;
      },
    });
  } catch (err) {
    console.log("Backend error--->", err.response?.data || err.message);
    ToastMessage("Upload Again");
  }
};

export const isValidEmail = (emailValue) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailValue);
};

export const requestPermission = async () => {
  if (Platform.OS === "ios") {
    await notifee.requestPermission();
  }
  try {
    const authStatus = await messagingRequestPermission(getMessaging(), {
      provisional: true,
      announcement: true,
    });
    if (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    ) {
      return await getToken();
    }
    ToastMessage("Notification permissnion denied by user.", "error");
    return null;
  } catch (err) {
    console.log("Notification permission error:", err?.message || err);
    return null;
  }
};
export const getToken = async () => {
  if (Platform.OS === "android") {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
  const appOwnership = Constants?.appOwnership;
  const executionEnvironment = Constants?.executionEnvironment;
  const isExpoGo =
    appOwnership === "expo" ||
    executionEnvironment === "storeClient" ||
    executionEnvironment === "storeClient";
  if (isExpoGo) {
    ToastMessage(
      "FCM token is not available in Expo Go. Use a development build (EAS).",
      "error",
    );
    return null;
  }
  const fcmToken = await AsyncStorage.getItem("fcmToken");

  if (fcmToken) {
    return fcmToken;
  } else {
    try {
      const isIOSSimulator =
        Platform.OS === "ios" &&
        (Constants?.platform?.ios?.simulator === true ||
          /simulator/i.test(Constants?.deviceName || "") ||
          /simulator/i.test(Constants?.platform?.ios?.model || ""));
      if (isIOSSimulator) {
        ToastMessage(
          "Push notifications don't work on the iOS Simulator. Please test on a physical device.",
          "error",
        );
        return null;
      }
      const messaging = getMessaging();
      if (Platform.OS === "ios") {
        await registerDeviceForRemoteMessages(messaging);
      }
      const authStatus = await messagingRequestPermission(messaging, {
        provisional: true,
        announcement: true,
      });
      if (
        authStatus !== AuthorizationStatus.AUTHORIZED &&
        authStatus !== AuthorizationStatus.PROVISIONAL
      ) {
        return null;
      }
      const token = await messagingGetToken(messaging);
      if (token) {
        await AsyncStorage.setItem("fcmToken", token);
      }
      return token || null;
    } catch (err) {
      console.log("FCM token fetch error:", {
        message: err?.message,
        code: err?.code,
        nativeErrorCode: err?.nativeErrorCode,
        nativeErrorMessage: err?.nativeErrorMessage,
      });
      ToastMessage("Notification token fetch failed", "error");
      return null;
    }
  }
};

// Helper: ek accuracy level ke saath position try karna
const tryGetPosition = async (accuracy, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, timeoutMs);

    Location.getCurrentPositionAsync({ accuracy })
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const getUserLocation = async () => {
  try {
    // Step 1: Permission check
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("[Location] Permission denied:", status);
      return null;
    }

    // Step 2: Location services enabled?
    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      console.warn("[Location] Location services disabled");
      ToastMessage(
        "Location services band hain — settings mein on karein",
        "warning",
      );
      return null;
    }

    let coords = null;

    // Step 3: Pehle last known position try karo (Android pe fast & reliable)
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // 1 minute se purana na ho
        requiredAccuracy: 500, // 500 meter se zyada off na ho
      });
      if (lastKnown?.coords) {
        console.log("[Location] Last known position mili:", lastKnown.coords);
        coords = lastKnown.coords;
      }
    } catch (e) {
      console.log("[Location] Last known position nahi mili, fresh try...");
    }

    // Step 4: Agar last known nahi mili, accuracy kam karte hue retry
    if (!coords) {
      const attempts = [
        { accuracy: Location.Accuracy.High, timeout: 5000, label: "High" },
        {
          accuracy: Location.Accuracy.Balanced,
          timeout: 8000,
          label: "Balanced",
        },
        { accuracy: Location.Accuracy.Lowest, timeout: 10000, label: "Lowest" },
      ];

      for (const attempt of attempts) {
        try {
          console.log(`[Location] Trying accuracy: ${attempt.label}...`);
          const result = await tryGetPosition(
            attempt.accuracy,
            attempt.timeout,
          );
          if (result?.coords) {
            coords = result.coords;
            console.log(`[Location] Position mili (${attempt.label}):`, coords);
            break;
          }
        } catch (err) {
          const msg = err?.message || String(err);
          const isExpected =
            msg === "TIMEOUT" ||
            msg.includes("unavailable") ||
            err?.code === "ERR_CURRENT_LOCATION_IS_UNAVAILABLE";

          if (isExpected) {
            console.warn(`[Location] ${attempt.label} failed, next try...`);
          } else {
            console.error(
              `[Location] Unexpected error (${attempt.label}):`,
              err,
            );
          }
          // Loop continue — next accuracy try hogi
        }
      }
    }

    // Step 5: Saari attempts fail
    if (!coords) {
      console.warn("[Location] Saari attempts fail ho gayi");
      ToastMessage(
        "Location nahi mili — location services check karein",
        "warning",
      );
      return null;
    }

    // Step 6: Reverse geocoding (optional, non-blocking)
    let addressData = null;
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${API_KEY}`,
      );
      addressData = response?.data?.results?.[0]?.formatted_address ?? null;
      console.log("[Location] Address:", addressData);
    } catch (geocodeError) {
      console.warn("[Location] Geocoding fail, address ke bina continue...");
    }

    return {
      address: addressData,
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    };
  } catch (error) {
    console.error("[Location] Unexpected top-level error:", error);
    ToastMessage("Location error — location services enabled hain?", "warning");
    return null;
  }
};

export const formatChatTimestamp = (isoString) => {
  if (!isoString) return "";

  const date = new Date(isoString);

  // Time → 04:45 pm
  const time = date
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  // Date → Mar 12, 2025
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return `${time} - ${formattedDate}`;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};
export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();

  // Compare dates in local timezone by using toLocaleDateString
  const dateLocalString = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayLocalString = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const isToday = dateLocalString === todayLocalString;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayLocalString = yesterday.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const isYesterday = dateLocalString === yesterdayLocalString;

  if (isToday) {
    return "Today";
  } else if (isYesterday) {
    return "Yesterday";
  } else {
    const options = { month: "long", day: "numeric", year: "numeric" };
    return date.toLocaleDateString(undefined, options);
  }
};
export const formatInstagramTime = (date) => {
  const now = moment();
  const created = moment.utc(date).local();

  if (!created.isValid()) return "";

  const diffInSeconds = now.diff(created, "seconds");
  const diffInMinutes = now.diff(created, "minutes");
  const diffInHours = now.diff(created, "hours");
  const diffInDays = now.diff(created, "days");
  const diffInWeeks = now.diff(created, "weeks");
  const diffInMonths = now.diff(created, "months");
  const diffInYears = now.diff(created, "years");

  if (diffInSeconds < 60) return `${Math.max(0, diffInSeconds)}s`;
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  return `${diffInYears}y`;
};

export const humanizeNumber = (value, label) => {
  if (!value || value === 0) {
    return label ? `0 ${label}s` : "0";
  }

  let formatted = "";

  if (value >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (value >= 1_000) {
    formatted = (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  } else {
    formatted = value.toString();
  }

  if (!label) return formatted;

  // Singular / plural handling
  if (value === 1) {
    return `${formatted} ${label}`;
  }

  return `${formatted} ${label}s`;
};

export const formatNumber = (num) => {
  if (num == null || num === "") {
    return "0";
  }
  const n = typeof num === "number" ? num : Number(num);
  if (!Number.isFinite(n)) {
    return "0";
  }
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return String(Math.trunc(n));
};
