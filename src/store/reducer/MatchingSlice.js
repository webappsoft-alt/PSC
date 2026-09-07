import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cardData: [],
};
export const MatchingSlice = createSlice({
  name: "matching",
  initialState: initialState,
  reducers: {
    setCardData(state, action) {
      state.cardData = action.payload;
    },
    appendCardData(state, action) {
      state.cardData = [...state.cardData, ...action.payload];
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

export const { setCardData, appendCardData, removeCard, addCardToTop, updateUserFollowers } =
  MatchingSlice.actions;
