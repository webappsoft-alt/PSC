import { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { useIsForeground } from "../../../utils/UseIsForground";
import CameraErrorMessage from "../../../components/CamerErrorMessage";
import ScreenWrapper from "../../../components/ScreenWrapper";
import Header from "../../../components/Header";
import CustomButton from "../../../components/CustomButton";
import { COLORS } from "../../../utils/COLORS";
import CustomText from "../../../components/CustomText";
import { Images } from "../../../assets/images";
import ImageCamera from "./ImageCamera";
import { ToastMessage } from "../../../utils/ToastMessage";
import Icons from "../../../components/Icons";
import fonts from "../../../assets/fonts";
import ImageFast from "../../../components/ImageFast";
import Blur from "../../../components/Blur";
import { useTheme } from "../../../contexts/ThemeContext";

const { width } = Dimensions.get("window");

const TakeIDBack = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};

  const isFocused = useIsFocused();

  const [media, setMedia] = useState("");
  const [active, setActive] = useState(true);
  const [isCamera, setIsCamera] = useState(false);
  const { hasPermission, requestPermission: reqPerm } = useCameraPermission();
  const [isPermissionChecked, setIsPermissionChecked] = useState(hasPermission);
  const device = useCameraDevice("back");

  const isForeground = useIsForeground();
  const isActive = isFocused && isForeground;

  const onPermissions = async () => {
    try {
      if (!hasPermission) {
        await reqPerm();
        setIsPermissionChecked(true);
      } else {
        setIsPermissionChecked(true);
      }
    } catch (error) {
      console.log("Permission check error:", error);
      setIsPermissionChecked(true);
    }
  };

  const handleRemoveImage = () => {
    setActive(true);
    setMedia("");
  };

  const handleContinue = async () => {
    if (media) {
      navigation.navigate("TakeSelfi", {
        backSide: media,
        frontSide: params.frontSide,
        subscription: params.subscription,
        fromProfile: params.fromProfile,
      });
    } else {
      ToastMessage("Please click on camera to take picture ", "error");
    }
  };

  const handleCancel = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "PersonalAds" }],
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

  if (!isPermissionChecked) {
    return <View style={styles.blank} />;
  }

  if (!hasPermission) {
    return <CameraErrorMessage />;
  }

  if (!device) {
    return <View style={styles.blank} />;
  }

  return isCamera ? (
    <ImageCamera
      onCapture={(uri) => {
        setMedia(uri);
        setIsCamera(false);
      }}
      onClose={() => setIsCamera(false)}
    />
  ) : (
    <ScreenWrapper
      scrollEnabled
      barStyle={"dark-content"}
      headerUnScrollable={() => <Header title={"Take ID Back"} />}
      footerUnScrollable={() => (
        <View style={styles.actionButtonsContainer}>
          <CustomButton
            onPress={handleContinue}
            title={media ? "Continue" : "Capture"}
            isBoarder
            secondBorderColor={COLORS.buttonColor}
            marginBottom={8}
          />
          <CustomButton
            title="Pass"
            onPress={handleCancel}
            color={isDark ? COLORS.white : colors.text}
            backgroundColor={isDark ? COLORS.white04 : colors.surfaceAlt}
          />
        </View>
      )}
    >
      <CustomText
        fontSize={24}
        marginTop={12}
        marginBottom={5}
        fontFamily={fonts.semiBold}
        label="Choose a document to validate your identity"
      />
      <CustomText
        fontSize={16}
        marginBottom={30}
        textTransform={"none"}
        color={isDark ? COLORS.gray64 : colors.textSecondary}
        label="Please upload your document directly to the app. Scans and copies will not be accepted."
      />

      <View style={[styles.box, { backgroundColor: isDark ? COLORS.blackOpacity04 : colors.surfaceAlt }]}>
        <ImageFast source={Images.warning} style={{ height: 40, width: 40 }} />

        <View style={{ marginLeft: 10, width: "85%" }}>
          <CustomText
            fontSize={16}
            label={"No blurry photos"}
            fontFamily={fonts.medium}
          />
          <CustomText
            fontSize={12}
            textTransform={"none"}
            color={isDark ? COLORS.gray64 : colors.textSecondary}
            label={"Make sure your camera is clean and avoid sudden movements."}
          />
        </View>
      </View>

      {media ? (
        <View>
          <TouchableOpacity onPress={handleRemoveImage} style={styles.icon}>
            <Blur />

            <Icons
              size={15}
              name={"close"}
              family={"AntDesign"}
              color={COLORS.white}
            />
          </TouchableOpacity>
          <Image source={{ uri: media }} style={styles.img} />
        </View>
      ) : (
        <Pressable
          style={[
            styles.outer,
            { borderColor: isDark ? COLORS.blackOpacity04 : colors.border },
          ]}
          onPress={() => setIsCamera(true)}
        >
          <View style={[styles.cameraBox]}>
            {isActive && active && !media && (
              <Camera
                device={device}
                isActive={isActive}
                style={StyleSheet.absoluteFill}
                photo={true}
              />
            )}
          </View>
        </Pressable>
      )}

      <CustomText
        fontSize={18}
        marginTop={10}
        marginBottom={20}
        alignSelf={"center"}
        textAlign={"center"}
        textTransform={"none"}
        fontFamily={fonts.medium}
        label={"Position the back of your document facing the camera"}
      />
    </ScreenWrapper>
  );
};

export default TakeIDBack;

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  cameraBox: {
    height: 230,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  actionButtonsContainer: {
    marginTop: "auto",
    paddingBottom: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  blank: {
    flex: 1,
    backgroundColor: "#000",
  },
  img: {
    height: 230,
    width: width - 30,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 20,
  },
  icon: {
    height: 32,
    width: 32,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 10,
    zIndex: 1,
    top: 10,
    overflow: "hidden",
  },
  imageContainer: {
    marginTop: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    borderRadius: 20,
  },
  image: {
    height: 215,
    width: "100%",
    backgroundColor: COLORS.textSecondary,
    borderRadius: 16,
  },
  outer: {
    borderWidth: 3,
    borderColor: COLORS.blackOpacity04,
    borderRadius: 16,
    padding: 2,
    overflow: "hidden",
    marginBottom: 20,
  },
});
