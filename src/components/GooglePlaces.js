import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Animated,
  Alert,
  View,
  Image,
} from "react-native";

import CustomInput from "./CustomInput";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Icons from "./Icons";
import CountryPicker from "./CountryPicker";

import { PNGIcons } from "../assets/images/icons";
import { COUNTRIES } from "../utils/COUNTRIES";
import { Images } from "../assets/images";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import {
  setRecentSearches,
  setSavedLocations,
} from "../store/reducer/usersSlice";
import {
  calculateRoadDistanceAndTime,
  resetLocationRequestState,
  getLocationWithPermission,
  calculateDistance,
  formatDistance,
} from "../utils/LocationUtils";

const API_KEY = "AIzaSyB3Tj9fWzywtOncQ7vNjcErxRM5E--WlDA";

// Custom Skeleton Loader Component
const SkeletonLoader = ({ type = "default", style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

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
      ])
    ).start();
  }, [animatedValue]);

  const interpolatedBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#e0e0e0", "#c0c0c0"],
  });

  if (type === "prediction") {
    return (
      <View style={[styles.skeletonPredictionContainer, style]}>
        <Animated.View
          style={[
            styles.skeletonIcon,
            { backgroundColor: interpolatedBackground },
          ]}
        />
        <View style={styles.skeletonTextContainer}>
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextLong,
              { backgroundColor: interpolatedBackground },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextShort,
              { backgroundColor: interpolatedBackground },
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.skeletonDistance,
            { backgroundColor: interpolatedBackground },
          ]}
        />
      </View>
    );
  }

  if (type === "section") {
    return (
      <View style={[styles.skeletonSectionContainer, style]}>
        <Animated.View
          style={[
            styles.skeletonIcon,
            { backgroundColor: interpolatedBackground },
          ]}
        />
        <View style={styles.skeletonTextContainer}>
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextLong,
              { backgroundColor: interpolatedBackground },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonText,
              styles.skeletonTextShort,
              { backgroundColor: interpolatedBackground },
            ]}
          />
        </View>
      </View>
    );
  }

  // Default skeleton
  return (
    <View style={[styles.skeletonContainer, style]}>
      <Animated.View
        style={[styles.skeleton, { backgroundColor: interpolatedBackground }]}
      />
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

const GooglePlaces = ({
  value,
  setValue,
  setState,
  dotsWidth,
  setLatLong,
  withLabel,
  error,
  placeholder = "Address",
  setCity,
  setZipCode,
  setCountry,
  isError,
  showSuccessColor,
  marginBottom,
  onPress,
  disabled,
  showIcon,
  debounceDelay = 300,
  shouldOpenModalOnReturn = false,
  isChange = false,
  isClear,
  showCountryPicker = false,
  hidePin,
  numberOfLines,
  searchPlaceHolder,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { recentSearches, savedLocations } = useSelector(
    (state) => state.users
  );

  const [searchQuery, setSearchQuery] = useState(value || "");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [selectedLocationData, setSelectedLocationData] = useState(null);
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] =
    useState(false);
  const [predictionsWithDistance, setPredictionsWithDistance] = useState([]);
  const [loadingDistances, setLoadingDistances] = useState(false);

  // New state for nearby places
  const [nearbyPlaces, setNearbyPlaces] = useState({
    airports: [],
    trainStations: [],
    hotels: [],
    restaurants: [],
    gyms: [],
    coffeeShops: [],
  });
  const [loadingNearbyPlaces, setLoadingNearbyPlaces] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const resolveCountryObject = (countryNameOrCode) => {
    if (!countryNameOrCode) return null;
    const codeMatch = COUNTRIES.find(
      (c) => c.code?.toLowerCase() === countryNameOrCode?.toLowerCase()
    );
    if (codeMatch) return codeMatch;
    const nameMatch = COUNTRIES.find(
      (c) => c.name?.toLowerCase() === countryNameOrCode?.toLowerCase()
    );
    return nameMatch || null;
  };

  const debouncedSearchQuery = useDebounce(searchQuery, debounceDelay);

  const openModal = useCallback(() => {
    setIsModalVisible(true);
    setSearchQuery(value || "");
    setPredictions([]);
    setPredictionsWithDistance([]);
    setNoData(false);
  }, [value]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setPredictions([]);
    setPredictionsWithDistance([]);
    setNoData(false);
  }, []);

  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (shouldOpenModalOnReturn) {
        setTimeout(() => {
          openModal();
        }, 100);
      }
    });

    return unsubscribe;
  }, [navigation, shouldOpenModalOnReturn, openModal]);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const locationData = await getLocationWithPermission();
        setCurrentUserLocation(locationData);
        // Initialize selected country from user location
        setSelectedCountry(
          resolveCountryObject(
            locationData?.countryCode || locationData?.country
          )
        );
        // Fetch nearby places when location is available
        if (locationData) {
          fetchNearbyPlaces(locationData.latitude, locationData.longitude);
        }
      } catch (error) {
        console.log(
          "Initial location fetch error:",
          error.userFriendlyMessage || error.message || error
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

    getUserLocation();
  }, []);

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
        text
      )}`;

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
        `https://maps.googleapis.com/maps/api/place/details/json?key=${API_KEY}&place_id=${placeId.trim()}&fields=address_components,geometry`
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
        (search) => search.address !== locationData.address
      );

      const updatedSearches = [newSearch, ...filteredSearches].slice(0, 3);

      dispatch(setRecentSearches(updatedSearches));
    },
    [recentSearches, dispatch]
  );

  const saveLocation = useCallback(
    (locationData) => {
      const newSavedLocation = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...locationData,
      };

      const filteredSaved = savedLocations?.filter(
        (saved) => saved.address !== locationData.address
      );

      const updatedSaved = [newSavedLocation, ...filteredSaved].slice(0, 10);

      dispatch(setSavedLocations(updatedSaved));
    },
    [savedLocations, dispatch]
  );

  const handlePredictionPress = async (item) => {
    if (item?.latitude && item?.longitude) {
      setValue(item.description || item.address);
      setSearchQuery(item.description || item.address);
      setLatLong?.({
        latitude: item.latitude,
        longitude: item.longitude,
      });
      setState?.(item.state);
      setCity?.(item.city);
      setZipCode?.(item.zipCode);
      setCountry?.(item.country);
      setSelectedCountry(resolveCountryObject(item.country));
      setSelectedLocationData(item);
      closeModal();
      return;
    }

    setValue(item.description || item.address);
    setSearchQuery(item.description || item.address);

    if (!item?.place_id) {
      console.warn("No place_id found in prediction item:", item);
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
            { mode: "driving", units: "metric" }
          );
          distance = road?.distanceKm ?? null;
        } catch (e) {
          distance = calculateDistance(
            currentUserLocation.latitude,
            currentUserLocation.longitude,
            placeDetails?.geometry?.location?.lat,
            placeDetails?.geometry?.location?.lng
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

      setState?.(components.state);
      setCity?.(components.city);
      setZipCode?.(components.zipCode);
      setCountry?.(components.country);
      setSelectedCountry(resolveCountryObject(components.country));

      const { lat, lng } = placeDetails?.geometry?.location;
      setLatLong?.({
        latitude: lat,
        longitude: lng,
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
                  { mode: "driving", units: "metric" }
                );
                distance = road?.distanceKm ?? null;
              } catch (e) {
                distance = calculateDistance(
                  currentUserLocation.latitude,
                  currentUserLocation.longitude,
                  placeDetails?.geometry?.location?.lat,
                  placeDetails?.geometry?.location?.lng
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
        })
      );

      const remainingPredictions = predictions.slice(5).map((prediction) => ({
        ...prediction,
        distance: null,
      }));

      setPredictionsWithDistance([
        ...predictionsWithDistanceData,
        ...remainingPredictions,
      ]);
    } catch (error) {
      console.error("Error calculating prediction distances:", error);
      setPredictionsWithDistance(
        predictions.map((p) => ({ ...p, distance: null }))
      );
    } finally {
      setLoadingDistances(false);
    }
  };

  const handleMapSelection = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      navigation.navigate("PicLocation", {
        setValue,
        setLatLong,
        setState,
        setCity,
        setZipCode,
        setCountry,
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
      setValue(locationData.address);
      setSearchQuery(locationData.address);

      addToRecentSearches(fullLocationData);

      setState?.(locationData.state);
      setCity?.(locationData.city);
      setZipCode?.(locationData.zipCode);
      setCountry?.(locationData.country);
      setSelectedCountry(
        resolveCountryObject(locationData?.countryCode || locationData?.country)
      );
      setLatLong?.({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      // Refresh nearby places with new location
      fetchNearbyPlaces(locationData.latitude, locationData.longitude);

      setIsModalVisible(false);
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

  const handleLocationFromMap = (locationData) => {
    setSelectedLocationData(locationData);
    setValue(locationData.address);
    setSearchQuery(locationData.address);

    addToRecentSearches(locationData);

    setState?.(locationData.state);
    setCity?.(locationData.city);
    setZipCode?.(locationData.zipCode);
    setCountry?.(locationData.country);
    setSelectedCountry(resolveCountryObject(locationData?.country));
    setLatLong?.({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    });
  };

  const renderPredictionItem = (
    { item },
    isRecent = false,
    isSaved = false,
    hideBorder = false,
    showLocationIcon = false
  ) => {
    const getIconForPlace = () => {
      if (item?.types) {
        if (item.types.includes("airport")) return PNGIcons.airportIcon;
        if (item.types.includes("train_station")) return PNGIcons.bus;
        if (item.types.includes("lodging")) return PNGIcons.bed;
        if (item.types.includes("restaurant")) return PNGIcons.restaurant;
        if (item.types.includes("gym")) return Images.quickaction1; // Using location as fallback for gym
        if (item.types.includes("cafe"))
          return PNGIcons.coffee; // Using food icon for cafe
        else return PNGIcons.pin;
      }
      return PNGIcons.pin;
    };
    // Check if this location is already saved
    const isLocationSaved = savedLocations?.some(
      (saved) => saved.address === (item?.description || item?.address)
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
            borderBottomWidth: hideBorder ? 0 : 1,
            borderBottomColor: hideBorder ? "transparent" : "#F6F6F6",
          },
        ]}
        onPress={() => handlePredictionPress(item)}
        disabled={isLoadingCurrentLocation}
      >
        {showLocationIcon && (
          <View style={styles.locationIconContainer}>
            <Image
              source={getIconForPlace()}
              style={[styles.map, { tintColor: "#121212" }]}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={styles.row}>
          {isRecent ? (
            <Image source={PNGIcons.clock} style={styles.map} />
          ) : null}

          <View style={{ width: distanceText ? "75%" : "83%" }}>
            <CustomText
              label={item?.description || item?.address}
              fontFamily={fonts.medium}
              fontSize={16}
              lineHeight={16 * 1.4}
              marginLeft={8}
            />
            <CustomText
              label={
                item?.structured_formatting?.secondary_text || item?.city || ""
              }
              fontFamily={fonts.medium}
              lineHeight={14 * 1.4}
              marginLeft={8}
              color="#1212127A"
            />
          </View>
        </View>
        {distanceText ? (
          <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
            <CustomText
              label={distanceText}
              fontFamily={fonts.medium}
              fontSize={14}
              lineHeight={14 * 1.4}
              color={COLORS.subtitle}
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
        {isSaved ? (
          <TouchableOpacity
            onPress={onSaveLocation}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={isLocationSaved ? PNGIcons.greenStar : PNGIcons.starLine}
              style={styles.map}
            />
          </TouchableOpacity>
        ) : null}
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
          color={COLORS.gray}
          textAlign="center"
        />
      </View>
    ) : null;

  // New function to fetch nearby places
  // New function to fetch nearby places - FIXED VERSION
  const fetchNearbyPlaces = async (latitude, longitude) => {
    if (!latitude || !longitude) return;

    setLoadingNearbyPlaces(true);

    try {
      const radius = 50000; // 50km radius
      const types = [
        { type: "airport", category: "airports" },
        { type: "train_station", category: "trainStations" },
        { type: "lodging", category: "hotels" },
        { type: "restaurant", category: "restaurants" },
        { type: "gym", category: "gyms" },
        { type: "cafe", category: "coffeeShops" },
      ];

      const nearbyData = {
        airports: [],
        trainStations: [],
        hotels: [],
        restaurants: [],
        gyms: [],
        coffeeShops: [],
      };

      // Fetch places for each type
      for (const { type, category } of types) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${API_KEY}&location=${latitude},${longitude}&radius=${radius}&type=${type}`;
          const response = await fetch(url);
          if (!response?.ok) {
            console.error(
              `HTTP error for ${type}! status: ${response?.status}`
            );
            continue;
          }

          const data = await response?.json();

          if (data.error_message) {
            console.error(
              `Google Places API Error for ${type}:`,
              data.error_message
            );
            continue;
          }

          if (data.results && data.results.length > 0) {
            // Take first 3 results for each category and calculate road distances
            const placesWithDistance = await Promise.all(
              data.results.slice(0, 3).map(async (place) => {
                let distance = null;
                try {
                  const road = await calculateRoadDistanceAndTime(
                    { latitude, longitude },
                    {
                      latitude: place.geometry.location.lat,
                      longitude: place.geometry.location.lng,
                    },
                    { mode: "driving", units: "metric" }
                  );
                  distance = road?.distanceKm ?? null;
                } catch (e) {
                  distance = calculateDistance(
                    latitude,
                    longitude,
                    place.geometry.location.lat,
                    place.geometry.location.lng
                  );
                }

                return {
                  place_id: place.place_id,
                  name: place.name,
                  address:
                    place.vicinity ||
                    place.formatted_address ||
                    "Address not available",
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                  distance: distance,
                  rating: place.rating,
                  types: place.types,
                  description: place.name, // Add description for compatibility
                  structured_formatting: {
                    secondary_text:
                      place.vicinity ||
                      place.formatted_address ||
                      "Address not available",
                  },
                };
              })
            );

            // Sort by distance and take the closest one
            placesWithDistance.sort(
              (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
            );
            nearbyData[category] = placesWithDistance[0]
              ? [placesWithDistance[0]]
              : [];
          }
        } catch (error) {
          console.error(`Error fetching ${type}:`, error);
        }
      }

      setNearbyPlaces(nearbyData);
    } catch (error) {
      console.error("Error fetching nearby places:", error);
    } finally {
      setLoadingNearbyPlaces(false);
    }
  };

  // Function to get icon for place type
  const getPlaceIcon = (types) => {
    if (types.includes("airport")) return PNGIcons.airportIcon;
    if (types.includes("train_station")) return PNGIcons.bus;
    if (types.includes("lodging")) return PNGIcons.bed;
    if (types.includes("restaurant")) return PNGIcons.restaurant;
    if (types.includes("gym")) return PNGIcons.gym || PNGIcons.fitness;
    if (types.includes("cafe")) return PNGIcons.coffee || PNGIcons.cafe;
    return PNGIcons.pin; // default icon
  };

  // Function to get category label
  const getCategoryLabel = (types) => {
    if (types.includes("airport")) return "AIRPORTS";
    if (types.includes("train_station")) return "TRAIN STATIONS";
    if (types.includes("lodging")) return "HOTELS";
    if (types.includes("restaurant")) return "RESTAURANTS";
    if (types.includes("gym")) return "GYMS";
    if (types.includes("cafe")) return "COFFEE SHOPS";
    return "RECOMMENDED";
  };
  const insets = useSafeAreaInsets();

  return (
    <>
      {isChange ? (
        <View
          style={[styles.addStepsContainer, { width: dotsWidth || "100%" }]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={onPress || openModal}
            activeOpacity={0.7}
          >
            <View pointerEvents="none">
              <CustomInput
                borderRadius={100}
                height={40}
                width="99%"
                marginBottom={0.1}
                editable={false}
                borderColor={COLORS.inputBg}
                value={value}
                placeholder="Add Steps"
                isClear={isClear}
                numberOfLines={numberOfLines || 1}
              />
            </View>
          </TouchableOpacity>

          <Icons
            name="reorder-three"
            family="Ionicons"
            size={30}
            color={COLORS.subtitle}
          />
        </View>
      ) : (
        <View
          style={[
            styles.dropdownMainContainer,
            {
              marginBottom: error ? 5 : marginBottom || 15,
              borderColor:
                error || isError
                  ? COLORS.error
                  : showSuccessColor
                  ? COLORS.success
                  : COLORS.inputBg,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.container,
              {
                backgroundColor:
                  error || isError
                    ? COLORS.errorBg
                    : showSuccessColor
                    ? COLORS.successBg
                    : COLORS.inputBg,
              },
            ]}
            onPress={onPress || openModal}
            disabled={disabled}
          >
            <View style={styles.labelAndValueContainer}>
              {withLabel && (
                <CustomText
                  label={withLabel}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  lineHeight={12 * 1.4}
                  marginTop={8}
                  textTransform="uppercase"
                  color={
                    error || isError
                      ? COLORS.error
                      : showSuccessColor
                      ? COLORS.success
                      : "#121212A3"
                  }
                />
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {hidePin ? null : (
                  <Icons
                    family="MaterialIcons"
                    name="location-pin"
                    size={18}
                    style={{ marginLeft: -4 }}
                  />
                )}

                <CustomText
                  label={value || placeholder}
                  color={
                    error || isError
                      ? COLORS.error
                      : showSuccessColor
                      ? COLORS.success
                      : value
                      ? COLORS.black
                      : COLORS.gray2
                  }
                  fontFamily={value ? fonts.medium : fonts.regular}
                  fontSize={16}
                  lineHeight={16 * 1.4}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  marginLeft={hidePin ? 0 : 2}
                />
              </View>
            </View>

            {!showIcon && (
              <Icons
                style={styles.chevronIcon}
                family="Entypo"
                name="chevron-down"
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      <CustomModal
        blurType="dark"
        blurAmount={0.1}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.1)"
        isBlur
        isChange
        isVisible={isModalVisible}
        onDisable={closeModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <CustomInput
              search
              width="86%"
              height={44}
              borderRadius={100}
              marginBottom={0.1}
              isClear={() => setSearchQuery("")}
              onChangeText={handleInputChange}
              value={searchQuery}
              placeholder={searchPlaceHolder || "Search location..."}
              autoFocus
              backgroundColor="rgba(18, 18, 18, 0.04)"
            />
            <TouchableOpacity
              style={styles.crossContainer}
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <Image source={PNGIcons.cross} style={styles.cross} />
            </TouchableOpacity>
          </View>
          {showCountryPicker && (
            <View style={{ paddingHorizontal: 16 }}>
              <CountryPicker
                selectedCountry={selectedCountry}
                onCountrySelect={(country) => {
                  setSelectedCountry(country);
                  setCountry?.(country);
                }}
                label="COUNTRY"
                placeholder="Select country"
              />
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.6}
            style={[
              styles.selectMap,
              { borderBottomWidth: 1, borderBottomColor: "#F6F6F6" },
            ]}
            onPress={handleMapSelection}
          >
            <View style={styles.row}>
              <Image source={PNGIcons.map} style={styles.map} />
              <CustomText
                label="Select On The Map"
                fontFamily={fonts.medium}
                fontSize={16}
                lineHeight={16 * 1.4}
                marginLeft={8}
              />
            </View>
            <Icons
              name="keyboard-arrow-right"
              family="MaterialIcons"
              size={24}
              color={COLORS.subtitle}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.6}
            style={[
              styles.selectMap,
              {
                borderBottomWidth:
                  predictionsWithDistance.length && predictions.length ? 4 : 1,
                borderBottomColor: "#F6F6F6",
              },
            ]}
            onPress={handleCurrentLocationSelection}
            disabled={isLoadingCurrentLocation}
          >
            <View style={styles.row}>
              <Image source={PNGIcons.pin} style={styles.map} />
              <View>
                <CustomText
                  label={
                    currentUserLocation
                      ? currentUserLocation.city || "Current Location"
                      : "Get Current Location"
                  }
                  fontFamily={fonts.medium}
                  fontSize={16}
                  lineHeight={16 * 1.4}
                  marginLeft={8}
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
                  lineHeight={14 * 1.4}
                  marginLeft={8}
                  color="#1212127A"
                />
              </View>
            </View>
            {isLoadingCurrentLocation ? (
              <ActivityIndicator size="small" color={COLORS.subtitle} />
            ) : (
              <CustomText
                label={currentUserLocation ? "Currently here" : "Get location"}
                fontFamily={fonts.medium}
                lineHeight={14 * 1.4}
                marginLeft={8}
                color={COLORS.subtitle}
              />
            )}
          </TouchableOpacity>
          <ScrollView>
            {predictionsWithDistance.length && predictions.length ? null : (
              <>
                {/* Recent Searches Section - Moved to Top */}
                <View>
                  {recentSearches?.length ? (
                    <View style={styles.divider}>
                      <CustomText
                        label="RECENT SEARCHES"
                        fontFamily={fonts.medium}
                        fontSize={12}
                        lineHeight={12 * 1.4}
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
                </View>

                {/* Saved Locations Section */}
                <View>
                  {savedLocations?.length ? (
                    <View style={styles.divider}>
                      <CustomText
                        label="SAVED LOCATIONS"
                        fontFamily={fonts.medium}
                        fontSize={12}
                        lineHeight={12 * 1.4}
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
                </View>

                {(loadingNearbyPlaces || nearbyPlaces.airports.length > 0) && (
                  <>
                    <View style={styles.divider}>
                      <Image
                        source={PNGIcons.airportIcon}
                        style={styles.plane}
                      />
                      <CustomText
                        label="AIRPORTS"
                        fontFamily={fonts.medium}
                        fontSize={12}
                        lineHeight={12 * 1.4}
                        color="#121212A3"
                        marginLeft={6}
                      />
                    </View>
                    {loadingNearbyPlaces ? (
                      <SkeletonLoader
                        type="section"
                        style={styles.skeletonSection}
                      />
                    ) : nearbyPlaces.airports.length > 0 ? (
                      renderPredictionItem(
                        {
                          item: {
                            description: nearbyPlaces.airports[0].name,
                            structured_formatting: {
                              secondary_text: nearbyPlaces.airports[0].address,
                            },
                            place_id: nearbyPlaces.airports[0].place_id,
                            latitude: nearbyPlaces.airports[0].latitude,
                            longitude: nearbyPlaces.airports[0].longitude,
                            distance: nearbyPlaces.airports[0].distance,
                            types: nearbyPlaces.airports[0].types,
                          },
                        },
                        false,
                        true,
                        true
                      )
                    ) : null}
                  </>
                )}

                {(loadingNearbyPlaces ||
                  nearbyPlaces.trainStations.length > 0) && (
                  <>
                    <View style={styles.divider}>
                      <Image source={PNGIcons.bus} style={styles.plane} />
                      <CustomText
                        label="TRAIN STATIONS"
                        fontFamily={fonts.medium}
                        fontSize={12}
                        lineHeight={12 * 1.4}
                        color="#121212A3"
                        marginLeft={6}
                      />
                    </View>
                    {loadingNearbyPlaces ? (
                      <SkeletonLoader
                        type="section"
                        style={styles.skeletonSection}
                      />
                    ) : nearbyPlaces.trainStations.length > 0 ? (
                      renderPredictionItem(
                        {
                          item: {
                            description: nearbyPlaces.trainStations[0].name,
                            structured_formatting: {
                              secondary_text:
                                nearbyPlaces.trainStations[0].address,
                            },
                            place_id: nearbyPlaces.trainStations[0].place_id,
                            latitude: nearbyPlaces.trainStations[0].latitude,
                            longitude: nearbyPlaces.trainStations[0].longitude,
                            distance: nearbyPlaces.trainStations[0].distance,
                            types: nearbyPlaces.trainStations[0].types,
                          },
                        },
                        false,
                        true,
                        true
                      )
                    ) : null}
                  </>
                )}

                {(loadingNearbyPlaces || nearbyPlaces.hotels.length > 0) && (
                  <>
                    <View style={styles.divider}>
                      <Image source={PNGIcons.bed} style={styles.plane} />
                      <CustomText
                        label="HOTELS"
                        fontFamily={fonts.medium}
                        fontSize={12}
                        lineHeight={12 * 1.4}
                        color="#121212A3"
                        marginLeft={6}
                      />
                    </View>
                    {loadingNearbyPlaces ? (
                      <SkeletonLoader
                        type="section"
                        style={styles.skeletonSection}
                      />
                    ) : nearbyPlaces.hotels.length > 0 ? (
                      renderPredictionItem(
                        {
                          item: {
                            description: nearbyPlaces.hotels[0].name,
                            structured_formatting: {
                              secondary_text: nearbyPlaces.hotels[0].address,
                            },
                            place_id: nearbyPlaces.hotels[0].place_id,
                            latitude: nearbyPlaces.hotels[0].latitude,
                            longitude: nearbyPlaces.hotels[0].longitude,
                            distance: nearbyPlaces.hotels[0].distance,
                            types: nearbyPlaces.hotels[0].types,
                          },
                        },
                        false,
                        true,
                        true
                      )
                    ) : null}
                  </>
                )}

                {(loadingNearbyPlaces ||
                  nearbyPlaces.restaurants.length > 0 ||
                  nearbyPlaces.gyms.length > 0 ||
                  nearbyPlaces.coffeeShops.length > 0) && (
                  <View style={styles.divider}>
                    <CustomText
                      label="RECOMMENDED"
                      fontFamily={fonts.medium}
                      fontSize={12}
                      lineHeight={12 * 1.4}
                      color="#121212A3"
                    />
                  </View>
                )}

                {/* Restaurant */}
                {loadingNearbyPlaces ? (
                  <SkeletonLoader
                    type="section"
                    style={styles.skeletonSection}
                  />
                ) : nearbyPlaces.restaurants.length > 0 ? (
                  renderPredictionItem(
                    {
                      item: {
                        description: nearbyPlaces.restaurants[0].name,
                        structured_formatting: {
                          secondary_text: nearbyPlaces.restaurants[0].address,
                        },
                        place_id: nearbyPlaces.restaurants[0].place_id,
                        latitude: nearbyPlaces.restaurants[0].latitude,
                        longitude: nearbyPlaces.restaurants[0].longitude,
                        distance: nearbyPlaces.restaurants[0].distance,
                        types: nearbyPlaces.restaurants[0].types,
                      },
                    },
                    false,
                    true,
                    false,
                    true
                  )
                ) : null}

                {/* Gym */}
                {loadingNearbyPlaces ? (
                  <SkeletonLoader
                    type="section"
                    style={styles.skeletonSection}
                  />
                ) : nearbyPlaces.gyms.length > 0 ? (
                  renderPredictionItem(
                    {
                      item: {
                        description: nearbyPlaces.gyms[0].name,
                        structured_formatting: {
                          secondary_text: nearbyPlaces.gyms[0].address,
                        },
                        place_id: nearbyPlaces.gyms[0].place_id,
                        latitude: nearbyPlaces.gyms[0].latitude,
                        longitude: nearbyPlaces.gyms[0].longitude,
                        distance: nearbyPlaces.gyms[0].distance,
                        types: nearbyPlaces.gyms[0].types,
                      },
                    },
                    false,
                    true,
                    false,
                    true
                  )
                ) : null}

                {/* Coffee Shop */}
                {loadingNearbyPlaces ? (
                  <SkeletonLoader
                    type="section"
                    style={styles.skeletonSection}
                  />
                ) : nearbyPlaces.coffeeShops.length > 0 ? (
                  renderPredictionItem(
                    {
                      item: {
                        description: nearbyPlaces.coffeeShops[0].name,
                        structured_formatting: {
                          secondary_text: nearbyPlaces.coffeeShops[0].address,
                        },
                        place_id: nearbyPlaces.coffeeShops[0].place_id,
                        latitude: nearbyPlaces.coffeeShops[0].latitude,
                        longitude: nearbyPlaces.coffeeShops[0].longitude,
                        distance: nearbyPlaces.coffeeShops[0].distance,
                        types: nearbyPlaces.coffeeShops[0].types,
                      },
                    },
                    false,
                    true,
                    false,
                    true
                  )
                ) : null}
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

            {error && (
              <View style={styles.errorContainer}>
                <CustomText
                  label={error}
                  color={COLORS.error}
                  fontFamily={fonts.medium}
                  fontSize={12}
                  textAlign="center"
                />
              </View>
            )}
          </ScrollView>
        </View>
      </CustomModal>
    </>
  );
};

export default GooglePlaces;

const styles = StyleSheet.create({
  dropdownMainContainer: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 56,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelAndValueContainer: {
    flex: 1,
    justifyContent: "space-between",
    height: "100%",
    paddingRight: 12,
  },

  chevronIcon: {
    color: COLORS.gray1,
    fontSize: 20,
    marginLeft: 8,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    width: "100%",
    height: "100%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBlockColor: "#F6F6F6",
    borderBottomWidth: 4,
    padding: 16,
  },
  selectMap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  crossContainer: {
    borderRadius: 100,
    backgroundColor: "rgba(18, 18, 18, 0.04)",
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cross: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  predictionsList: {
    flex: 1,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },

  predictionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationIcon: {
    color: COLORS.primary,
    fontSize: 18,
    marginRight: 12,
  },
  predictionText: {
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.errorBg,
    borderRadius: 8,
    marginTop: 8,
  },

  map: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  addStepsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 18,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  plane: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    tintColor: "#121212",
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1212120A",
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
    borderBottomWidth: 1,
    borderBottomColor: "#F6F6F6",
  },
  skeletonSectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F6F6F6",
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
  skeletonCurrentLocation: {
    width: 60,
    height: 14,
    borderRadius: 4,
  },
});
