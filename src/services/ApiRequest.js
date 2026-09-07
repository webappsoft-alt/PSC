import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";

import { ToastMessage } from "../utils/ToastMessage";
import { triggerSessionExpiry } from "../utils/sessionHandler";
import { endPoints } from "./ENV";

let instance = axios.create({
  baseURL: endPoints.BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

const checkInternetConnection = async () => {
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      ToastMessage("No Internet Connection", "error");
      throw new Error("No Internet Connection");
    }
  } catch (error) {
    // console.error("Network check failed:", error);
    throw error;
  }
};

const handleApiError = (error, operation, url) => {
  console.log(`Error with URL: ${endPoints.BASE_URL}${url}`);
  console.log("================================================");

  if (error.response) {
    const responseData = error.response.data;
    const isHtmlError =
      typeof responseData === "string" && /<html|<!doctype/i.test(responseData);
    const safeResponseData = isHtmlError
      ? "[HTML error response omitted]"
      : responseData || error.response;
    const responseMessage =
      !isHtmlError && responseData?.message
        ? responseData.message
        : error.response.statusText || "Something went wrong";

    console.log(`${operation} Error Status:`, error.response.status);
    console.log(`${operation} Error Message:`, responseMessage);
    console.log(`${operation} Error:`, safeResponseData);
    const errorMessage = responseMessage;
    // ToastMessage(errorMessage, "error");

    const errorInfo = {
      status: error.response.status,
      data: isHtmlError ? null : responseData,
      message: errorMessage,
      isHtmlError,
    };
    throw errorInfo;
  } else if (error.request) {
    console.log(`${operation} Network Error:`, error.message);
    ToastMessage("Network error. Please check your connection.", "error");

    const errorInfo = {
      status: 0,
      message: "Network error",
      originalError: error.message,
    };
    throw errorInfo;
  } else {
    console.log(`${operation} Unexpected Error:`, error.message);
    ToastMessage("An unexpected error occurred", "error");

    const errorInfo = {
      status: -1,
      message: error.message,
    };
    throw errorInfo;
  }
};

instance.interceptors.request.use(
  async (config) => {
    try {
      await checkInternetConnection();
      const token = await AsyncStorage.getItem("token");

      const socketId = await AsyncStorage.getItem("socketId");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
        config.headers["socket-id"] = socketId;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    const isAuthRequest =
      originalRequest.url.includes("auth/login") ||
      originalRequest.url.includes("auth/send-signup-otp") ||
      originalRequest.url.includes("auth/check-email") ||
      originalRequest.url.includes("auth/forgot-password") ||
      originalRequest.url.includes("auth/verify-reset-otp") ||
      originalRequest.url.includes("auth/verify-signup-otp") ||
      originalRequest.url.includes("auth/reset-password");

    if (
      error.response?.statusCode === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const token = await AsyncStorage.getItem("token");

        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (token && !refreshToken) {
          throw new Error("No refresh token available");
        }

        const newAccessToken = await renewAuthToken(refreshToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        return instance(originalRequest);
      } catch (refreshError) {
        // console.error("Token refresh failed:", refreshError);

        await AsyncStorage.multiRemove(["token", "refreshToken"]);

        // Trigger session expiry modal
        triggerSessionExpiry();

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

const requestGet = async (url, params = {}) => {
  try {
    const response = await instance.get(url, { params });
    return response;
  } catch (error) {
    handleApiError(error, "GET", url);
  }
};

const requestPost = async (url, data = {}) => {
  try {
    const response = await instance.post(url, data);
    return response;
  } catch (error) {
    handleApiError(error, "POST", url);
  }
};

const requestPatch = async (url, data = {}) => {
  try {
    const response = await instance.patch(url, data);
    return response;
  } catch (error) {
    handleApiError(error, "PATCH", url);
  }
};

const requestPut = async (url, data = {}) => {
  try {
    const response = await instance.put(url, data);
    return response;
  } catch (error) {
    handleApiError(error, "PUT", url);
  }
};

const requestDelete = async (url, data = {}) => {
  try {
    const response = await instance.delete(url, { data });
    return response;
  } catch (error) {
    handleApiError(error, "DELETE", url);
  }
};

const renewAuthToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${endPoints.BASE_URL}auth/refresh-token`,
      { refreshToken },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const newToken = response.data.tokens;
    await AsyncStorage.setItem("token", newToken?.accessToken);
    await AsyncStorage.setItem("refreshToken", newToken?.refreshToken);

    console.log("Token refreshed successfully");
    return newToken;
  } catch (error) {
    console.error(
      "Token renewal failed:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

const get = requestGet;
const post = requestPost;
const put = requestPut;
const patch = requestPatch;
const del = requestDelete;

export { del, get, patch, post, put };
