import { DeviceEventEmitter } from "react-native";

/**
 * Picker screens (Select Show / Genres / Age Rating / Visible To) hand their
 * result back to the form that opened them through this event, instead of
 * putting callbacks in navigation params.
 *   emitShowPick({ show }) · ({ genres }) · ({ ageRating }) · ({ visibleTo })
 *   · ({ removedShowId })
 */
export const SHOW_PICK_EVENT = "PSC_SHOW_PICK";

export const emitShowPick = (payload) =>
  DeviceEventEmitter.emit(SHOW_PICK_EVENT, payload || {});

export const onShowPick = (handler) => {
  const sub = DeviceEventEmitter.addListener(SHOW_PICK_EVENT, handler);
  return () => sub.remove();
};

/** Figma "Select-Category" (Age Rating) rows. */
export const AGE_RATINGS = [
  { value: 14, title: "+14", subtitle: "14 years old or older" },
  { value: 16, title: "+16", subtitle: "16 years old or older" },
  { value: 18, title: "+18", subtitle: "18 years old or older" },
  { value: 21, title: "+21", subtitle: "21 years old or older" },
];

/** New Show "Visible To" options (backend Show.availableTo). */
export const SHOW_VISIBILITY = [
  { value: "public", title: "Public", subtitle: "Everyone on PSC" },
  { value: "followers", title: "Followers", subtitle: "Only people who follow you" },
  { value: "subscribers", title: "Subscribers", subtitle: "Only your subscribers" },
];
