/**
 * INTEGRATION GUIDE - Live Streaming Feature
 * 
 * This file documents all the setup needed to integrate the live streaming feature
 * into your React Native CLI app.
 */

// ============================================================================
// STEP 1: APP ROOT SETUP (App.js or index.js)
// ============================================================================

/*
Your app root should look like this:

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Context providers for live streaming
import { CreateCameraProvider } from './src/contexts/CreateCameraContext';
import { PublishSelectionProvider } from './src/contexts/PublishSelectionContext';
import { UploadProgressProvider } from './src/contexts/UploadProgressContext';
import { SocketProvider } from './src/components/SocketProvider';

// Navigation
import MainNavigator from './src/navigation/MainStack';

// VideoSDK initialization
import { ensureVideoSdkRegistered } from './src/services/videosdk';

// Redux store
import store from './src/store';

export default function App() {
  useEffect(() => {
    // Initialize VideoSDK on app start
    ensureVideoSdkRegistered().catch(err => 
      console.error('Failed to initialize VideoSDK:', err)
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <SocketProvider>
            <CreateCameraProvider>
              <PublishSelectionProvider>
                <UploadProgressProvider>
                  <NavigationContainer>
                    <MainNavigator />
                  </NavigationContainer>
                </UploadProgressProvider>
              </PublishSelectionProvider>
            </CreateCameraProvider>
          </SocketProvider>
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
*/

// ============================================================================
// STEP 2: PACKAGE.JSON - REQUIRED DEPENDENCIES
// ============================================================================

/*
Ensure these packages are installed:

"dependencies": {
  // React Native & Navigation
  "react-native": "^0.73.0",
  "react-native-gesture-handler": "^2.14.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "@react-navigation/stack": "^6.3.0",
  "react-native-safe-area-context": "^4.7.0",
  "react-native-screens": "^3.26.0",
  
  // VideoSDK
  "@videosdk.live/react-native-sdk": "^0.1.x",
  "react-native-webrtc": "^111.0.0",
  
  // Camera & Media
  "react-native-camera": "^4.2.0",
  "react-native-camera-roll": "^7.4.0",
  "react-native-video": "^5.2.0",
  
  // State Management
  "react-redux": "^8.1.0",
  "redux": "^4.2.0",
  
  // Storage & Networking
  "@react-native-async-storage/async-storage": "^1.21.0",
  "axios": "^1.6.0",
  
  // UI Components
  "@gorhom/bottom-sheet": "^4.4.0",
  "react-native-svg": "^13.14.0",
  
  // Stripe (if needed)
  "@stripe/stripe-react-native": "^0.30.0",
  
  // Date/Time
  "moment": "^2.29.0"
}
*/

// ============================================================================
// STEP 3: API BACKEND REQUIREMENTS
// ============================================================================

/*
Your backend must provide these endpoints:

1. POST /live-stream/generate-token
   Request: { userName: string }
   Response: { data: "token-string" }
   Purpose: Get VideoSDK token for joining meetings

2. POST /live-stream/create-room
   Request: {
     title: string,
     description: string,
     topic: string,
     hashtags: string[],
     sponsoredBy: string[],
     collaberation: string[],
     mentions: string[],
     availableTo: "public" | "followers" | "friends",
     location: { lat: number, lng: number, address: string }
   }
   Response: {
     liveStream: {
       liveId: string,     // VideoSDK meeting ID
       token: string,      // VideoSDK token
       _id: string,        // Database ID
       title: string,
       user: { _id: string, name: string }
     }
   }
   Purpose: Create a new live stream session

3. GET /live-stream/:id
   Response: { data: { liveStream: {...} } }
   Purpose: Fetch live stream details

4. POST /live-stream/:id/like
   Request: {}
   Response: Success message
   Purpose: Like a live stream

5. GET /live-stream
   Query: { page: number, limit: number }
   Response: { data: [...] }
   Purpose: List all live streams
*/

// ============================================================================
// STEP 4: NAVIGATION FLOW
// ============================================================================

/*
Live Stream User Flow:

BROADCASTER:
1. PublishStory screen
   - User fills: title, topic, hashtags, collaborators, sponsors
   - Clicks "Launch Live"
   - handleLaunchLive() calls createMeeting()
   - Navigates to LiveStreaming screen with meetingId, token, liveStreamId

2. LiveStreaming screen
   - LiveStreamingScreen extracts params from route
   - Renders LiveStreamingView component
   - LiveStreamingView auto-joins meeting
   - Shows broadcast with mic/camera/end controls
   - onStop callback → navigates to LiveEnded screen

3. LiveEnded screen
   - Shows duration and viewer count
   - Back button navigates to TabStack (home)

VIEWER:
1. From stream list/post feed
   - Taps on live stream item
   - Navigates to ViewStream screen with meetingId

2. ViewStream screen
   - ViewStreamScreen extracts params
   - Renders ViewerStreamScreen component
   - ViewerStreamScreen gets token, joins as viewer
   - Shows broadcaster's video, like button, reactions
   - Viewer count displayed

3. Press back to exit stream
*/

// ============================================================================
// STEP 5: CONTEXT PROVIDERS
// ============================================================================

/*
CreateCameraContext:
- useCreateCamera() hook
- Methods: setIsLiveMode(), destroyCamera(), setCameraReady()
- Used by: LiveStreamingScreen to manage camera state

PublishSelectionContext:
- usePublishSelection() hook
- State: selectedSponsor, selectedCollaborators
- Used by: PublishStory form

UploadProgressContext:
- useUploadProgress() hook
- State: isLiveUploading, isLiveUploaded
- Used by: LiveStreamingView for progress tracking

SocketProvider:
- useSocket() hook
- State: socket connection
- Used by: ViewerStreamScreen for event emissions
*/

// ============================================================================
// STEP 6: ENVIRONMENT SETUP
// ============================================================================

/*
Android Permissions (AndroidManifest.xml):
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />

iOS Info.plist:
<key>NSCameraUsageDescription</key>
<string>We need camera access to broadcast live streams</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for live streaming</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location for live stream metadata</string>
*/

// ============================================================================
// STEP 7: TESTING CHECKLIST
// ============================================================================

/*
Before going live, test:

[ ] App starts without errors
[ ] VideoSDK initializes on startup
[ ] PublishStory form opens correctly
[ ] Can fill and submit form
[ ] Navigation to LiveStreaming works
[ ] LiveStreamingView joins meeting successfully
[ ] Can toggle mic and camera
[ ] Can end stream
[ ] Navigation to LiveEnded works correctly
[ ] Can view live streams as viewer
[ ] ViewerStreamScreen joins viewer meeting
[ ] Can see broadcaster's video
[ ] Like button works
[ ] Exit stream works
[ ] All context providers properly initialized
*/

// ============================================================================
// STEP 8: TROUBLESHOOTING
// ============================================================================

/*
Common Issues:

1. "VideoSDK not registered"
   - Solution: Call ensureVideoSdkRegistered() in app root on startup
   
2. "Cannot get token"
   - Solution: Verify backend /live-stream/generate-token endpoint exists
   - Check API request logs
   
3. "Meeting join fails"
   - Solution: Verify VideoSDK SDK is initialized
   - Check token is valid
   - Verify meetingId is correct
   
4. "Camera/microphone permissions denied"
   - Solution: Request permissions before starting broadcast
   - Check AndroidManifest.xml and Info.plist
   
5. "Navigation errors"
   - Solution: Verify screen names match exactly in navigation stack
   - Check route params are passed correctly
   - Verify useNavigation() hook imported from @react-navigation/native
   
6. "Context not available"
   - Solution: Ensure providers wrap entire app in correct order
   - Child components must be wrapped by parent providers
*/

export { };
