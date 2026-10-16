import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notificationDot: false,
  isInAppVisible: false,
  // Figma feed: "NEW FOLLOWER" toast under the header (latest follow event)
  newFollower: null,
};
export const notificationSlice = createSlice({
  name: "notification",
  initialState: initialState,
  reducers: {
    setNotificationDot: (state, action) => {
      state.notificationDot = action.payload;
    },
    setIsInAppVisible: (state, action) => {
      state.isInAppVisible = action.payload;
    },
    setNewFollower: (state, action) => {
      state.newFollower = action.payload;
    },
  },
});

export const { setNotificationDot, setIsInAppVisible, setNewFollower } =
  notificationSlice.actions;
