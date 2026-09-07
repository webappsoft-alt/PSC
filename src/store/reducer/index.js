import { combineReducers } from "redux";

import { authConfigsSlice } from "./AuthConfig";
import { usersSlice } from "./usersSlice";
import { chatSlice } from "./ChatSlice";
import appSliceReducer from "./appSlice";
import bottomSheetSliceReducer from "./bottomSheetSlice";
import { MatchingSlice } from "./MatchingSlice";
import { notificationSlice } from "./NotiSlice";
import playerSliceReducer from "./playerSlice";

export const rootReducer = combineReducers({
  users: usersSlice.reducer,
  authConfig: authConfigsSlice.reducer,
  chat: chatSlice.reducer,
  matching: MatchingSlice.reducer,
  notification: notificationSlice.reducer,
  navApp: appSliceReducer,
  navBottomSheet: bottomSheetSliceReducer,
  player: playerSliceReducer,
});
