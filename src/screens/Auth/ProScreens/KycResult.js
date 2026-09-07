import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";

import { useNavigation, useRoute } from "@react-navigation/native";
import axios from "axios";
import { useDispatch } from "react-redux";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import AuthFooter from "../../../components/Auth/AuthFooter";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

const API_KEY = "5n7F2gNzERB7qijPbj6rXLqNk7jN4sm8cAU6p5j-u3k";

const headers = {
  "x-api-key": API_KEY,
  Accept: "application/json",
  "Content-Type": "multipart/form-data",
};

const KYCResult = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();
  const { frontSide, backSide, selfi, subscription, fromProfile } =
    route.params || {};

  const [loader, setLoader] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState("loading");

  const handleDocs = async () => {
    try {
      const formData = new FormData();
      formData.append("front_image", {
        uri: frontSide,
        type: "image/jpeg",
        name: "id_front.jpg",
      });

      formData.append("back_image", {
        uri: backSide,
        type: "image/jpeg",
        name: "id_back.jpg",
      });

      const url = "https://verification.didit.me/v2/id-verification/";

      const response = await axios.post(url, formData, { headers });
      const result = response.data;

      return {
        status: result?.id_verification?.status || "Declined",
        ref_image: result?.id_verification?.portrait_image || "",
      };
    } catch (error) {
      console.log("eroee-----0-0-0-", error);

      setLoader(false);
      console.error("Docs verification error:", error?.response?.data);
      throw error;
    }
  };

  const handleImage = async (refImage) => {
    try {
      const formData = new FormData();
      formData.append("user_image", {
        uri: selfi,
        type: "image/jpeg",
        name: "user_image.jpg",
      });

      formData.append("ref_image", {
        uri: refImage,
        type: "image/jpeg",
        name: "ref_image.jpg",
      });
      console.log("formData-----", formData);

      const url = "https://verification.didit.me/v2/face-match/";

      const response = await axios.post(url, formData, { headers });
      return response.data;
    } catch (error) {
      setLoader(false);
      console.log("Face verification error:", error);
      throw error;
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await put("user/profile", {
        profile: {
          isVerified: true,
        },
      });

      if (res?.data?.success) {
        dispatch(setUserData(res?.data?.data));
        ToastMessage("KYC process has been completed!", "success");
        setVerificationStatus("success");
        setLoader(false);
      }
    } catch (error) {
      setLoader(false);
      setVerificationStatus("failed");
      console.log(error, "in update user KYC");
      ToastMessage("Failed to update profile", "error");
    }
  };

  const handleVerify = async () => {
    try {
      setLoader(true);
      setVerificationStatus("loading");

      const { status, ref_image } = await handleDocs();

      if (status === "Approved") {
        const result = await handleImage(ref_image);

        if (result?.face_match?.status === "Approved") {
          await handleUpdate();
        } else {
          ToastMessage("Face verification failed! Please try again.", "error");
          setLoader(false);
          setVerificationStatus("failed");
        }
      } else {
        ToastMessage(
          "Document validation failed! Please upload carefully",
          "error",
        );
        setLoader(false);
        setVerificationStatus("failed");
      }
    } catch (error) {
      setLoader(false);
      setVerificationStatus("failed");
      console.log(error, "err in KYC");
      ToastMessage("Validation failed. Please try again!", "error");
    }
  };

  const handleContinueOrReset = () => {
    if (verificationStatus === "success") {
      // Navigate to appropriate screen
      if (fromProfile) {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainStack" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "PersonalAds" }],
        });
      }
    } else if (verificationStatus === "failed") {
      // Go back to restart the KYC process
      // navigation.navigate("PersonalAds");
      handleVerify();
    }
  };

  useEffect(() => {
    handleVerify();
  }, []);

  // Render status items based on verification state
  const renderStatusItem = (label, isCompleted, isCurrent, isError) => {
    let iconName = "check-circle";
    let iconColor = isDark ? COLORS.primaryDark : colors.text;
    let iconFamily = "MaterialIcons";

    if (isError) {
      iconName = "cancel";
      iconColor = "#FF0000";
    } else if (isCurrent && !isCompleted) {
      iconName = "access-time";
      iconColor = isDark ? COLORS.gray64 : colors.textSecondary;
    } else if (isCompleted) {
      iconName = "check-circle";
      iconColor = COLORS.buttonColor;
    }

    return (
      <View style={[styles.box, { backgroundColor: isDark ? COLORS.inputBg : colors.surfaceAlt }]}>
        <Icons
          size={18}
          name={iconName}
          family={iconFamily}
          color={iconColor}
        />
        <CustomText label={label} fontFamily={fonts.medium} />
      </View>
    );
  };

  return (
    <ScreenWrapper
      barStyle={"dark-content"}
      footerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          <AuthFooter
            disabled={verificationStatus === "loading"}
            loading={loader}
            title={
              verificationStatus === "loading"
                ? "Complete Verification"
                : verificationStatus === "success"
                ? "Complete Verification"
                : "Restart Form"
            }
            onPress={handleContinueOrReset}
          />
        </View>
      )}
    >
      <Image source={Images.kyc} style={[styles.img]} />
      <CustomText
        fontSize={26}
        marginTop={25}
        alignSelf="center"
        label="Just a moment..."
        fontFamily={fonts.semiBold}
      />
      <CustomText
        fontSize={13}
        alignSelf="center"
        textAlign="center"
        color={isDark ? COLORS.gray64 : colors.textSecondary}
        label="We are analysing your pictures."
      />
      <View style={styles.boxes}>
        {renderStatusItem("Documents uploaded", true, false, false)}
        {renderStatusItem("Selfie uploaded", true, false, false)}
        {verificationStatus === "loading" &&
          renderStatusItem("Analyzing documents", false, true, false)}
        {verificationStatus === "success" &&
          renderStatusItem("All good!", true, false, false)}
        {verificationStatus === "failed" &&
          renderStatusItem("Ohh! There is a problem...", false, false, true)}
      </View>
    </ScreenWrapper>
  );
};

export default KYCResult;

const styles = StyleSheet.create({
  img: {
    height: 298,
    width: "100%",
    borderRadius: 16,
    marginTop: "25%",
  },
  boxes: {
    justifyContent: "center",
    marginTop: 30,
    alignItems: "center",
  },
  box: {
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
    marginBottom: 10,
    width: 220,
  },
});
