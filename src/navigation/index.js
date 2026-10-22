import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import { useSelector, useStore } from "react-redux";

import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import SessionExpiryModal from "../components/SessionExpiryModal";
import ProfileSelector from "../screens/Auth/ProfileSelector";
import PinVerification from "../screens/Auth/PinVerification";
import { hasProfilePin } from "../utils/profileLock";

const Stack = createNativeStackNavigator();

/**
 * Launch gate (ported from Viral app/index.tsx): a signed-in device with
 * saved accounts opens on the profile selector — or, with "Don't show next
 * time" on, straight on the PIN of the account in use.
 */
const initialRouteOf = (state) => {
  const isToken = state?.authConfig?.token;
  const users = state?.users;
  const accounts = Array.isArray(users?.savedAccounts)
    ? users.savedAccounts
    : [];

  if (!isToken) return { name: "AuthStack" };
  if (!accounts.length) return { name: "MainStack" };

  const active = accounts.find(
    (a) => String(a?.id) === String(users?.activeAccountId || ""),
  );
  if (users?.skipProfileSelector && active) {
    return {
      name: "PinVerification",
      params: {
        mode: hasProfilePin(users, active.id) ? "enter" : "define",
        purpose: "profile",
        accountId: String(active.id),
      },
    };
  }
  return { name: "ProfileSelector" };
};

const RootNavigation = () => {
  const isToken = useSelector((state) => state.authConfig.token);
  // Decided once at launch (the store is rehydrated by PersistGate already).
  const store = useStore();
  const [initial] = useState(() => initialRouteOf(store.getState()));

  // The account screens are reachable whether or not a session is live.
  const accountScreens = (
    <>
      <Stack.Screen name="ProfileSelector" component={ProfileSelector} />
      <Stack.Screen
        name="PinVerification"
        component={PinVerification}
        initialParams={
          initial.name === "PinVerification" ? initial.params : undefined
        }
      />
    </>
  );

  return (
    <>
      <Stack.Navigator
        initialRouteName={initial.name}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {isToken ? (
          <>
            <Stack.Screen name="MainStack" component={MainStack} />
            <Stack.Screen name="AuthStack" component={AuthStack} />
            {accountScreens}
          </>
        ) : (
          <>
            <Stack.Screen name="AuthStack" component={AuthStack} />
            <Stack.Screen name="MainStack" component={MainStack} />
            {accountScreens}
          </>
        )}
      </Stack.Navigator>
      <SessionExpiryModal />
    </>
  );
};

export default RootNavigation;
