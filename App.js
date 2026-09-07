import NetInfo from "@react-native-community/netinfo";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";

import {
  Alert,
  BackHandler,
  I18nManager,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import messaging from "@react-native-firebase/messaging";

import BrainBox from "./src/components/BrainBox";
import { HomeSheetProvider } from "./src/context/HomeSheetContext";
import { UploadProvider, useUpload } from "./src/contexts/UploadContext";
import { CreateCameraProvider } from "./src/contexts/CreateCameraContext";
import { PublishSelectionProvider } from "./src/contexts/PublishSelectionContext";
import { UploadProgressProvider } from "./src/contexts/UploadProgressContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { FontScaleProvider } from "./src/contexts/FontScaleContext";
import { HighContrastProvider } from "./src/contexts/HighContrastContext";
import SocketProvider from "./src/components/SocketProvider";
import GlobalToast from "./src/components/GlobalToast";
import UploadProgress from "./src/components/UploadProgress";
import InAppNotification from "./src/components/InAppNotification";
import { useNotificationNavigation } from "./src/hooks/useNotificationNavigation";
import { ensureVideoSdkRegistered } from "./src/services/videosdk";

import { navigationRef } from "./src/navigation/navigationRef";
import Navigation from "./src/navigation";
import { persistor, store } from "./src/store";
import { toastRef } from "./src/utils/ToastMessage";
import DetailPageWithId from "./src/screens/Main/Home/DetailPageWithId";

const NetworkErrorScreen = ({ onRetry }) => {
  return (
    <View style={styles.errorContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* Error Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.errorIcon}>📡</Text>
      </View>

      {/* Error Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.errorTitle}>No Internet Connection</Text>
        <Text style={styles.errorSubtitle}>
          Please check your internet connection and try again
        </Text>

        <View style={styles.bulletPoints}>
          <Text style={styles.bulletPoint}>• Check your WiFi connection</Text>
          <Text style={styles.bulletPoint}>• Check your mobile data</Text>
          <Text style={styles.bulletPoint}>
            • Try moving to a better signal area
          </Text>
        </View>
      </View>

      {/* Retry Button */}
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry Connection</Text>
      </TouchableOpacity>

      {/* Continue Without Internet Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          Alert.alert(
            "Limited Functionality",
            "Some features may not work without internet connection.",
            [
              {
                text: "Continue Anyway",
                onPress: () => store.dispatch({ type: "FORCE_OFFLINE_MODE" }),
              },
            ]
          );
        }}
      >
        <Text style={styles.continueButtonText}>Continue Offline</Text>
      </TouchableOpacity>

      {/* Exit Button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => BackHandler.exitApp()}
      >
        <Text style={styles.exitButtonText}>Exit App</Text>
      </TouchableOpacity>
    </View>
  );
};

export const requestPermissionOnDemand = async (permissionType) => {
  if (Platform.OS !== "android") return true;

  try {
    let permission;
    let permissionName;

    switch (permissionType) {
      case "camera":
        permission = PermissionsAndroid.PERMISSIONS.CAMERA;
        permissionName = "Camera";
        break;
      case "phone":
        permission = PermissionsAndroid.PERMISSIONS.CALL_PHONE;
        permissionName = "Phone";
        break;
      case "location":
        permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        permissionName = "Location";
        break;
      default:
        return false;
    }

    const hasPermission = await PermissionsAndroid.check(permission);

    if (hasPermission) {
      return true;
    }

    const result = await PermissionsAndroid.request(permission, {
      title: `${permissionName} Permission Required`,
      message: `This feature requires ${permissionName.toLowerCase()} access to work properly.`,
      buttonNeutral: "Ask Me Later",
      buttonNegative: "Cancel",
      buttonPositive: "OK",
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.log("Permission request error:", error);
    return false;
  }
};

export const checkPermissionStatus = async (permissionType) => {
  if (Platform.OS !== "android") return true;

  try {
    let permission;
    switch (permissionType) {
      case "camera":
        permission = PermissionsAndroid.PERMISSIONS.CAMERA;
        break;
      case "phone":
        permission = PermissionsAndroid.PERMISSIONS.CALL_PHONE;
        break;
      case "location":
        permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        break;
      default:
        return false;
    }

    return await PermissionsAndroid.check(permission);
  } catch (error) {
    console.log("Permission check error:", error);
    return false;
  }
};

const queryClient = new QueryClient();

const UploadProgressWrapper = () => {
  const { uploadProgressRef } = useUpload();
  return <UploadProgress ref={uploadProgressRef} />;
};

const AppContent = () => {
  const linking = {
    prefixes: ["psc://", "https://psc.sola-group.ch"],
    config: {
      screens: {
        MainStack: {
          screens: {
            DetailPageWithId: "post/:postId",
            ShortWithId: "short/:postId",
            ViewStream: "live/:meetingId",
            UserProfile: "user/:userId",
            RequestsScreen: "request",
          },
        },
      },
    },
  };
  const inAppNotificationRef = useRef(null);
  const { handleNotificationPress } = useNotificationNavigation();
  const { colors, isDark } = useTheme();
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.buttonColor,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.red,
    },
  };
  const stripeKey =
    "pk_test_51PNjntRrXj8bYHvWmM4xpswZA7FlZ5SLAibKdGaJpmGoY7NnishkRDXlN1cH0hcThSsNkHiqUt4g2zjm27f4O69S0098gYAC7N";
  const merchantIdentifier = "merchant.com.solagroup.viral";

  const [isConnected, setIsConnected] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [showNetworkError, setShowNetworkError] = useState(false);

  useEffect(() => {
    // Force LTR layout
    if (I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      I18nManager.allowRTL(false);
      // Note: You may need to restart the app for this to take effect
    }
  }, []);
  // useEffect(() => {
  //   const unsubscribe = NetInfo.addEventListener((state) => {
  //     setIsConnected(state.isConnected);
  //     setShowNetworkError(!state.isConnected);
  //     setIsCheckingConnection(false);
  //   });

  //   NetInfo.fetch().then((state) => {
  //     setIsConnected(state.isConnected);
  //     setShowNetworkError(!state.isConnected);
  //     setIsCheckingConnection(false);
  //   });

  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
    // Request permission and get token
    const setupNotifications = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // console.log("Authorization status:", authStatus);
        const token = await messaging().getToken();
        // console.log("FCM Token:----->", token);
      }
    };

    setupNotifications();

    // Foreground listener
    const unsubscribeOnMessage = messaging().onMessage(
      async (remoteMessage) => {
        inAppNotificationRef.current?.show(remoteMessage);
      }
    );

    // App opened from background state
    const unsubscribeOnNotificationOpenedApp =
      messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log(
          "Notification caused app to open from background state:",
          remoteMessage
        );
        handleNotificationPress(remoteMessage);
      });

    // App opened from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Notification caused app to open from quit state:",
            remoteMessage
          );
          handleNotificationPress(remoteMessage);
        }
      });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpenedApp();
    };
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize VideoSDK
      await ensureVideoSdkRegistered().catch((err) =>
        console.error("Failed to initialize VideoSDK:", err)
      );

      if (Platform.OS === "android") {
        await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE
        );
      }
    } catch (error) {
      console.log("App initialization error:", error);
    }
  };

  const retryConnection = async () => {
    setIsCheckingConnection(true);

    try {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);
      setShowNetworkError(!state.isConnected);

      if (!state.isConnected) {
        setTimeout(() => {
          Alert.alert(
            "Still No Connection",
            "You can continue using the app with limited functionality.",
            [
              {
                text: "Continue Offline",
                onPress: () => setShowNetworkError(false),
              },
              { text: "Try Again", onPress: retryConnection },
            ]
          );
        }, 1000);
      }
    } catch (error) {
      console.log("Network retry error:", error);
      Alert.alert(
        "Connection Error",
        "Unable to check network status. Continue with limited functionality?",
        [
          { text: "Yes", onPress: () => setShowNetworkError(false) },
          { text: "Retry", onPress: retryConnection },
        ]
      );
    } finally {
      back;
      setIsCheckingConnection(false);
    }
  };

  // if (isCheckingConnection) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <StatusBar barStyle="dark-content" backgroundColor="white" />
  //       <Text style={styles.loadingText}>Starting app...</Text>
  //       <Text style={styles.loadingSubText}>Checking connection</Text>
  //     </View>
  //   );
  // }

  if (showNetworkError) {
    return <NetworkErrorScreen onRetry={retryConnection} />;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StripeProvider
          publishableKey={stripeKey}
          merchantIdentifier={merchantIdentifier}
          urlScheme="psc"
        >
          <StatusBar
            barStyle={colors.statusBarStyle}
            backgroundColor={colors.statusBarColor}
          />
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <SocketProvider>
                  <CreateCameraProvider>
                    <PublishSelectionProvider>
                      <UploadProgressProvider>
                        <NavigationContainer
                          linking={linking}
                          ref={navigationRef}
                          theme={navigationTheme}
                        >
                          <HomeSheetProvider>
                            <UploadProvider>
                              <BrainBox>
                                <Navigation />
                                <GlobalToast ref={toastRef} />
                                <UploadProgressWrapper />
                                <InAppNotification ref={inAppNotificationRef} />
                              </BrainBox>
                            </UploadProvider>
                          </HomeSheetProvider>
                        </NavigationContainer>
                      </UploadProgressProvider>
                    </PublishSelectionProvider>
                  </CreateCameraProvider>
                </SocketProvider>
              </GestureHandlerRootView>
            </PersistGate>
          </Provider>
        </StripeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <HighContrastProvider>
      <FontScaleProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </FontScaleProvider>
    </HighContrastProvider>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  errorIcon: {
    fontSize: 80,
    textAlign: "center",
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 10,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  bulletPoints: {
    alignItems: "flex-start",
  },
  bulletPoint: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 5,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  exitButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  exitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    fontSize: 18,
    color: "#343a40",
    fontWeight: "bold",
  },
  loadingSubText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 10,
  },
});

export default App;
