import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import SessionExpiryModal from "../components/SessionExpiryModal";

const Stack = createNativeStackNavigator();

const RootNavigation = () => {
  const isToken = useSelector((state) => state.authConfig.token);

  return (
    <>
      <Stack.Navigator
        // initialRouteName="MainStack"
        initialRouteName={isToken ? "MainStack" : "AuthStack"}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {isToken ? (
          <>
            <Stack.Screen name="MainStack" component={MainStack} />
            <Stack.Screen name="AuthStack" component={AuthStack} />
          </>
        ) : (
          <>
            <Stack.Screen name="AuthStack" component={AuthStack} />
            <Stack.Screen name="MainStack" component={MainStack} />
          </>
        )}
      </Stack.Navigator>
      <SessionExpiryModal />
    </>
  );
};

export default RootNavigation;
