import axios from "axios";
import "./videosdk-webrtc-shim";
import { post } from "../services/ApiRequest";
import moment from "moment/moment";

let didRegister = false;
let registerPromise: Promise<void> | null = null;

export const ensureVideoSdkRegistered = async () => {
  if (didRegister) return;
  if (registerPromise) return registerPromise;
  registerPromise = import("@videosdk.live/react-native-sdk")
    .then((mod: any) => {
      if (didRegister) return;
      if (typeof mod?.register === "function") {
        mod.register();
      }
      didRegister = true;
    })
    .finally(() => {
      registerPromise = null;
    });
  return registerPromise;
};

export const getToken = async () => {
  try {
    const res = await post("live-stream/generate-token", {});
    return res.data.data;
  } catch (error) {
    console.error("Error getting token:", error);
    throw error;
  }
};

export const createMeeting = async (payload: any) => {
  try {
    const res: any = await post("live-stream/create-room", payload);
    return res?.data?.data ?? res?.data;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const validateMeeting = async (meetingId: string, token: string) => {
  try {
    const res = await axios.get(
      `https://api.videosdk.live/v2/rooms/validate/${meetingId}`,
      {
        headers: {
          authorization: token,
        },
      },
    );
    return res.data;
  } catch (error) {
    console.error("Error validating meeting:", error);
    throw error;
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

export default axios;
