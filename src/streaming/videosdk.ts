import axios from "axios";
import "./videosdk-webrtc-shim";
import { post } from "./ApiRequest";

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
    const res: any = await post("live-stream/generate-token", {});
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
    const res = await axios.get(`https://api.videosdk.live/v2/rooms/validate/${meetingId}`, {
      headers: {
        authorization: token,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error validating meeting:", error);
    throw error;
  }
};

export default axios;
