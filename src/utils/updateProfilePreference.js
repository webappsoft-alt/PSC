import { put } from "../services/ApiRequest";
import { setUserData } from "../store/reducer/usersSlice";
import { ToastMessage } from "./ToastMessage";

export const updateProfilePreference = async (
  dispatch,
  userData,
  fieldsToUpdate,
  successMessage = "Preference updated successfully"
) => {
  // 1. Immediately update local Redux state so userData reflects the new preference instantly
  const updatedProfile = {
    ...userData?.profile,
    ...fieldsToUpdate,
  };
  const updatedUserData = {
    ...userData,
    profile: updatedProfile,
  };
  dispatch(setUserData(updatedUserData));

  try {
    const body = {
      profile: updatedProfile,
      privacy: userData?.privacy || {},
      socialMedia: userData?.socialMedia || {},
      enhancedTailoredAds: userData?.enhancedTailoredAds || false,
      profilePrivacy: userData?.profilePrivacy || "public",
    };

    const res = await put("user/profile", body);
    if (res?.data?.success || res?.data) {
      // 2. Merge API response data into userData while ensuring fieldsToUpdate remain selected
      const returnedData = res?.data?.data || res?.data?.user || res?.data?.userData;
      if (returnedData && typeof returnedData === "object" && !returnedData.success) {
        const finalUser = {
          ...updatedUserData,
          ...returnedData,
          profile: {
            ...updatedUserData.profile,
            ...(returnedData.profile || {}),
            ...fieldsToUpdate,
          },
        };
        dispatch(setUserData(finalUser));
      }

      if (successMessage) {
        ToastMessage(successMessage, "success");
      }
      return true;
    }
  } catch (error) {
    console.error("Error updating profile preference:", error);
    ToastMessage("Failed to update preference", "error");
    // Revert to original userData if API fails
    dispatch(setUserData(userData));
  }
  return false;
};
