import { useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import CustomButton from "../../../components/CustomButton";
import CustomDatePicker from "../../../components/CustomDatePicker";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomInput from "../../../components/CustomInput";
import CustomPhoneInput from "../../../components/CustomPhoneInput";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import ScreenWrapper from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { put } from "../../../services/ApiRequest";
import { setUserData } from "../../../store/reducer/usersSlice";
import { COLORS } from "../../../utils/COLORS";
import { getProfile, uploadAndGetUrl } from "../../../utils/constants";
import { COUNTRIES } from "../../../utils/COUNTRIES";
import { ToastMessage } from "../../../utils/ToastMessage";
import { useTheme } from "../../../contexts/ThemeContext";

// Validation schema
const validationSchema = Yup.object().shape({
  accountType: Yup.string().required("Account type is required"),
  category: Yup.string().required("Category is required"),
  aboutMe: Yup.string().max(200, "Maximum 200 characters allowed"),
  country: Yup.string().required("Country is required"),
  city: Yup.string()
    .max(27, "Maximum 27 characters allowed")
    .required("City is required"),
  firstName: Yup.string()
    .max(27, "Maximum 27 characters allowed")
    .required("First name is required"),
  surname: Yup.string()
    .max(27, "Maximum 27 characters allowed")
    .required("Surname is required"),
  gender: Yup.string().required("Gender is required"),
  username: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(27, "Username must be maximum 27 characters")
    .matches(/^[A-Za-z]/, "Username must start with a letter")
    .matches(
      /^[A-Za-z0-9._]*$/,
      "Username can only contain letters, numbers, dots, and underscores",
    ),
  phoneNumber: Yup.string()
    .matches(/^\+?[0-9\s\-\(\)]+$/, "Enter a valid phone number")
    .required("Phone number is required"),
  emailAddress: Yup.string()
    .email("Enter a valid email address")
    .required("Email address is required"),
  companyName: Yup.string(),
  jobTitle: Yup.string(),
  schoolName: Yup.string().max(27, "Maximum 27 characters allowed"),
  primaryMajor: Yup.string(),
  secondaryMajor: Yup.string(),
  degree: Yup.string(),
  whoCanSeeProfile: Yup.string(),
  interactWithPosts: Yup.string(),
  mentionCollaborate: Yup.string(),
});

const AccountInfo = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useSelector((state) => state.users);
  const dispatch = useDispatch();
  const [imageModal, setImageModal] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const [friendImage, setFriendImage] = useState(null);
  const [activeImageType, setActiveImageType] = useState(null);
  const [uploadingUserImage, setUploadingUserImage] = useState(false);
  const [uploadingFriendImage, setUploadingFriendImage] = useState(false);

  useEffect(() => {
    if (userData?.profile?.avatar) {
      setUserImage(userData.profile.avatar);
    }
    if (userData?.profile?.friendImage) {
      setFriendImage(userData.profile.friendImage);
    }
  }, [userData]);

  // Initial values for Formik
  const initialValues = {
    accountType: userData?.accountType
      ? userData.accountType.charAt(0).toUpperCase() +
        userData.accountType.slice(1)
      : "Pro",
    category: userData?.profile?.category || "Brand/Supplier",
    offerMembership: "No",
    aboutMe: userData?.profile?.bio || "",
    country: userData?.profile?.country || "United States of America",
    city: userData?.profile?.city || "",
    firstName: userData?.firstName || "",
    surname: userData?.lastName || "",
    gender: userData?.gender
      ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)
      : "Male",
    username: userData?.username || "",
    birthDate: userData?.dob ? new Date(userData.dob) : new Date(),
    phoneNumber: userData?.phone || "",
    emailAddress: userData?.email || "",
    companyName: userData?.occupation?.company || "",
    jobTitle: userData?.occupation?.jobTitle || "",
    startingDate: userData?.occupation?.startDate
      ? new Date(userData.occupation.startDate)
      : new Date(),
    schoolName: userData?.education?.[0]?.school || "",
    primaryMajor: userData?.education?.[0]?.primaryMajor || "",
    secondaryMajor: userData?.education?.[0]?.secondaryMajor || "",
    degree: userData?.education?.[0]?.degree || "",
    graduationYear: userData?.education?.[0]?.graduationDate
      ? new Date(userData.education[0].graduationDate)
      : new Date(),
    whoCanSeeProfile: userData?.privacy?.seeProfile
      ? userData.privacy.seeProfile.charAt(0).toUpperCase() +
        userData.privacy.seeProfile.slice(1)
      : "Public",
    interactWithPosts: userData?.privacy?.seePosts
      ? userData.privacy.seePosts.charAt(0).toUpperCase() +
        userData.privacy.seePosts.slice(1)
      : "Public",
    mentionCollaborate: userData?.privacy?.mentionMe
      ? userData.privacy.mentionMe.charAt(0).toUpperCase() +
        userData.privacy.mentionMe.slice(1)
      : "Public",
    jokerProfile: userData?.socialMedia?.jocker || "",
    linkableProfile: userData?.socialMedia?.linkable || "",
    moveProfile: userData?.socialMedia?.move || "",
    bandMateProfile: userData?.socialMedia?.bandMate || "",
  };

  const accountTypes = [
    "User",
    "Gold",
    "Platinum",
    "Premium",
    "PremiumPlus",
    "Pro",
  ];
  const categories = [
    "Accociation Or Label",
    "Brand/Supplier",
    "Public Figure",
    "Infulancer",
    "News Outlet",
    "Sport Accociation",
  ];
  const genders = ["Male", "Female", "Other"];
  const countries = COUNTRIES.map((c) => c.name).sort();
  const degrees = ["Bachelor", "Master", "PhD", "Associate"];
  const privacyOptions = ["Public", "Private", "Gold", "Platinum"];

  const handleImageChange = async (file) => {
    const isFriendImage = activeImageType === "friendImage";
    const setLoading = isFriendImage
      ? setUploadingFriendImage
      : setUploadingUserImage;
    const setImage = isFriendImage ? setFriendImage : setUserImage;

    // Close modal immediately and show local preview with loader
    setImageModal(false);
    setImage(file.path);
    setLoading(true);

    try {
      const url = await uploadAndGetUrl(file);

      if (url) {
        setImage(url);
      }
    } catch (error) {
      console.log("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (result) => {
    if (result) {
      await handleImageChange(result);
    }
  };

  const handleRemoveImage = (type) => {
    if (type === "avatar") {
      setUserImage(null);
    } else if (type === "friendImage") {
      setFriendImage(null);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsLoading(true);

      const body = {
        firstName: values.firstName,
        lastName: values.surname,
        username: values.username,
        email: values.emailAddress,
        phone: values.phoneNumber,
        dob: moment(values.birthDate).format("YYYY-MM-DD"),
        gender: values.gender.toLowerCase(),
        // Backend enum is camelCase ("premiumPlus"): only lower the first letter
        accountType:
          values.accountType.charAt(0).toLowerCase() +
          values.accountType.slice(1),
        industry: userData?.industry || "Technology",
        occupation: {
          jobTitle: values.jobTitle,
          company: values.companyName,
          startDate: moment(values.startingDate).format("YYYY-MM-DD"),
        },
        education: [
          {
            school: values.schoolName,
            primaryMajor: values.primaryMajor,
            degree: values.degree,
            graduationDate: moment(values.graduationYear).format("YYYY-MM-DD"),
          },
        ],
        profile: {
          avatar: userImage,
          friendImage: friendImage,
          cover: userData?.profile?.cover || "",
          category: values.category,
          bio: values.aboutMe,
          city: values.city,
          country: values.country,
          profileColor: userData?.profile?.profileColor || "#FDFD97",
          firstDayofWeek: userData?.profile?.firstDayofWeek || "monday",
          dateFormat: userData?.profile?.dateFormat || "dd/mm/yyyy",
          timeFormat: userData?.profile?.timeFormat || "24h",
          language: userData?.profile?.language || "en",
          timezone: userData?.profile?.timezone || "UTC",
          prefferedCountry: userData?.profile?.prefferedCountry || "",
          addressing: userData?.profile?.addressing || "",
        },
        privacy: {
          seeProfile: values.whoCanSeeProfile.toLowerCase(),
          seePosts: values.interactWithPosts.toLowerCase(),
          mentionMe: values.mentionCollaborate.toLowerCase(),
        },
        socialMedia: {
          jocker: values.jokerProfile,
          move: values.moveProfile,
          bandMate: values.bandMateProfile,
          linkable: values.linkableProfile,
          viral: userData?.socialMedia?.viral || "",
        },

        enhancedTailoredAds: userData?.enhancedTailoredAds || false,
        profilePrivacy: userData?.profilePrivacy || "public",
      };

      const res = await put("user/profile", body);
      if (res?.data?.success) {
        ToastMessage("Profile updated successfully");
        dispatch(getProfile());
        dispatch(setUserData(res.data.data));
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      ToastMessage("Please check all the missing field");
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  const renderHeader = () => (
    <>
      <CustomText
        label="Profile Info"
        fontSize={24}
        fontFamily={fonts.bold}
        marginTop={8}
      />
      <CustomText
        label="Edit your profile in here."
        fontSize={14}
        color={colors.textSecondary}
        marginBottom={4}
      />
      <View style={styles.row}>
        <CustomText
          label="Account created on"
          fontSize={12}
          color={colors.textSecondary}
          marginBottom={20}
        />
        <CustomText label=" July 13, 2025" fontSize={12} marginBottom={20} />
      </View>

      <View style={styles.profilePicturesContainer}>
        <View style={styles.profilePictureSection}>
          <TouchableOpacity
            disabled={uploadingUserImage}
            onPress={() => {
              setActiveImageType("avatar");
              setImageModal(true);
            }}
          >
            <View>
              <ImageFast
                source={userImage ? { uri: userImage } : Images.profile}
                style={[
                  styles.profilePicture,
                  uploadingUserImage && { opacity: 0.5 },
                ]}
              />
              {uploadingUserImage && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <CustomText
            label="PUBLIC PICTURE"
            fontSize={16}
            fontFamily={fonts.medium}
            textAlign="center"
            marginBottom={8}
            marginTop={12}
            color={colors.textSecondary}
          />
          {userImage && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveImage("avatar")}
            >
              <CustomText
                label="Remove"
                fontSize={12}
                color={colors.textSecondary}
              />
              <Image source={Images.bin} style={{ height: 12, width: 12 }} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.profilePictureSection}>
          <TouchableOpacity
            disabled={uploadingFriendImage}
            onPress={() => {
              setActiveImageType("friendImage");
              setImageModal(true);
            }}
          >
            <View>
              <ImageFast
                source={friendImage ? { uri: friendImage } : Images.profile}
                style={[
                  styles.profilePicture,
                  uploadingFriendImage && { opacity: 0.5 },
                ]}
              />
              {uploadingFriendImage && (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator color={COLORS.white} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <CustomText
            label="FRIENDS PICTURE"
            fontSize={16}
            fontFamily={fonts.medium}
            textAlign="center"
            marginBottom={8}
            marginTop={12}
            color={colors.textSecondary}
          />
        </View>
      </View>
    </>
  );

  const AccountInfoForm = ({
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
  }) => {
    const formData = [
      {
        id: "accountType",
        type: "dropdown",
        label: "ACCOUNT TYPE",
        value: values.accountType,
        setValue: (val) => setFieldValue("accountType", val),
        data: accountTypes,
      },
      {
        id: "category",
        type: "dropdown",
        label: "CATEGORY",
        value: values.category,
        setValue: (val) => setFieldValue("category", val),
        data: categories,
      },
      {
        id: "membership",
        type: "membershipRow",
        label: "OFFER A MEMBERSHIP",
        value: values.offerMembership,
      },
      {
        id: "aboutMeHeader",
        type: "sectionHeader",
        title: "About Me",
      },
      {
        id: "aboutMeInfo",
        type: "info",
        text: "Introduce yourself. Who are you, where do you live and what do you love? Profiles with great descriptions get more attention. Don't worry about language; our app will translate it for you.",
      },
      {
        id: "aboutMe",
        type: "aboutMe",
        label: "TELL US MORE ABOUT YOU",
        value: values.aboutMe,
        setValue: handleChange("aboutMe"),
        placeholder: "Tell us about yourself...",
        cardInfo: `${values.aboutMe.length}/200 characters.`,
        error: touched.aboutMe && errors.aboutMe ? errors.aboutMe : undefined,
      },
      {
        id: "mainInfoHeader",
        type: "sectionHeader",
        title: "Main Information",
      },
      {
        id: "country",
        type: "dropdown",
        label: "COUNTRY OF RESIDENCE",
        value: values.country,
        setValue: (val) => setFieldValue("country", val),
        data: countries,
        cardInfo: "186 days Spent in this country",
        error: touched.country && errors.country ? errors.country : undefined,
      },
      {
        id: "city",
        type: "input",
        label: "CITY",
        value: values.city,
        setValue: handleChange("city"),
        hasArrow: true,
        cardInfo: `${values.city.length}/27 characters`,
        error: touched.city && errors.city ? errors.city : undefined,
      },
      {
        id: "firstName",
        type: "input",
        label: "FULL FIRSTNAME",
        value: values.firstName,
        setValue: handleChange("firstName"),
        cardInfo: `${values.firstName.length}/27 characters`,
        error:
          touched.firstName && errors.firstName ? errors.firstName : undefined,
      },
      {
        id: "surname",
        type: "input",
        label: "FULL SURNAME",
        value: values.surname,
        setValue: handleChange("surname"),
        cardInfo: `${values.surname.length}/27 characters`,
        error: touched.surname && errors.surname ? errors.surname : undefined,
      },
      {
        id: "gender",
        type: "dropdown",
        label: "GENDER",
        value: values.gender,
        setValue: (val) => setFieldValue("gender", val),
        data: genders,
        error: touched.gender && errors.gender ? errors.gender : undefined,
      },
      {
        id: "username",
        type: "input",
        label: "USERNAME",
        value: values.username,
        setValue: handleChange("username"),
        cardInfo: "Should be Unique",
        error:
          touched.username && errors.username ? errors.username : undefined,
        disabled: true,
      },
      {
        id: "birthDate",
        type: "datePicker",
        label: "BIRTH DATE",
        value: values.birthDate,
        setValue: (val) => setFieldValue("birthDate", val),
        verified: true,
        verifiedText: "Valid legal age.",
      },
      {
        id: "contactInfoHeader",
        type: "sectionHeader",
        title: "Contact information",
      },
      {
        id: "phoneNumber",
        type: "phoneInput",
        label: "PHONE NUMBER",
        value: values.phoneNumber,
        verified: true,
        verifiedText: "Verified phone number.",
        setValue: (val) => setFieldValue("phoneNumber", val),
        error:
          touched.phoneNumber && errors.phoneNumber
            ? errors.phoneNumber
            : undefined,
      },
      {
        id: "emailAddress",
        type: "verified",
        label: "EMAIL ADDRESS",
        value: values.emailAddress,
        setValue: handleChange("emailAddress"),
        verified: true,
        verifiedText: "Verified email address.",
        error:
          touched.emailAddress && errors.emailAddress
            ? errors.emailAddress
            : undefined,
        disabled: true,
      },
      {
        id: "occupationHeader",
        type: "sectionHeader",
        title: "Occupation",
      },
      {
        id: "companyName",
        type: "input",
        label: "COMPANY NAME",
        value: values.companyName,
        setValue: handleChange("companyName"),
        placeholder: "Enter company name",
        marginBottom: 12,
        error:
          touched.companyName && errors.companyName
            ? errors.companyName
            : undefined,
      },
      {
        id: "jobTitle",
        type: "input",
        label: "JOB TITLE",
        value: values.jobTitle,
        setValue: handleChange("jobTitle"),
        placeholder: "Enter job title",
        marginBottom: 12,
        error:
          touched.jobTitle && errors.jobTitle ? errors.jobTitle : undefined,
      },
      {
        id: "startingDate",
        type: "datePicker",
        label: "STARTING DATE",
        value: values.startingDate,
        setValue: (val) => setFieldValue("startingDate", val),
      },
      {
        id: "educationHeader",
        type: "sectionHeader",
        title: "Education",
      },
      {
        id: "schoolName",
        type: "input",
        label: "SCHOOL NAME",
        value: values.schoolName,
        setValue: handleChange("schoolName"),
        placeholder: "Enter school name",
        marginBottom: 12,
        cardInfo: `${(values.schoolName || "").length}/27 characters`,
        error:
          touched.schoolName && errors.schoolName
            ? errors.schoolName
            : undefined,
      },
      {
        id: "primaryMajor",
        type: "input",
        label: "PRIMARY MAJOR",
        value: values.primaryMajor,
        setValue: handleChange("primaryMajor"),
        placeholder: "Enter primary major",
        marginBottom: 12,
        error:
          touched.primaryMajor && errors.primaryMajor
            ? errors.primaryMajor
            : undefined,
      },
      {
        id: "secondaryMajor",
        type: "input",
        label: "SECONDARY MAJOR",
        value: values.secondaryMajor,
        setValue: handleChange("secondaryMajor"),
        placeholder: "Enter secondary major",
        marginBottom: 12,
        error:
          touched.secondaryMajor && errors.secondaryMajor
            ? errors.secondaryMajor
            : undefined,
      },
      {
        id: "degree",
        type: "dropdown",
        label: "DEGREE",
        value: values.degree,
        setValue: (val) => setFieldValue("degree", val),
        placeholder: "Select degree",
        data: degrees,
        error: touched.degree && errors.degree ? errors.degree : undefined,
      },
      {
        id: "graduationYear",
        type: "datePicker",
        label: "GRADUATION YEAR",
        value: values.graduationYear,
        setValue: (val) => setFieldValue("graduationYear", val),
      },
      {
        id: "privacyHeader",
        type: "sectionHeader",
        title: "Privacy",
      },
      {
        id: "privacyDescription",
        type: "sectionDescription",
        text: "You can fine tune these settings to create a better experience for you on Linkable.",
      },
      {
        id: "whoCanSeeProfile",
        type: "privacyDropdown",
        label: "WHO CAN SEE MY PROFILE",
        value: values.whoCanSeeProfile,
        setValue: (val) => setFieldValue("whoCanSeeProfile", val),
        data: privacyOptions,
        infoText: "Manage who can view your profile.",
        error:
          touched.whoCanSeeProfile && errors.whoCanSeeProfile
            ? errors.whoCanSeeProfile
            : undefined,
      },
      {
        id: "interactWithPosts",
        type: "privacyDropdown",
        label: "INTERACT WITH MY POSTS",
        value: values.interactWithPosts,
        setValue: (val) => setFieldValue("interactWithPosts", val),
        data: privacyOptions,
        infoText: "Manage visibility over likes,comments, reposts & shares.",
        error:
          touched.interactWithPosts && errors.interactWithPosts
            ? errors.interactWithPosts
            : undefined,
      },
      {
        id: "mentionCollaborate",
        type: "privacyDropdown",
        label: "MENTION/COLLABORATE",
        value: values.mentionCollaborate,
        setValue: (val) => setFieldValue("mentionCollaborate", val),
        data: privacyOptions,
        infoText: "Username has invited you to collaborat in a post!",
        error:
          touched.mentionCollaborate && errors.mentionCollaborate
            ? errors.mentionCollaborate
            : undefined,
      },
      {
        id: "socialsHeader",
        type: "sectionHeader",
        title: "Socials",
      },
      {
        id: "jokerProfile",
        type: "socialProfile",
        label: "Joker Profile",
        value: values.jokerProfile,
        setValue: (val) => setFieldValue("jokerProfile", val),
      },
      {
        id: "linkableProfile",
        type: "socialProfile",
        label: "Linkable Profile",
        value: values.linkableProfile,
        setValue: (val) => setFieldValue("linkableProfile", val),
      },
      {
        id: "moveProfile",
        type: "socialProfile",
        label: "move Profile",
        value: values.moveProfile,
        setValue: (val) => setFieldValue("moveProfile", val),
      },
      {
        id: "bandMateProfile",
        type: "socialProfile",
        label: "BandMate Profile",
        value: values.bandMateProfile,
        setValue: (val) => setFieldValue("bandMateProfile", val),
      },
    ];

    const renderItem = ({ item }) => {
      switch (item.type) {
        case "dropdown":
          return (
            <CustomDropdown
              withLabel={item.label}
              value={item.value}
              setValue={item.setValue}
              data={item.data}
              placeholder={item.placeholder}
              cardInfo={item.cardInfo}
              marginBottom={12}
              error={item.error}
            />
          );

        case "membershipRow":
          return (
            <>
              <TouchableOpacity style={styles.membershipRow}>
                <View>
                  <CustomText
                    label={item.label}
                    fontSize={12}
                    fontFamily={fonts.medium}
                    color={colors.textSecondary}
                    textTransform="uppercase"
                    marginBottom={4}
                  />
                  <CustomText
                    label={item.value}
                    fontSize={16}
                    fontFamily={fonts.regular}
                  />
                </View>
                <Icons
                  family="Feather"
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <ErrorComponent
                marginTop={1}
                errorTitle={
                  "Offer original & exclusive content to your beloved fans in exchange of financial support."
                }
              />
            </>
          );

        case "info":
          return (
            <CustomText
              label={item.text}
              fontSize={14}
              color={colors.textSecondary}
              marginBottom={16}
            />
          );

        case "aboutMe":
          return (
            <CustomInput
              withLabel={item.label}
              value={item.value}
              onChangeText={item.setValue}
              onBlur={handleBlur("aboutMe")}
              multiline
              height={120}
              placeholder={item.placeholder}
              cardInfo={item.cardInfo}
              marginBottom={8}
              error={item.error}
            />
          );

        case "sectionHeader":
          return (
            <>
              <Divider marginVertical={14} color={COLORS.white04} />
              <CustomText
                label={item.title}
                fontSize={16}
                fontFamily={fonts.medium}
                marginBottom={8}
              />
            </>
          );

        case "input":
          return (
            <CustomInput
              withLabel={item.label}
              value={item.value}
              onChangeText={item.setValue}
              onBlur={handleBlur(item.id)}
              placeholder={item.placeholder}
              cardInfo={item.cardInfo}
              Isicon={item.hasArrow}
              marginBottom={
                item.marginBottom !== undefined ? item.marginBottom : 6
              }
              errorMarginBottom={8}
              error={item.error}
              editable={!item.disabled}
            />
          );

        case "datePicker":
          return (
            <View style={styles.verifiedInputContainer}>
              <CustomDatePicker
                withLabel={item.label}
                value={item.value}
                setValue={item.setValue}
                isIcon={item.isIcon}
              />
              {item.verified && (
                <View style={[styles.verifiedBadge, { marginTop: 2 }]}>
                  <Image
                    source={Images.checkGreen}
                    style={{ height: 12, width: 12 }}
                  />
                  <CustomText
                    label={item.verifiedText}
                    fontSize={12}
                    color={colors.textSecondary}
                    marginLeft={4}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          );

        case "verified":
          return (
            <View style={styles.verifiedInputContainer}>
              <CustomInput
                withLabel={item.label}
                value={item.value}
                onChangeText={item.setValue}
                onBlur={handleBlur(item.id)}
                placeholder={item.placeholder}
                Isicon
                error={item.error}
                editable={!item.disabled}
                marginBottom={2}
              />
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Image
                    source={Images.checkGreen}
                    style={{ height: 12, width: 12 }}
                  />
                  <CustomText
                    label={item.verifiedText}
                    fontSize={12}
                    color={colors.textSecondary}
                    marginLeft={4}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          );

        case "phoneInput":
          return (
            <View style={styles.verifiedInputContainer}>
              <CustomPhoneInput
                withLabel={item.label}
                value={item.value}
                setValue={item.setValue}
                error={item.error}
                marginBottom={4}
              />
              {item.verified && (
                <View style={[styles.verifiedBadge, { marginBottom: 8 }]}>
                  <Image
                    source={Images.checkGreen}
                    style={{ height: 12, width: 12 }}
                  />
                  <CustomText
                    label={item.verifiedText}
                    fontSize={12}
                    color={colors.textSecondary}
                    marginLeft={4}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          );

        case "privacyDropdown":
          return (
            <CustomDropdown
              withLabel={item.label}
              value={item.value}
              setValue={item.setValue}
              data={item.data}
              marginBottom={8}
              cardInfo={item.infoText}
              error={item.error}
            />
          );

        case "socialProfile":
          return (
            <CustomInput
              withLabel={item.label}
              value={item.value}
              onChangeText={item.setValue}
              onBlur={handleBlur(item.id)}
            />
          );

        case "sectionDescription":
          return (
            <CustomText
              label={item.text}
              fontSize={14}
              color={colors.textSecondary}
              marginBottom={8}
            />
          );

        default:
          return null;
      }
    };

    return (
      <FlatList
        data={formData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      validateOnChange={true}
      validateOnBlur={true}
    >
      {(formikProps) => (
        <ScreenWrapper
          headerUnScrollable={() => <Header title="PSC" />}
          footerUnScrollable={() => (
            <View style={{ paddingHorizontal: 12 }}>
              <CustomButton
                backgroundColor={colors.text}
                color={colors.background}
                title={
                  uploadingUserImage || uploadingFriendImage
                    ? "Uploading Picture"
                    : "Save Changes"
                }
                onPress={() => {
                  if (!formikProps.isValid) {
                    ToastMessage("Please check all the missing field");
                  }
                  formikProps.handleSubmit();
                }}
                marginBottom={8}
                loading={
                  isLoading || uploadingUserImage || uploadingFriendImage
                }
                disabled={uploadingUserImage || uploadingFriendImage}
                indicatorColor={colors.background}
                isBottom
              />
            </View>
          )}
        >
          <AccountInfoForm {...formikProps} />
          <UploadImageCustom
            imageModal={imageModal}
            setImageModal={setImageModal}
            handleChange={handleImageChange}
            handleCapture={handleCapture}
            imgLoading={uploadingUserImage || uploadingFriendImage}
          />
        </ScreenWrapper>
      )}
    </Formik>
  );
};

export default AccountInfo;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  profilePicturesContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 40,
  },
  profilePictureSection: {
    alignItems: "center",
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  addButton: {
    position: "absolute",
    right: -10,
    top: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.buttonColor,
    justifyContent: "center",
    alignItems: "center",
  },
  pictureLabelsContainer: {
    flex: 1,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white04,
    padding: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
  },
  membershipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 6,
    height: 56,
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
    minHeight: 56,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  verifiedInputContainer: {
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  privacyInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  socialProfileContainer: {
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 40,
  },
});
