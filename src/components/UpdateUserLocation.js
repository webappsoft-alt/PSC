import { useEffect, useState } from "react";
import { getLocationWithPermission } from "../utils/LocationUtils";
import { put } from "../services/ApiRequest";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../store/reducer/usersSlice";
import { useIsFocused } from "@react-navigation/native";

const UpdateUserLocation = () => {
  const dispatch = useDispatch();
  const isFocus = useIsFocused();
  const [hasUpdatedLocation, setHasUpdatedLocation] = useState(false);
  const userData = useSelector((state) => state.users.userData);

  // console.log("iuse-----", userData);

  useEffect(() => {
    const updateUserLocation = async () => {
      try {
        // Check if we've already updated location
        if (hasUpdatedLocation) return;

        // Get user's current location
        const locationData = await getLocationWithPermission();

        if (locationData && locationData.latitude && locationData.longitude) {
          // Prepare the address object as specified
          const addressPayload = {
            location: {
              address: locationData.address || "User's current location",
              city: locationData?.city,
              country: locationData?.country,
              location: {
                type: "Point",
                coordinates: [locationData.longitude, locationData.latitude],
              },
            },
          };

          // Update user profile with location
          const response = await put("user/profile", addressPayload);

          if (response?.data?.success) {
            // console.log("User location updated successfully", response.data);
            setHasUpdatedLocation(true);
            dispatch(setUserData(response.data.data));
          }
        }
      } catch (error) {
        console.log("Failed to update user location:", error);
        // Don't set hasUpdatedLocation to true so we can retry later
      }
    };

    // Run location update
    updateUserLocation();
  }, [hasUpdatedLocation, isFocus]);

  // This component doesn't render anything
  return null;
};

export default UpdateUserLocation;
