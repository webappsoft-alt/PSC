import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CameraS from "../screens/Main/Home/Camera";
import MainScreen from "../screens/Main/Home/MainScreen";

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainScreen}
        options={{
          animation: "slide_from_left",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraS}
        options={{
          animation: "slide_from_right",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
