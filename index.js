/**
 * @format
 */

import { AppRegistry } from "react-native";
import messaging from "@react-native-firebase/messaging";
import App from "./App";
import { name as appName } from "./app.json";
import { register } from "@videosdk.live/react-native-sdk";

register();
// Register background handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);
});
AppRegistry.registerComponent(appName, () => App);
