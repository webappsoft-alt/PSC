import { createSlice } from "@reduxjs/toolkit";

export const usersSlice = createSlice({
  name: "users",
  initialState: {
    userData: {},
    location: {},
    unseenBadge: {},
    vtcBusiness: {},
    vtcIndependent: {},
    isBackgroundServiceRunning: false,
    recentSearches: [],
    savedLocations: [],
    loginValue: "",
    isEmail: false,
    selectedVehicle: {},
    totalDistance: 0,
    totalDuration: 0,
    selectedComfort: [],
    selectedExterior: [],
    selectedAccessibility: [],
    foodAndBeverage: [],
    isExtraFoodAndBeverage: false,
    totalWalletBalance: 0,
    savedAccounts: [],
    // Profile selector (ported from Viral): the account in use, the local
    // per-account PIN hashes and the "Don't show next time" switch.
    activeAccountId: "",
    profilePins: {},
    pinSalt: "",
    skipProfileSelector: false,
  },

  reducers: {
    setUserData(state, action) {
      state.userData = action.payload;
    },
    setLocation(state, action) {
      const payload = { ...action.payload };
      if (payload.timestamp instanceof Date) {
        payload.timestamp = payload.timestamp.getTime();
      }
      state.location = payload;
    },

    setUnseenBadge(state, action) {
      state.unseenBadge = action.payload;
    },
    setIsBackgroundServiceRunning(state, action) {
      state.isBackgroundServiceRunning = action.payload;
    },
    setRecentSearches(state, action) {
      const incoming = Array.isArray(action.payload) ? action.payload : [];
      state.recentSearches = incoming.map((item) => {
        const next = { ...item };
        const ts = next?.timestamp;
        if (ts instanceof Date) {
          next.timestamp = ts.toISOString();
        } else if (typeof ts === "number") {
          next.timestamp = new Date(ts).toISOString();
        } else if (typeof ts !== "string") {
          next.timestamp = new Date().toISOString();
        }
        return next;
      });
    },
    setSavedLocations(state, action) {
      state.savedLocations = action.payload;
    },
    setLoginValue(state, action) {
      state.loginValue = action.payload;
    },
    setIsEmail(state, action) {
      state.isEmail = action.payload;
    },
    setSelectedVehicle(state, action) {
      state.selectedVehicle = action.payload;
    },
    setTotalDistance(state, action) {
      state.totalDistance = action.payload;
    },
    setVTCIndependent(state, action) {
      state.vtcIndependent = action.payload;
    },
    setVTCBusiness(state, action) {
      state.vtcBusiness = action.payload;
    },
    setTotalDuration(state, action) {
      state.totalDuration = action.payload;
    },
    setSelectedComfort(state, action) {
      state.selectedComfort = action.payload;
    },
    setSelectedExterior(state, action) {
      state.selectedExterior = action.payload;
    },
    setSelectedAccessibility(state, action) {
      state.selectedAccessibility = action.payload;
    },
    setFoodAndBeverage(state, action) {
      state.foodAndBeverage = action.payload;
    },
    setTotalBalance(state, action) {
      state.totalWalletBalance = action.payload;
    },
    setIsExtraFoodAndBeverage(state, action) {
      state.isExtraFoodAndBeverage = action.payload;
    },
    setSavedAccounts(state, action) {
      state.savedAccounts = action.payload || [];
    },
    addSavedAccount(state, action) {
      if (!Array.isArray(state.savedAccounts)) {
        state.savedAccounts = [];
      }
      const acc = action.payload;
      const existingIdx = state.savedAccounts.findIndex(
        (item) =>
          (item.email && acc.email && item.email === acc.email) ||
          (item.id && acc.id && item.id === acc.id)
      );
      if (existingIdx >= 0) {
        state.savedAccounts[existingIdx] = {
          ...state.savedAccounts[existingIdx],
          ...acc,
        };
      } else {
        state.savedAccounts.push(acc);
      }
    },
    setActiveAccountId(state, action) {
      state.activeAccountId = action.payload || "";
    },
    setProfilePin(state, action) {
      const { userId, hash } = action.payload || {};
      if (!userId) return;
      if (!state.profilePins || typeof state.profilePins !== "object") {
        state.profilePins = {};
      }
      if (hash) {
        state.profilePins[userId] = hash;
      } else {
        delete state.profilePins[userId];
      }
    },
    setPinSalt(state, action) {
      state.pinSalt = action.payload || "";
    },
    setSkipProfileSelector(state, action) {
      state.skipProfileSelector = !!action.payload;
    },
    removeSavedAccount(state, action) {
      if (!Array.isArray(state.savedAccounts)) {
        state.savedAccounts = [];
        return;
      }
      state.savedAccounts = state.savedAccounts.filter(
        (item) =>
          item.email !== action.payload && item.id !== action.payload
      );
    },
  },
});

export const {
  setActiveAccountId,
  setProfilePin,
  setPinSalt,
  setSkipProfileSelector,
  setUserData,
  setLocation,
  setUnseenBadge,
  setIsBackgroundServiceRunning,
  setRecentSearches,
  setSavedLocations,
  setLoginValue,
  setIsEmail,
  setSelectedVehicle,
  setTotalDistance,
  setVTCBusiness,
  setVTCIndependent,
  setTotalDuration,
  setSelectedComfort,
  setSelectedExterior,
  setSelectedAccessibility,
  setFoodAndBeverage,
  setTotalBalance,
  setIsExtraFoodAndBeverage,
  setSavedAccounts,
  addSavedAccount,
  removeSavedAccount,
} = usersSlice.actions;

export default usersSlice.reducer;
