import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import CustomInput from "./CustomInput";
import Icons from "./Icons";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { Images } from "../assets/images";
import { PNGIcons } from "../assets/images/icons";
import {
  setRecentSearches,
  setSavedLocations,
} from "../store/reducer/usersSlice";
import { COLORS } from "../utils/COLORS";
import { useTheme } from "../contexts/ThemeContext";
import {
  calculateDistance,
  calculateRoadDistanceAndTime,
  formatDistance,
  getLocationWithPermission,
  resetLocationRequestState,
} from "../utils/LocationUtils";
import ImageFast from "./ImageFast";
import Divider from "./Divider";

const API_KEY = "AIzaSyB3Tj9fWzywtOncQ7vNjcErxRM5E--WlDA";

// Custom Skeleton Loader Component
const SkeletonLoader = ({ type = "default", style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle = {
    backgroundColor: colors.surfaceAlt,
    opacity,
  };

  if (type === "prediction") {
    return (
      <View style={[styles.skeletonPredictionContainer, style]}>
        <Animated.View style={[styles.skeletonIcon, skeletonStyle]} />
        <View style={styles.skeletonTextContainer}>
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextLong,
              skeletonStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextShort,
              skeletonStyle,
            ]}
          />
        </View>
        <Animated.View style={[styles.skeletonDistance, skeletonStyle]} />
      </View>
    );
  }

  if (type === "section") {
    return (
      <View style={[styles.skeletonSectionContainer, style]}>
        <Animated.View style={[styles.skeletonIcon, skeletonStyle]} />
        <View style={styles.skeletonTextContainer}>
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextLong,
              skeletonStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextShort,
              skeletonStyle,
            ]}
          />
        </View>
      </View>
    );
  }

  // Default skeleton
  return (
    <View style={[styles.skeletonContainer, style]}>
      <Animated.View style={[styles.skeleton, skeletonStyle]} />
    </View>
  );
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CustomModalGooglePlaces = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialValue = "",
  debounceDelay = 300,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { recentSearches, savedLocations } = useSelector(
    (state) => state.users,
  );

  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [selectedLocationData, setSelectedLocationData] = useState(null);
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] =
    useState(false);
  const [predictionsWithDistance, setPredictionsWithDistance] = useState([]);
  const [loadingDistances, setLoadingDistances] = useState(false);

  // Nearby cities state
  const [nearbyCities, setNearbyCities] = useState([]);
  const [loadingNearbyCities, setLoadingNearbyCities] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, debounceDelay);

  const closeModal = useCallback(() => {
    onClose();
    setPredictions([]);
    setPredictionsWithDistance([]);
    setNoData(false);
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      setSearchQuery(initialValue);
      setPredictions([]);
      setPredictionsWithDistance([]);
      setNoData(false);
    }
  }, [isVisible, initialValue]);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const locationData = await getLocationWithPermission();
        setCurrentUserLocation(locationData);
        // Fetch nearby cities when location is available
        if (locationData) {
          fetchNearbyCities(locationData.latitude, locationData.longitude);
        }
      } catch (error) {
        console.log(
          "Initial location fetch error:",
          error.userFriendlyMessage || error.message || error,
        );
        // Don't show alert on initial load, just log for debugging
        if (error.code === "LOCATION_REQUEST_IN_PROGRESS") {
          // Reset state and try again after a delay
          setTimeout(() => {
            resetLocationRequestState();
          }, 1000);
        }
      }
    };

    if (isVisible) {
      getUserLocation();
    }
  }, [isVisible]);

  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length > 2) {
      handleSearch(debouncedSearchQuery);
    } else {
      setPredictions([]);
      setPredictionsWithDistance([]);
      setNoData(false);
    }
  }, [debouncedSearchQuery]);

  const handleSearch = async (text) => {
    if (!text || text.length < 3) {
      setPredictions([]);
      setPredictionsWithDistance([]);
      return;
    }

    setLoading(true);
    setNoData(false);

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${API_KEY}&input=${encodeURIComponent(
        text,
      )}&types=(cities)`;

      if (currentUserLocation) {
        url += `&location=${currentUserLocation.latitude},${currentUserLocation.longitude}&radius=50000`;
      }

      const response = await fetch(url);

      if (!response?.ok) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const data = await response?.json();

      if (data.error_message) {
        console.error("Google Places API Error:", data.error_message);
        setPredictions([]);
        setPredictionsWithDistance([]);
        setNoData(true);
      } else if (data.predictions?.length > 0) {
        setPredictions(data.predictions);
        setPredictionsWithDistance([]);
        setNoData(false);

        if (currentUserLocation) {
          calculatePredictionDistances(data.predictions);
        }
      } else {
        setPredictions([]);
        setPredictionsWithDistance([]);
        setNoData(true);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
      setPredictionsWithDistance([]);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaceDetails = async (placeId) => {
    try {
      // Check if placeId is valid
      if (!placeId || typeof placeId !== "string" || placeId.trim() === "") {
        console.warn("Invalid placeId provided:", placeId);
        return null;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?key=${API_KEY}&place_id=${placeId.trim()}&fields=address_components,geometry`,
      );
      if (!response?.ok) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const data = await response?.json();

      if (data.error_message) {
        console.error("Google Places Details API Error:", data.error_message);
        return null;
      }

      return data.result;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const extractAddressComponents = (addressComponents) => {
    const components = {
      state: null,
      city: null,
      zipCode: null,
      country: null,
    };

    addressComponents.forEach((component) => {
      if (component.types.includes("administrative_area_level_1")) {
        components.state = component.long_name;
      } else if (component.types.includes("locality")) {
        components.city = component.long_name;
      } else if (component.types.includes("postal_code")) {
        components.zipCode = component.long_name;
      } else if (component.types.includes("country")) {
        components.country = component.long_name;
      }
    });

    return components;
  };

  const addToRecentSearches = useCallback(
    (locationData) => {
      const newSearch = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...locationData,
      };

      const filteredSearches = recentSearches?.filter(
        (search) => search.address !== locationData.address,
      );

      const updatedSearches = [newSearch, ...filteredSearches].slice(0, 3);

      dispatch(setRecentSearches(updatedSearches));
    },
    [recentSearches, dispatch],
  );

  const saveLocation = useCallback(
    (locationData) => {
      const newSavedLocation = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...locationData,
      };

      const filteredSaved = savedLocations?.filter(
        (saved) => saved.address !== locationData.address,
      );

      const updatedSaved = [newSavedLocation, ...filteredSaved].slice(0, 10);

      dispatch(setSavedLocations(updatedSaved));
    },
    [savedLocations, dispatch],
  );

  const handlePredictionPress = async (item) => {
    if (item?.latitude && item?.longitude) {
      const locationData = {
        address: item.description || item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        city: item.city,
        state: item.state,
        country: item.country,
        zipCode: item.zipCode,
        distance: item.distance,
      };

      addToRecentSearches(locationData);
      onLocationSelect(locationData);
      closeModal();
      return;
    }

    if (!item?.place_id) {
      console.warn("No place_id found in prediction item:", item);
      onLocationSelect({
        address: item.description || item.address,
        latitude: null,
        longitude: null,
        city: null,
        state: null,
        country: null,
        zipCode: null,
        distance: null,
      });
      closeModal();
      return;
    }

    const placeDetails = await fetchPlaceDetails(item.place_id);

    if (placeDetails) {
      const components = placeDetails?.address_components
        ? extractAddressComponents(placeDetails?.address_components)
        : {};

      let distance = null;
      if (currentUserLocation && placeDetails?.geometry?.location) {
        try {
          const road = await calculateRoadDistanceAndTime(
            {
              latitude: currentUserLocation.latitude,
              longitude: currentUserLocation.longitude,
            },
            {
              latitude: placeDetails?.geometry?.location?.lat,
              longitude: placeDetails?.geometry?.location?.lng,
            },
            { mode: "driving", units: "metric" },
          );
          distance = road?.distanceKm ?? null;
        } catch (e) {
          distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            placeDetails?.geometry?.location?.lat,
            placeDetails?.geometry?.location?.lng,
          );
        }
      }

      const locationData = {
        latitude: placeDetails?.geometry?.location?.lat,
        longitude: placeDetails?.geometry?.location?.lng,
        address: item.description,
        city: components.city,
        state: components.state,
        country: components.country,
        zipCode: components.zipCode,
        distance: distance,
      };

      setSelectedLocationData(locationData);
      addToRecentSearches(locationData);

      onLocationSelect(locationData);
    } else {
      onLocationSelect({
        address: item.description || item.address,
        latitude: null,
        longitude: null,
        city: null,
        state: null,
        country: null,
        zipCode: null,
        distance: null,
      });
    }

    closeModal();
  };

  const handleInputChange = (text) => {
    setSearchQuery(text);
  };

  const calculatePredictionDistances = async (predictions) => {
    if (!currentUserLocation) return;

    setLoadingDistances(true);
    try {
      const limitedPredictions = predictions.slice(0, 5);

      const predictionsWithDistanceData = await Promise.all(
        limitedPredictions.map(async (prediction) => {
          try {
            // Check if prediction has valid place_id
            if (!prediction?.place_id) {
              console.warn("No place_id found in prediction:", prediction);
              return { ...prediction, distance: null };
            }

            const placeDetails = await fetchPlaceDetails(prediction.place_id);
            if (placeDetails?.geometry?.location) {
              const { lat, lng } = placeDetails?.geometry?.location;
              let distance = null;
              try {
                const road = await calculateRoadDistanceAndTime(
                  {
                    latitude: currentUserLocation.latitude,
                    longitude: currentUserLocation.longitude,
                  },
                  {
                    latitude: placeDetails?.geometry?.location?.lat,
                    longitude: placeDetails?.geometry?.location?.lng,
                  },
                  { mode: "driving", units: "metric" },
                );
                distance = road?.distanceKm ?? null;
              } catch (e) {
                distance = calculateDistance(
                  currentUserLocation.latitude,
                  currentUserLocation.longitude,
                  placeDetails?.geometry?.location?.lat,
                  placeDetails?.geometry?.location?.lng,
                );
              }

              const components = placeDetails.address_components
                ? extractAddressComponents(placeDetails.address_components)
                : {};

              return {
                ...prediction,
                distance: distance,
                coordinates: {
                  lat: placeDetails?.geometry?.location?.lat,
                  lng: placeDetails?.geometry?.location?.lng,
                },
                city: components.city || null,
                state: components.state || null,
                country: components.country || null,
                zipCode: components.zipCode || null,
              };
            }
            return { ...prediction, distance: null };
          } catch (error) {
            console.warn("Failed to get distance for prediction:", error);
            return { ...prediction, distance: null };
          }
        }),
      );

      const remainingPredictions = predictions.slice(5).map((prediction) => ({
        ...prediction,
        distance: null,
      }));

      // Keep only items that resolve to a city
      const cityPredictions = predictionsWithDistanceData.filter(
        (p) => p.city && p.city !== null,
      );

      setPredictionsWithDistance(cityPredictions);
    } catch (error) {
      console.error("Error calculating prediction distances:", error);
      setPredictionsWithDistance(
        predictions.map((p) => ({ ...p, distance: null })),
      );
    } finally {
      setLoadingDistances(false);
    }
  };

  const handleMapSelection = () => {
    closeModal();
    setTimeout(() => {
      navigation.navigate("PicLocation", {
        onLocationSelect,
        shouldOpenModalOnReturn: true,
      });
    }, 500);
  };

  const handleCurrentLocationSelection = async () => {
    // Prevent multiple location requests
    if (isLoadingCurrentLocation) {
      console.log("Location request already in progress, ignoring new request");
      return;
    }

    setIsLoadingCurrentLocation(true);
    try {
      const locationData = await getLocationWithPermission();

      const distance = 0;

      const fullLocationData = {
        ...locationData,
        distance: distance,
      };

      setCurrentUserLocation(locationData);
      setSelectedLocationData(fullLocationData);

      addToRecentSearches(fullLocationData);
      onLocationSelect(fullLocationData);

      // Refresh nearby cities with new location
      fetchNearbyCities(locationData.latitude, locationData.longitude);

      closeModal();
    } catch (error) {
      console.error("Error getting current location:", error);

      // Handle specific error codes
      let errorMessage =
        error.userFriendlyMessage ||
        "Unable to get your current location. Please try again.";
      let alertTitle = "Location Error";

      if (error.code === "LOCATION_REQUEST_IN_PROGRESS") {
        errorMessage =
          "A location request is already in progress. Please wait and try again.";
        alertTitle = "Please Wait";
        // Reset the state after a delay
        setTimeout(() => {
          resetLocationRequestState();
        }, 2000);
      } else if (error.code === "PERMISSION_DENIED" || error.code === 1) {
        alertTitle = "Permission Required";
        errorMessage =
          "Location permission is required. Please enable location access in your device settings.";
      } else if (error.code === "TIMEOUT" || error.code === 3) {
        alertTitle = "Location Timeout";
        errorMessage =
          "Location request timed out. Please check your GPS and try again.";
      } else if (error.code === "LOCATION_DISABLED" || error.code === 2) {
        alertTitle = "Location Unavailable";
        errorMessage =
          "Location services are disabled. Please enable them in your device settings.";
      }

      Alert.alert(alertTitle, errorMessage, [
        { text: "OK", style: "default" },
        ...(error.code === "PERMISSION_DENIED" || error.code === 1
          ? [
              {
                text: "Open Settings",
                onPress: () => {
                  import("react-native").then(({ Linking }) => {
                    Linking.openSettings();
                  });
                },
              },
            ]
          : []),
      ]);
    } finally {
      setIsLoadingCurrentLocation(false);
    }
  };

  const renderPredictionItem = (
    { item },
    isRecent = false,
    isSaved = false,
    hideBorder = false,
    showLocationIcon = false,
  ) => {
    const getIconForPlace = () => {
      if (item?.types) {
        if (item.types.includes("airport")) return PNGIcons.plane;
        if (item.types.includes("train_station")) return PNGIcons.bus;
        if (item.types.includes("lodging")) return PNGIcons.bed;
        if (item.types.includes("restaurant")) return PNGIcons.restaurant;
        if (item.types.includes("gym")) return Images.quickaction1;
        if (item.types.includes("cafe")) return PNGIcons.coffee;
        else return PNGIcons.pin;
      }
      return PNGIcons.pin;
    };

    // Check if this location is already saved
    const isLocationSaved = savedLocations?.some(
      (saved) => saved.address === (item?.description || item?.address),
    );
    let distanceText = "";
    if (item?.distance !== null && item?.distance !== undefined) {
      distanceText = formatDistance(item?.distance);
    }

    const onSaveLocation = async () => {
      try {
        // Check if item has valid place_id
        if (!item?.place_id) {
          console.warn("No place_id found in item for save:", item);
          return;
        }

        const placeDetails = await fetchPlaceDetails(item.place_id);

        if (placeDetails) {
          const components = placeDetails?.address_components
            ? extractAddressComponents(placeDetails?.address_components)
            : {};

          const locationData = {
            latitude:
              placeDetails?.geometry?.location?.lat || item?.coordinates?.lat,
            longitude:
              placeDetails?.geometry?.location?.lng || item?.coordinates?.lng,
            address: item?.description || item?.address,
            city:
              components.city ||
              item?.structured_formatting?.secondary_text ||
              item?.city ||
              "",
            state: components.state || null,
            country: components.country || null,
            zipCode: components.zipCode || null,
            distance: item?.distance,
          };

          saveLocation(locationData);
        } else {
          const locationData = {
            latitude: item?.coordinates?.lat,
            longitude: item?.coordinates?.lng,
            address: item?.description,
            city: item?.structured_formatting?.secondary_text || "",
            state: null,
            country: null,
            zipCode: null,
            distance: item?.distance,
          };

          saveLocation(locationData);
        }
      } catch (error) {
        console.error("Error fetching place details for save:", error);
        const locationData = {
          latitude: item?.coordinates?.lat,
          longitude: item?.coordinates?.lng,
          address: item?.description,
          city: item?.structured_formatting?.secondary_text || "",
          state: null,
          country: null,
          zipCode: null,
          distance: item?.distance,
        };

        saveLocation(locationData);
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.6}
        style={[
          styles.selectMap,
          {
            borderBottomWidth: 0.6,
            borderBottomColor: colors.white04,
          },
        ]}
        onPress={() => handlePredictionPress(item)}
        disabled={isLoadingCurrentLocation}
      >
        <View style={styles.row}>
          <View style={{}}>
            <CustomText
              label={item?.description || item?.address}
              fontFamily={fonts.medium}
              fontSize={16}
            />
            <CustomText
              label={
                item?.structured_formatting?.secondary_text || item?.city || ""
              }
              fontFamily={fonts.medium}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {distanceText ? (
          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <CustomText
              label={distanceText}
              fontFamily={fonts.medium}
              fontSize={14}
              color={colors.textSecondary}
            />
          </View>
        ) : loadingDistances && currentUserLocation ? (
          <View
            style={{
              alignItems: "flex-end",
              justifyContent: "center",
              width: "15%",
            }}
          >
            <SkeletonLoader
              type="default"
              style={styles.skeletonDistanceLoader}
            />
          </View>
        ) : null}
        {/* {isSaved ? (
          <TouchableOpacity
            onPress={onSaveLocation}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={isLocationSaved ? PNGIcons.greenStar : PNGIcons.starLine}
              style={styles.map}
            />
          </TouchableOpacity>
        ) : null} */}
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () =>
    noData && !loading ? (
      <View style={styles.emptyContainer}>
        <CustomText
          label="No locations found. Try searching with different terms."
          fontFamily={fonts.medium}
          fontSize={14}
          color={colors.textSecondary}
          textAlign="center"
        />
      </View>
    ) : null;

  // Fetch nearby cities using Places Autocomplete with city restriction
  const fetchNearbyCities = async (latitude, longitude) => {
    if (!latitude || !longitude) return;

    setLoadingNearbyCities(true);

    try {
      // Use a generic input to get city suggestions around the location
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${API_KEY}&input=a&types=(cities)&location=${latitude},${longitude}&radius=50000`;

      const response = await fetch(url);
      if (!response?.ok) {
        throw new Error(`HTTP error! status: ${response?.status}`);
      }

      const data = await response?.json();
      if (data.error_message) {
        console.error(
          "Google Places API Error (nearby cities):",
          data.error_message,
        );
        setNearbyCities([]);
        return;
      }

      const predictions = Array.isArray(data.predictions)
        ? data.predictions
        : [];

      // Resolve details and compute distance, keep only items resolving to a city
      const resolved = await Promise.all(
        predictions.slice(0, 10).map(async (prediction) => {
          try {
            if (!prediction?.place_id) return null;
            const details = await fetchPlaceDetails(prediction.place_id);
            if (!details?.geometry?.location) return null;

            let distance = null;
            try {
              const road = await calculateRoadDistanceAndTime(
                { latitude, longitude },
                {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                },
                { mode: "driving", units: "metric" },
              );
              distance = road?.distanceKm ?? null;
            } catch (e) {
              distance = calculateDistance(
                latitude,
                longitude,
                details.geometry.location.lat,
                details.geometry.location.lng,
              );
            }

            const components = details.address_components
              ? extractAddressComponents(details.address_components)
              : {};

            // Only include if it resolves to a city
            if (!components.city) return null;

            return {
              place_id: prediction.place_id,
              description: prediction.description,
              structured_formatting: prediction.structured_formatting,
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
              distance: distance,
              city: components.city,
              state: components.state,
              country: components.country,
              zipCode: components.zipCode,
            };
          } catch (e) {
            console.warn("Failed resolving city prediction:", e);
            return null;
          }
        }),
      );

      const cities = resolved
        .filter(Boolean)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      setNearbyCities(cities);
    } catch (error) {
      console.error("Error fetching nearby cities:", error);
      setNearbyCities([]);
    } finally {
      setLoadingNearbyCities(false);
    }
  };
  const insests = useSafeAreaInsets();

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={closeModal}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalHeader, { marginTop: insests.top - 10 }]}>
          {/* Client: search bar and close button are both 40px */}
          <CustomInput
            search
            width="86%"
            height={40}
            borderRadius={100}
            marginBottom={0.1}
            isClear={() => setSearchQuery("")}
            onChangeText={handleInputChange}
            value={searchQuery}
            placeholder="Search location..."
            autoFocus
            backgroundColor={isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(18, 18, 18, 0.04)"}
          />
          <TouchableOpacity
            style={[
              styles.crossContainer,
              {
                height: 40,
                width: 40,
                borderRadius: 100,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surfaceAlt,
              },
            ]}
            onPress={closeModal}
            activeOpacity={0.7}
          >
            <Icons
              family="MaterialSymbolsRounded"
              name="close"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
        <Divider marginVertical={0.1} />
        <TouchableOpacity
          activeOpacity={0.6}
          style={[styles.selectMap]}
          onPress={handleCurrentLocationSelection}
          disabled={isLoadingCurrentLocation}
        >
          <View style={styles.row}>
            <Image
              source={PNGIcons.pin}
              tintColor={colors.text}
              style={styles.map}
            />
            <View>
              <CustomText
                label={
                  currentUserLocation
                    ? currentUserLocation.city || "Current Location"
                    : "Get Current Location"
                }
                fontFamily={fonts.medium}
                fontSize={16}
                marginLeft={8}
                color={colors.text}
              />
              <CustomText
                label={
                  currentUserLocation
                    ? `${currentUserLocation.state || ""}, ${
                        currentUserLocation.country || ""
                      }`.replace(/^, |, $/, "") || "Unknown location"
                    : "Tap to get your current location"
                }
                fontFamily={fonts.medium}
                marginLeft={8}
                color={colors.textSecondary}
              />
            </View>
          </View>
          {isLoadingCurrentLocation ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <CustomText
              label={currentUserLocation ? "Currently here" : "Get location"}
              fontFamily={fonts.medium}
              marginLeft={8}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>

        <ScrollView>
          {predictionsWithDistance.length && predictions.length ? null : (
            <>
              {loadingNearbyCities ? (
                <SkeletonLoader type="section" style={styles.skeletonSection} />
              ) : (
                <FlatList
                  data={nearbyCities}
                  renderItem={({ item }) =>
                    renderPredictionItem({ item }, false, true, true)
                  }
                  keyExtractor={(item, index) => `${item?.place_id}-${index}`}
                  ListEmptyComponent={renderEmptyComponent}
                  showsVerticalScrollIndicator={false}
                />
              )}

              {/* <View>
                {recentSearches?.length ? (
                  <View style={styles.divider}>
                    <CustomText
                      label="RECENT SEARCHES"
                      fontFamily={fonts.medium}
                      fontSize={12}
                      color="#121212A3"
                    />
                  </View>
                ) : null}

                <FlatList
                  data={recentSearches}
                  renderItem={({ item }) =>
                    renderPredictionItem({ item }, true, false)
                  }
                  keyExtractor={(item, index) => `${item?.place_id}-${index}`}
                  ListEmptyComponent={renderEmptyComponent}
                  showsVerticalScrollIndicator={false}
                />
              </View> */}

              {/* <View>
                {savedLocations?.length ? (
                  <View style={styles.divider}>
                    <CustomText
                      label="SAVED LOCATIONS"
                      fontFamily={fonts.medium}
                      fontSize={12}
                      color="#121212A3"
                    />
                  </View>
                ) : null}

                <FlatList
                  data={savedLocations}
                  renderItem={({ item }) =>
                    renderPredictionItem({ item }, false, true)
                  }
                  keyExtractor={(item, index) => `${item?.place_id}-${index}`}
                  ListEmptyComponent={renderEmptyComponent}
                  showsVerticalScrollIndicator={false}
                />
              </View> */}
            </>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              {[...Array(3)].map((_, index) => (
                <SkeletonLoader
                  key={index}
                  type="prediction"
                  style={styles.skeletonPrediction}
                />
              ))}
            </View>
          ) : (
            <>
              {(predictionsWithDistance.length > 0 ||
                predictions.length > 0) && (
                <FlatList
                  data={
                    predictionsWithDistance.length > 0
                      ? predictionsWithDistance
                      : predictions
                  }
                  renderItem={({ item }) =>
                    renderPredictionItem({ item }, false, false, false, true)
                  }
                  keyExtractor={(item, index) => `${item?.place_id}-${index}`}
                  ListEmptyComponent={renderEmptyComponent}
                  showsVerticalScrollIndicator={false}
                  style={styles.predictionsList}
                  contentContainerStyle={
                    predictionsWithDistance.length === 0 &&
                    predictions.length === 0
                      ? styles.emptyListContent
                      : undefined
                  }
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </CustomModal>
  );
};

export default CustomModalGooglePlaces;

const createStyles = (colors, isDark) => StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    width: "100%",
    height: "100%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBlockColor: colors.background,
    padding: 16,
  },
  selectMap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: isDark ? "#FFFFFF0A" : colors.border,
  },
  cross: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  predictionsList: {
    flex: 1,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  map: {
    width: 20,
    height: 22,
    resizeMode: "contain",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#FFFFFF0A" : colors.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  plane: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white04,
    borderRadius: 100,
  },
  // Skeleton Loader Styles
  skeletonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  skeleton: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  skeletonPredictionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 0.6,
    borderBottomColor: colors.white04,
  },
  skeletonSectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.6,
    borderBottomColor: colors.white04,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  skeletonTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTextLong: {
    width: "80%",
  },
  skeletonTextShort: {
    width: "60%",
  },
  skeletonDistance: {
    width: 40,
    height: 14,
    borderRadius: 4,
  },
  skeletonSection: {
    marginBottom: 0,
  },
  skeletonPrediction: {
    marginBottom: 0,
  },
  skeletonDistanceLoader: {
    width: 30,
    height: 12,
    borderRadius: 4,
  },
});
