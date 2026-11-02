import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  showRadioPlayer: false,
  isTabBarVisible: true,
  audioUrl: null,
  isPlaying: false,
  isLoading: false,
  playingRadioId: null,
  playingRadioData: null,
  // Radio / Audio Post detail is open: it shows its own full player, so the
  // floating mini player hides (playback keeps going through it).
  isPlayerSuppressed: false,
  // bumped by requestRadioPlay: PlayerCard (re)starts the stream even when
  // the URL is the one already in the store (same radio opened again)
  playRequest: 0,
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
    setPlayerSuppressed: (state, action) => {
      state.isPlayerSuppressed = !!action.payload;
    },
    // start this radio from the beginning (detail page, feed strip)
    requestRadioPlay: (state, action) => {
      const item = action.payload || {};
      state.playingRadioId = item._id || null;
      state.playingRadioData = item;
      state.audioUrl = item.audio || null;
      state.showRadioPlayer = !!item.audio;
      state.playRequest = (state.playRequest || 0) + 1;
    },
    // after a launch / reload nothing is loaded in the native player, so a
    // persisted "playing" radio can't be resumed
    resetRadioPlayback: (state) => {
      state.isPlaying = false;
      state.isLoading = false;
      state.showRadioPlayer = false;
      state.audioUrl = null;
      state.playingRadioId = null;
      state.playingRadioData = null;
      state.isPlayerSuppressed = false;
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
  setPlayerSuppressed,
  requestRadioPlay,
  resetRadioPlayback,
} = playerSlice.actions;
export default playerSlice.reducer;
