import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_MATCHING_FILTERS } from "../../utils/matchingFilters";

const initialState = {
  cardData: [],
  filters: DEFAULT_MATCHING_FILTERS,
};
export const MatchingSlice = createSlice({
  name: "matching",
  initialState: initialState,
  reducers: {
    setCardData(state, action) {
      state.cardData = action.payload;
    },
    appendCardData(state, action) {
      // Skip profiles that are already in the stack so a page that overlaps
      // with the previous one cannot show the same card twice
      const existingIds = new Set(state.cardData.map((item) => item?._id));
      const newCards = (action.payload || []).filter(
        (item) => item?._id && !existingIds.has(item._id),
      );
      state.cardData = [...state.cardData, ...newCards];
    },
    setMatchingFilters(state, action) {
      state.filters = { ...DEFAULT_MATCHING_FILTERS, ...(action.payload || {}) };
    },
    removeCard(state) {
      state.cardData = state.cardData.slice(1);
    },
    addCardToTop(state, action) {
      state.cardData = [action.payload, ...state.cardData];
    },
    updateUserFollowers(state, action) {
      const { userId, followerId, isFollow } = action.payload;
      const user = state.cardData.find((item) => item._id === userId);
      if (user) {
        if (isFollow) {
          if (!user.stats?.followers?.includes(followerId)) {
            user.stats.followers = [...(user.stats?.followers || []), followerId];
          }
        } else {
          if (user.stats?.followers) {
            user.stats.followers = user.stats.followers.filter((id) => id !== followerId);
          }
        }
      }
    },
  },
});

export const {
  setCardData,
  appendCardData,
  removeCard,
  addCardToTop,
  updateUserFollowers,
  setMatchingFilters,
} =
  MatchingSlice.actions;
