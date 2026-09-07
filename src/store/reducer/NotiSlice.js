import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notificationDot: false,
  isInAppVisible: false,
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
  },
});

export const { setNotificationDot, setIsInAppVisible } = notificationSlice.actions;
