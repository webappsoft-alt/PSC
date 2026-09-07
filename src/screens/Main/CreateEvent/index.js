import { useIsFocused, useNavigation } from "@react-navigation/native";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import { ScrollView, View } from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import AuthSlider from "../../../components/Auth/AuthSlider";
import FilterModal from "../../../components/CarFilterModal";
import CountryBottomSheet from "../../../components/CountryBottomSheet";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import CustomModalGooglePlaces from "../../../components/CustomModalGooglePlaces";
import CustomText from "../../../components/CustomText";
import Divider from "../../../components/Divider";
import ErrorComponent from "../../../components/ErrorComponent";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";
import { COUNTRIES as COUNTRIES_DATA } from "../../../utils/COUNTRIES";
import PeopleSelection from "../PublishPost/molecules/PeopleSelection";
import Heading from "./molecules/Heading";
import OptionSelector from "./molecules/OptionSelector";
import SelectLocation from "./molecules/SelectLocation";
import SwitchOption from "./molecules/SwitchOption";
import TimingDetails from "./molecules/TimingDetails";

const topics = [
  { name: "Technology", image: Images.Topis1 },
  { name: "Politics", image: Images.Topis2 },
  { name: "Sports", image: Images.Topis3 },
  { name: "Music", image: Images.Topis4 },
  { name: "Entertainment", image: Images.Topis5 },
  { name: "Fashion", image: Images.Topis6 },
  { name: "Food", image: Images.Topis7 },
  { name: "Gaming", image: Images.Topis8 },
  { name: "Health", image: Images.Topis9 },
];

const ageRatingFilters = [
  { name: "Kids", subtitle: "Under 10 years old" },
  { name: "+10", subtitle: "10 years old or older" },
  { name: "+12", subtitle: "12 years old or older" },
  { name: "+14", subtitle: "14 years old or older" },
  { name: "+16", subtitle: "16 years old or older" },
  { name: "+18", subtitle: "18 years old or older" },
  { name: "+21", subtitle: "21 years old or older" },
  { name: "+25", subtitle: "25 years old or older" },
];

const visibleToFilters = [
  { name: "Public" },
  { name: "Followers" },
  { name: "BFFs" },
  { name: "Private" },
];

const CreateEvent = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);

  const [form, setForm] = useState({
    venueName: "",
    address: {
      location: {
        type: "Point",
        coordinates: [],
      },
      address: "",
      state: "",
      country: "",
      city: "",
    },
    eventName: "",
    ageRating: 10,
    aboutThisEvent: "",
    whatGuestCanExpect: "",
    disableFriendly: false,
    visibleTo: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    sponsors: [],
    category: [],
  });

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [modalType, setModalType] = useState("age");
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Sponsor selection state
  const [selectionVisible, setSelectionVisible] = useState(false);
  const [selectionType, setSelectionType] = useState("sponsors");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (key, value) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  };

  const formatAgeRating = (value) => {
    if (!value) return "";

    if (value?.toString().toLowerCase() === "kids") return "0";

    return value?.toString().replace("+", "");
  };

  const formatVisibility = (value) => {
    if (!value) return "private";

    return value.toLowerCase() === "public" ? "public" : "private";
  };
  const isFormValid = () => {
    const {
      venueName,
      address,
      eventName,
      ageRating,
      aboutThisEvent,
      whatGuestCanExpect,
      visibleTo,
      startDate,
      startTime,
      endDate,
      endTime,
    } = form;

    return (
      venueName?.trim() &&
      address?.address?.trim() &&
      address?.state?.trim() &&
      address?.city?.trim() &&
      address?.country?.trim() &&
      eventName?.trim() &&
      ageRating?.toString()?.trim() &&
      aboutThisEvent?.trim() &&
      whatGuestCanExpect?.trim() &&
      visibleTo?.trim() &&
      startDate &&
      startTime &&
      endDate &&
      endTime
    );
  };
  const handleContinue = () => {
    const formattedForm = {
      ...form,
      ageRating: formatAgeRating(form.ageRating),
      visibleTo: formatVisibility(form.visibleTo),
      category: form.category,
    };

    console.log("----formattedForm", formattedForm);

    navigation.navigate("Branding", {
      eventData: formattedForm,
    });
  };

  const header = useMemo(
    () => (
      <>
        <Header title="New event" marginBottom={-5} />
        <View style={{ marginHorizontal: 12 }}>
          <AuthSlider
            min={1}
            max={3}
            gap={4}
            marginTop={8}
            marginBottom={7}
            selectedColor={COLORS.buttonColor}
          />
        </View>
      </>
    ),
    [],
  );

  const footer = useMemo(
    () => (
      <View style={{ padding: 12, marginBottom: 24 }}>
        <CustomButton
          title="Continue"
          marginBottom={8}
          disabled={!isFormValid()}
          onPress={handleContinue}
        />
      </View>
    ),
    [form],
  );

  return (
    <ScreenWrapper
      headerUnScrollable={() => header}
      footerUnScrollable={() => footer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <CustomText
          label={"Event Details"}
          fontSize={24}
          fontFamily={fonts.semiBold}
          marginTop={8}
        />
        <CustomText
          label={
            "Please inform your Event’s details as accurately as possible here below:"
          }
          fontSize={14}
          color={colors.iconMuted}
        />
        <Heading lable={"Where"} showIcon={true} />
        <CustomInput
          withLabel={"VENUE NAME"}
          value={form.venueName}
          onChangeText={(t) => updateField("venueName", t)}
          placeholder={"Toscana Wine Tasting"}
        />

        <SelectLocation
          type="loc"
          value={form.address.address}
          onPress={() => setGoogleModalVisible(true)}
          placeholder={"Central Park, New York City"}
        />
        <SelectLocation
          type="country"
          value={selectedCountry?.label}
          onPress={() => setBottomSheetVisible(true)}
          placeholder={"United States of America"}
        />
        <CustomInput
          withLabel={"STATE"}
          value={form.address.state}
          onChangeText={(t) => updateAddress("state", t)}
          placeholder={"New York"}
        />
        <CustomInput
          withLabel={"CITY"}
          value={form.address.city}
          onChangeText={(t) => updateAddress("city", t)}
          placeholder={"New York"}
        />
        <Divider thickness={1} color={colors.surfaceAlt} marginBottom={0} />
        <Heading lable={"General Details"} />
        <CustomInput
          withLabel={"EVENT NAME"}
          value={form.eventName}
          onChangeText={(t) => updateField("eventName", t)}
          placeholder={"Summer Music Festival 2026"}
        />
        <OptionSelector
          label={"AGE RATING"}
          value={form.ageRating}
          onPress={() => {
            setModalType("age");
            setCategoryModalVisible(true);
          }}
          placeHolder={"Kids Friendly"}
        />
        <OptionSelector
          label={"CATEGORY"}
          value={form.category.join(", ")}
          onPress={() => {
            setModalType("category");
            setCategoryModalVisible(true);
          }}
          placeHolder={"Select Category"}
        />
        <CustomInput
          withLabel={"About this event"}
          value={form.aboutThisEvent}
          onChangeText={(t) => updateField("aboutThisEvent", t)}
          placeholder={"Experience the magic of live music..."}
          multiline
          height={197}
          maxLength={50}
        />
        <ErrorComponent
          errorTitle={`${form?.aboutThisEvent?.length}/50 characters.`}
          marginBottom={8}
          color={colors.iconMuted}
        />
        <CustomInput
          withLabel={"What guests can expect"}
          value={form.whatGuestCanExpect}
          onChangeText={(t) => updateField("whatGuestCanExpect", t)}
          placeholder={`• 8+ hours of non-stop music daily `}
          multiline
          height={160}
          maxLength={200}
        />
        <ErrorComponent
          errorTitle={`${form.whatGuestCanExpect.length}/200 characters.`}
          color={colors.iconMuted}
        />
        <Divider thickness={1} color={colors.surfaceAlt} />
        <SwitchOption
          value={form.disableFriendly}
          setValue={(v) => updateField("disableFriendly", v)}
        />
        <OptionSelector
          label={"VISIBLE TO"}
          value={form.visibleTo}
          onPress={() => {
            setModalType("visibleTo");
            setCategoryModalVisible(true);
          }}
          placeHolder={"Everyone"}
        />
        <Divider thickness={1} marginBottom={0} color={colors.surfaceAlt} />
        <Heading lable={"When"} />
        <TimingDetails
          startDate={
            form.startDate
              ? moment(form.startDate, "YYYY-MM-DD").toDate()
              : null
          }
          setStartDate={(v) =>
            updateField("startDate", moment(v).format("YYYY-MM-DD"))
          }
          startTime={
            form.startTime ? moment(form.startTime, "HH:mm").toDate() : null
          }
          setStartTime={(v) =>
            updateField("startTime", moment(v).format("HH:mm"))
          }
          endDate={
            form.endDate ? moment(form.endDate, "YYYY-MM-DD").toDate() : null
          }
          setEndDate={(v) =>
            updateField("endDate", moment(v).format("YYYY-MM-DD"))
          }
          endTime={form.endTime ? moment(form.endTime, "HH:mm").toDate() : null}
          setEndTime={(v) => updateField("endTime", moment(v).format("HH:mm"))}
        />

        <Divider thickness={1} marginBottom={0} color={colors.surfaceAlt} />

        <Heading lable={"Featuring"} />

        <OptionSelector
          label={"SPONSOR"}
          placeHolder={"Add sponsor(s)"}
          value={form.sponsors.map((s) => s.firstName).join(", ")}
          onPress={() => {
            setSelectionType("sponsors");
            setSelectionVisible(true);
          }}
        />
        <FilterModal
          isVisible={categoryModalVisible}
          onDisable={() => setCategoryModalVisible(false)}
          title={
            modalType === "age"
              ? "Age Rating"
              : modalType === "visibleTo"
              ? "Visible To"
              : "Select Category"
          }
          multiSelect={true}
          singleSelect={modalType !== "category"}
          filters={
            modalType === "age"
              ? ageRatingFilters
              : modalType === "visibleTo"
              ? visibleToFilters
              : topics
          }
          selectedItems={
            modalType === "category"
              ? form.category
              : modalType === "age"
              ? form.ageRating
                ? [form.ageRating]
                : []
              : form.visibleTo
              ? [form.visibleTo]
              : []
          }
          onConfirm={(selectedItems) => {
            if (modalType === "category") {
              updateField("category", selectedItems);
            } else {
              const selectedValue = selectedItems[0] || "";
              if (modalType === "age") {
                updateField("ageRating", selectedValue);
              } else {
                updateField("visibleTo", selectedValue);
              }
            }
          }}
        />
        <CountryBottomSheet
          isVisible={bottomSheetVisible}
          onClose={() => setBottomSheetVisible(false)}
          selectedCountry={selectedCountry}
          onCountrySelect={(country) => {
            console.log(country);
            setSelectedCountry(country);
            updateAddress("country", country.label);
            setBottomSheetVisible(false);
          }}
          hideCode={false}
        />
        <CustomModalGooglePlaces
          isVisible={googleModalVisible}
          onClose={() => setGoogleModalVisible(false)}
          onLocationSelect={(locationData) => {
            updateAddress("address", locationData?.address);
            updateAddress("latitude", locationData?.latitude);
            updateAddress("longitude", locationData?.longitude);
            updateAddress("city", locationData?.city || "");
            updateAddress("state", locationData?.state || "");
            updateAddress("country", locationData?.country || "");

            updateAddress("location", {
              type: "Point",
              coordinates: [locationData?.longitude, locationData?.latitude],
            });

            const matchedCountry = COUNTRIES_DATA.find(
              (c) =>
                c.name?.toLowerCase() === locationData.country?.toLowerCase(),
            );

            if (matchedCountry) {
              setSelectedCountry({
                label: matchedCountry.name,
                code: matchedCountry.code,
                dialCode: matchedCountry.dialCode,
              });
            }
            setGoogleModalVisible(false);
          }}
        />
        <PeopleSelection
          isVisible={selectionVisible}
          onClose={() => setSelectionVisible(false)}
          selectionType={selectionType}
          initialSelected={form.sponsors}
          onConfirm={(selectedUsers) => {
            updateField("sponsors", selectedUsers);
            setSelectionVisible(false);
          }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default CreateEvent;
