import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
  NativeModules,
} from "react-native";

const { GetCurrentLocation } = NativeModules;
const API_KEY = "AIzaSyB3Tj9fWzywtOncQ7vNjcErxRM5E--WlDA";

// Global variables to manage location requests
let isLocationRequestInProgress = false;
let pendingLocationRequest = null;

/**
 * Reset the location request state - useful for cleanup
 */
export const resetLocationRequestState = () => {
  isLocationRequestInProgress = false;
  pendingLocationRequest = null;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - Unit of measurement ('km' or 'miles')
 * @returns {number} Distance in specified unit
 */
export const calculateDistance = (lat1, lon1, lat2, lon2, unit = "km") => {
  const R = unit === "miles" ? 3959 : 6371; // Radius of Earth in miles or kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(2));
};

/**
 * Format distance with appropriate unit
 * @param {number} distance - Distance in kilometers
 * @param {string} unit - Preferred unit ('km' or 'miles')
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = "km") => {
  if (distance === null || distance === undefined) {
    return "Distance unavailable";
  }

  const convertedDistance = unit === "miles" ? distance * 0.621371 : distance;
  const unitLabel = unit === "miles" ? "mi" : "km";

  if (convertedDistance < 1) {
    const meters = Math.round(convertedDistance * 1000);
    return `${meters} m`;
  }

  return `${convertedDistance.toFixed(1)} ${unitLabel}`;
};

/**
 * Request location permissions for Android and iOS
 * @returns {Promise<boolean>} True if permission granted
 */
export const requestLocationPermission = async () => {
  try {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message:
            "This app needs access to your location to provide better services.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      // For iOS, we'll handle permission in the geolocation call
      return true;
    }
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

/**
 * Get current user location using native module with request queue management
 * @param {Object} options - Options (currently not used but kept for compatibility)
 * @returns {Promise<Object>} Location object with latitude and longitude
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    // If a request is already in progress, return the pending promise
    if (isLocationRequestInProgress && pendingLocationRequest) {
      return await pendingLocationRequest;
    }

    // Set flag and create new request
    isLocationRequestInProgress = true;

    pendingLocationRequest = (async () => {
      try {
        // First check and request permission
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          const permissionError = new Error("Location permission denied");
          permissionError.code = "PERMISSION_DENIED";
          throw permissionError;
        }

        // Get location from native module (guard if unavailable)
        if (
          !GetCurrentLocation ||
          typeof GetCurrentLocation.getCurrentLocation !== "function"
        ) {
          const moduleError = new Error("Native location module unavailable");
          moduleError.code = "NATIVE_MODULE_UNAVAILABLE";
          throw moduleError;
        }
        const locationData = await GetCurrentLocation.getCurrentLocation();

        const formattedLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          altitude: locationData.altitude,
          speed: locationData.speed,
          heading: locationData.heading,
          timestamp: locationData.timestamp || Date.now(),
          provider: locationData.provider,
        };

        return formattedLocation;
      } finally {
        // Always reset the flags when request completes
        isLocationRequestInProgress = false;
        pendingLocationRequest = null;
      }
    })();

    return await pendingLocationRequest;
  } catch (error) {
    console.error("Location error:", error);

    // Reset flags on error
    isLocationRequestInProgress = false;
    pendingLocationRequest = null;

    // Create enhanced error with user-friendly message
    const enhancedError = {
      ...error,
      message: error.message || getLocationErrorMessage(error.code),
      userFriendlyMessage: getLocationErrorMessage(error.code),
    };

    throw enhancedError;
  }
};

/**
 * Get user-friendly error message for location errors
 * @param {string|number} errorCode - Error code from native module or geolocation
 * @returns {string} User-friendly error message
 */
const getLocationErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "PERMISSION_DENIED":
    case 1:
      return "Location permission was denied. Please enable location services for this app.";
    case "LOCATION_DISABLED":
    case 2:
      return "Location services are disabled. Please enable them in settings.";
    case "TIMEOUT":
    case 3:
      return "Location request timed out. Please try again or check your connection.";
    case "LOCATION_ERROR":
    case 4:
      return "Location services are not available. Please enable location services.";
    default:
      return "Unable to get your location. Please try again.";
  }
};

/**
 * Watch user location changes using periodic calls to native module
 * @param {Function} callback - Callback function to receive location updates
 * @param {Object} options - Options (interval for polling in ms, default 10000)
 * @returns {number} Interval ID for clearing the watch
 */
export const watchLocation = (callback, options = {}) => {
  const { interval = 10000 } = options; // Default 10 seconds

  const watchId = setInterval(async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        callback({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          provider: location.provider,
        });
      }
    } catch (error) {
      console.error("Location watch error:", error);
      callback(null, error);
    }
  }, interval);

  return watchId;
};

/**
 * Clear location watch
 * @param {number} watchId - Interval ID returned by watchLocation
 */
export const clearLocationWatch = (watchId) => {
  clearInterval(watchId);
};

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} Address components object
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;

      let city = null;
      let state = null;
      let country = null;
      let countryCode = null;
      let zipCode = null;
      let streetNumber = null;
      let route = null;

      addressComponents.forEach((component) => {
        const types = component.types;
        if (types.includes("locality")) {
          city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = component.long_name;
        } else if (types.includes("country")) {
          country = component.long_name;
          countryCode = component.short_name;
        } else if (types.includes("postal_code")) {
          zipCode = component.long_name;
        } else if (types.includes("street_number")) {
          streetNumber = component.long_name;
        } else if (types.includes("route")) {
          route = component.long_name;
        }
      });

      return {
        formattedAddress: result.formatted_address,
        city,
        state,
        country,
        countryCode,
        zipCode,
        streetNumber,
        route,
        placeId: result.place_id,
      };
    } else {
      throw new Error(data.error_message || "No results found");
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    throw error;
  }
};

/**
 * Forward geocode address to coordinates
 * @param {string} address - Address string
 * @returns {Promise<Object>} Location object with coordinates
 */
export const forwardGeocode = async (address) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      };
    } else {
      throw new Error(data.error_message || "No results found");
    }
  } catch (error) {
    console.error("Forward geocoding error:", error);
    throw error;
  }
};

/**
 * Show permission alert with option to open settings
 */
export const showPermissionAlert = () => {
  Alert.alert(
    "Location Permission Required",
    "This app needs location permission to provide location-based services. Please grant permission in Settings.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
};

/**
 * Check if coordinates are valid
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {boolean} True if coordinates are valid
 */
export const isValidCoordinate = (latitude, longitude) => {
  const isValid =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  return isValid;
};

/**
 * Calculate estimated travel time between two coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {number} averageSpeed - Average speed in km/h (default: 30)
 * @returns {Object} Object containing time in minutes and formatted time string
 */
export const calculateTravelTime = (
  lat1,
  lon1,
  lat2,
  lon2,
  averageSpeed = 30,
) => {
  try {
    // Calculate distance using existing function
    const distance = calculateDistance(lat1, lon1, lat2, lon2, "km");

    // Calculate time in hours
    const timeInHours = distance / averageSpeed;

    // Convert to minutes
    const timeInMinutes = Math.round(timeInHours * 60);

    // Format time string
    let timeString;
    if (timeInMinutes < 60) {
      timeString = `${timeInMinutes} min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      timeString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return {
      timeInMinutes,
      timeString,
      distance: distance,
    };
  } catch (error) {
    console.error("Error calculating travel time:", error);
    return {
      timeInMinutes: 0,
      timeString: "0 min",
      distance: 0,
    };
  }
};

/**
 * Calculate distance and time between two locations
 * @param {Object} fromLocation - Source location with lat/long or latitude/longitude
 * @param {Object} toLocation - Destination location with lat/long or latitude/longitude
 * @param {number} averageSpeed - Average speed in km/h (default: 30)
 * @returns {Object} Object containing distance and time information
 */
export const calculateDistanceAndTime = (
  fromLocation,
  toLocation,
  averageSpeed = 30,
) => {
  try {
    // Extract coordinates from different possible formats
    const fromLat = fromLocation?.lat || fromLocation?.latitude;
    const fromLon = fromLocation?.long || fromLocation?.longitude;
    const toLat = toLocation?.lat || toLocation?.latitude;
    const toLon = toLocation?.long || toLocation?.longitude;

    // Convert to numbers if they are strings
    const fromLatNum =
      typeof fromLat === "string" ? parseFloat(fromLat) : fromLat;
    const fromLonNum =
      typeof fromLon === "string" ? parseFloat(fromLon) : fromLon;
    const toLatNum = typeof toLat === "string" ? parseFloat(toLat) : toLat;
    const toLonNum = typeof toLon === "string" ? parseFloat(toLon) : toLon;

    // Validate coordinates
    if (
      !isValidCoordinate(fromLatNum, fromLonNum) ||
      !isValidCoordinate(toLatNum, toLonNum)
    ) {
      console.error("Invalid coordinates validation failed:");
      console.error("fromLatNum:", fromLatNum, "fromLonNum:", fromLonNum);
      console.error("toLatNum:", toLatNum, "toLonNum:", toLonNum);
      throw new Error("Invalid coordinates provided");
    }

    // Calculate distance
    const distance = calculateDistance(
      fromLatNum,
      fromLonNum,
      toLatNum,
      toLonNum,
      "km",
    );

    // Calculate travel time
    const timeResult = calculateTravelTime(
      fromLatNum,
      fromLonNum,
      toLatNum,
      toLonNum,
      averageSpeed,
    );

    return {
      distance: parseFloat(distance.toFixed(2)),
      distanceFormatted: formatDistance(distance, "km"),
      timeInMinutes: timeResult.timeInMinutes,
      timeString: timeResult.timeString,
      averageSpeed: averageSpeed,
    };
  } catch (error) {
    console.error("Error calculating distance and time:", error);
    return {
      distance: 0,
      distanceFormatted: "0 km",
      timeInMinutes: 0,
      timeString: "0 min",
      averageSpeed: averageSpeed,
    };
  }
};

export const getLocationWithPermission = async (options = {}) => {
  try {
    // Get current location using the updated getCurrentLocation function
    const location = await getCurrentLocation(options);

    // Log successful location retrieval
    console.log("Location obtained with accuracy:", location.accuracy);

    // Get address information
    let addressData = null;
    try {
      addressData = await reverseGeocode(location.latitude, location.longitude);
    } catch (addressError) {
      console.warn("Failed to get address data:", addressError);
      // Continue without address data - this is not critical
    }

    return {
      ...location,
      address:
        addressData?.formattedAddress ||
        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
      city: addressData?.city || null,
      state: addressData?.state || null,
      country: addressData?.country || null,
      countryCode: addressData?.countryCode || null,
      zipCode: addressData?.zipCode || null,
    };
  } catch (error) {
    console.error("Error getting location with permission:", error);

    // Enhance the error with user-friendly message if not already present
    if (!error.userFriendlyMessage) {
      error.userFriendlyMessage = error.message || "Failed to get location";
    }

    throw error;
  }
};

/**
 * Calculate road distance and duration using Google Distance Matrix API
 * Falls back to straight-line estimate if API fails
 * @param {Object} fromLocation - Source with lat/long or latitude/longitude
 * @param {Object} toLocation - Destination with lat/long or latitude/longitude
 * @param {Object} options - { mode: 'driving'|'walking'|'bicycling'|'transit', units: 'metric'|'imperial' }
 * @returns {Promise<Object>} { distanceKm, distanceFormatted, timeInMinutes, timeString, durationSeconds, raw }
 */
export const calculateRoadDistanceAndTime = async (
  fromLocation,
  toLocation,
  options = {},
) => {
  const { mode = "driving", units = "metric" } = options;

  try {
    // Extract coordinates (support different shapes)
    const fromLat = fromLocation?.lat || fromLocation?.latitude;
    const fromLon = fromLocation?.long || fromLocation?.longitude;
    const toLat = toLocation?.lat || toLocation?.latitude;
    const toLon = toLocation?.long || toLocation?.longitude;

    // Normalize to numbers
    const fromLatNum =
      typeof fromLat === "string" ? parseFloat(fromLat) : fromLat;
    const fromLonNum =
      typeof fromLon === "string" ? parseFloat(fromLon) : fromLon;
    const toLatNum = typeof toLat === "string" ? parseFloat(toLat) : toLat;
    const toLonNum = typeof toLon === "string" ? parseFloat(toLon) : toLon;

    // Validate
    if (
      !isValidCoordinate(fromLatNum, fromLonNum) ||
      !isValidCoordinate(toLatNum, toLonNum)
    ) {
      throw new Error("Invalid coordinates provided");
    }

    const origins = `${fromLatNum},${fromLonNum}`;
    const destinations = `${toLatNum},${toLonNum}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origins,
    )}&destinations=${encodeURIComponent(
      destinations,
    )}&mode=${encodeURIComponent(mode)}&units=${encodeURIComponent(
      units,
    )}&key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (
      data.status !== "OK" ||
      !data.rows?.[0]?.elements?.[0] ||
      data.rows[0].elements[0].status !== "OK"
    ) {
      throw new Error(
        data.error_message ||
          data.rows?.[0]?.elements?.[0]?.status ||
          "NO_RESULT",
      );
    }

    const element = data.rows[0].elements[0];
    const distanceMeters = element.distance?.value ?? 0; // meters
    const durationSeconds = element.duration?.value ?? 0; // seconds

    const distanceKm = distanceMeters / 1000;
    const timeInMinutes = Math.max(0, Math.round(durationSeconds / 60));

    let timeString;
    if (timeInMinutes < 60) {
      timeString = `${timeInMinutes} min`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      timeString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      distanceFormatted: formatDistance(distanceKm, "km"),
      timeInMinutes,
      timeString,
      durationSeconds,
      raw: data,
      mode,
      units,
    };
  } catch (error) {
    console.warn("Distance Matrix failed, falling back to haversine:", error);

    // Fallback to straight-line estimate with default average speed
    const fallback = calculateDistanceAndTime(fromLocation, toLocation);
    return {
      distanceKm: fallback.distance,
      distanceFormatted: fallback.distanceFormatted,
      timeInMinutes: fallback.timeInMinutes,
      timeString: fallback.timeString,
      durationSeconds: fallback.timeInMinutes * 60,
      raw: null,
      mode: options.mode || "driving",
      units: options.units || "metric",
      fallback: true,
    };
  }
};
