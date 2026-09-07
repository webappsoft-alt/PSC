import CameraErrorMessage from "../../../components/CamerErrorMessage";
import CaptureButton from "../../../components/CaptureButton";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import SelfiPreview from "../../../components/SelfiPreview";
import { COLORS } from "../../../utils/COLORS";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useIsForeground } from "../../../utils/UseIsForground";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  useIsFocused,
} from "@react-navigation/native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, Mask, Rect } from "react-native-svg";

const CaptureSelfi = () => {
  const camera = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();

  const { frontSide, backSide, subscription, fromProfile } =
    route?.params || {};

  const [media, setMedia] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();
  const [isPermissionChecked, setIsPermissionChecked] = useState(hasPermission);

  const isForeground = useIsForeground();
  const isActive = isFocused && isForeground;

  const device = useCameraDevice("front");

  const onPermissions = async () => {
    try {
      if (!hasPermission) {
        await requestPermission();
        setIsPermissionChecked(true);
      } else {
        setIsPermissionChecked(true);
      }
    } catch (error) {
      console.log("Permission check error:", error);
      setIsPermissionChecked(true);
    }
  };

  const handleCapture = async () => {
    if (!camera?.current) {
      return ToastMessage("Camera not found!", "error");
    }
    setLoading(true);

    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: "balanced",
      });

      let filePath = photo?.path;
      if (filePath && !filePath.startsWith("file://")) {
        filePath = `file://${filePath}`;
      }

      setMedia(filePath || "");
      setActive(false);
    } catch (error) {
      console.log("Capture error:", error);
      ToastMessage("Failed to capture photo", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (media) {
      setActive(true);
      setMedia("");
    } else {
      navigation.goBack();
    }
  };

  const handleContinue = () => {
    navigation.navigate("KYCResult", {
      backSide,
      frontSide,
      subscription,
      selfi: media,
      fromProfile,
    });
  };

  useFocusEffect(
    useCallback(() => {
      onPermissions();
      setActive(true);

      return () => {
        setActive(false);
      };
    }, [hasPermission]),
  );

  const insets = useSafeAreaInsets();

  if (!isPermissionChecked && !hasPermission) {
    return <View style={styles.blank} />;
  }

  if (!hasPermission) {
    return <CameraErrorMessage />;
  }

  if (!device) {
    return <View style={styles.blank} />;
  }

  return (
    <ScreenWrapper paddingHorizontal={0.1}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={handleBack}
          style={styles.backIcon}
        >
          <Icons
            size={26}
            color={COLORS.white}
            family="MaterialIcons"
            name={"keyboard-arrow-left"}
          />
        </TouchableOpacity>
        <CustomText
          fontSize={20}
          label={"Back"}
          color={COLORS.white}
          textTransform={"none"}
          fontFamily={"Poppins_600SemiBold"}
        />
      </View>

      {media ? (
        <SelfiPreview
          selfi={media}
          handleVerify={handleContinue}
          handleCancel={() => {
            setMedia("");
            setActive(true);
          }}
        />
      ) : (
        <>
          <View style={styles.overlayContainer}>
            <Svg height="100%" width="100%">
              <Defs>
                <Mask id="mask" x="0" y="0" width="100%" height="100%">
                  <Rect width="100%" height="100%" fill="white" />
                  <Ellipse cx="50%" cy="45%" rx="145" ry="200" fill="black" />
                </Mask>
              </Defs>

              <Rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.6)"
                mask="url(#mask)"
              />

              <Ellipse
                cx="50%"
                cy="45%"
                rx="145"
                ry="200"
                strokeWidth={1}
                stroke={"#FFFFFF"}
                fill="transparent"
              />
            </Svg>
          </View>

          <View style={[StyleSheet.absoluteFill]}>
            {isActive && active && !media && (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive && active}
                ref={camera}
                photo={true}
              />
            )}
          </View>
        </>
      )}

      {loading || media ? null : (
        <CaptureButton
          title="Take A Selfie"
          onPress={handleCapture}
          subTitle="Make sure that your face is clearly visible."
        />
      )}
    </ScreenWrapper>
  );
};

export default CaptureSelfi;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 20,
    width: "100%",
    zIndex: 3,
    position: "absolute",
  },
  backIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF29",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  blank: {
    flex: 1,
    backgroundColor: "#000",
  },
});
