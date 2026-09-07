import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  showRadioPlayer: false,
  isTabBarVisible: true,
  audioUrl: null,
  isPlaying: false,
  isLoading: false,
  playingRadioId: null,
  playingRadioData: null,
};

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setShowRadioPlayer: (state, action) => {
      state.showRadioPlayer = action.payload;
    },
    toggleRadioPlayer: (state) => {
      state.showRadioPlayer = !state.showRadioPlayer;
    },
    setIsTabBarVisible: (state, action) => {
      state.isTabBarVisible = action.payload;
    },
    setAudioUrl: (state, action) => {
      state.audioUrl = action.payload;
    },
    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setPlayingRadioId: (state, action) => {
      state.playingRadioId = action.payload;
    },
    setPlayingRadioData: (state, action) => {
      state.playingRadioData = action.payload;
    },
  },
});

export const {
  setShowRadioPlayer,
  toggleRadioPlayer,
  setIsTabBarVisible,
  setAudioUrl,
  setPlaying,
  setLoading,
  setPlayingRadioId,
  setPlayingRadioData,
} = playerSlice.actions;
export default playerSlice.reducer;
