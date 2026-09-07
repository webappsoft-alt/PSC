import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import AuthFooter from "../components/Auth/AuthFooter";
import CustomInput from "../components/CustomInput";
import CustomSwitch from "../components/CustomSwitch";
import Divider from "../components/Divider";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import DateTimeModal from "./DateTimeModal";
import Icons from "./Icons";

import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";

const YourTrips = ({ title, isVisible, onDisable, onConfirm = () => {} }) => {
  const navigation = useNavigation();
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [tourists, setTourists] = useState({
    adult: 1,
    children: 0,
    infants: 0,
  });
  const [selectedLocation, setSelectedLocation] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [activeInput, setActiveInput] = useState("");
  const [dynamicInputs, setDynamicInputs] = useState([]);
  const [nextInputNumber, setNextInputNumber] = useState(2);
  const [isDateTimeModalVisible, setIsDateTimeModalVisible] = useState(false);

  const init = {
    date: null,
    time: null,
    from: "",
    whereTo: "",
    input1: "",
    input2: "",
    input3: "",
  };

  const [state, setState] = useState(init);

  const handleInputChange = (field, value) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIncrement = (type) => {
    setTourists((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  };

  const handleDecrement = (type) => {
    if (tourists[type] > 0) {
      setTourists((prev) => ({
        ...prev,
        [type]: prev[type] - 1,
      }));
    }
    if (type === "adult" && tourists.adult <= 1) {
      setTourists((prev) => ({
        ...prev,
        adult: 1,
      }));
    }
  };

  const handleAddInput = () => {
    const newInput = {
      id: nextInputNumber,
      value: "",
      key: `input${nextInputNumber}`,
    };
    setDynamicInputs((prev) => [...prev, newInput]);
    setNextInputNumber((prev) => prev + 1);
  };

  const handleRemoveInput = (id) => {
    setDynamicInputs((prev) => prev.filter((input) => input.id !== id));
  };

  const handleDynamicInputChange = (id, value) => {
    setDynamicInputs((prev) =>
      prev.map((input) => (input.id === id ? { ...input, value } : input))
    );
  };

  const handleDateTimePress = () => {
    setIsDateTimeModalVisible(true);
  };

  const handleDateTimeConfirm = ({ date, time }) => {
    setState((prev) => ({
      ...prev,
      date: date,
      time: time,
    }));
    setIsDateTimeModalVisible(false);
  };

  const formatDateTime = (date, time) => {
    if (!date && !time) return "";
    let result = "";
    if (date) {
      result += date.toLocaleDateString();
    }
    if (time) {
      if (result) result += " ";
      result += time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return result;
  };

  const handleConfirm = () => {
    const dynamicInputsData = dynamicInputs.reduce((acc, input) => {
      acc[input.key] = input.value;
      return acc;
    }, {});

    onConfirm({
      tourists,
      isRoundTrip,
      selectedLocation,
      fromLocation,
      ...state,
      ...dynamicInputsData,
    });
    onDisable();
  };

  const geo_locations = ["Add", "Home", "Gym", "Airpot", "Work"];

  return (
    <>
      <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
        {/* <TouchableOpacity onPress={onDisable} style={styles.dismissIcon}>
        <Image source={PNGIcons.cross} style={{ width: 24, height: 24 }} />
      </TouchableOpacity> */}
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <CustomText
            label={title}
            color={COLORS.black}
            fontSize={24}
            lineHeight={24 * 1.4}
            fontFamily={fonts.semiBold}
            marginBottom={16}
          />

          <View>
            <Icons
              name={"map-marker-alt"}
              family={"FontAwesome5"}
              size={16}
              color={COLORS.black}
              style={{
                position: "absolute",
                top: 25,
                left: 10,
              }}
            />
            <CustomInput
              withLabel={"From"}
              value={state.from}
              onChangeText={(text) => handleInputChange("from", text)}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationScrollContainer}
          >
            {geo_locations.map((location, index) => (
              <TouchableOpacity
                key={`from ${index}`}
                style={[
                  styles.locationItem,
                  fromLocation === location && styles.selectedLocationItem,
                ]}
                onPress={() => {
                  if (location === "Add") {
                    handleAddInput();
                  } else {
                    setFromLocation(location);
                  }
                }}
              >
                {location === "Add" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Icons
                      name="add"
                      family="Ionicons"
                      size={16}
                      color={
                        fromLocation === location ? COLORS.white : COLORS.black
                      }
                    />
                    <CustomText
                      label={location}
                      color={
                        fromLocation === location ? COLORS.white : COLORS.black
                      }
                      fontSize={14}
                      fontFamily={fonts.medium}
                    />
                  </View>
                ) : (
                  <CustomText
                    label={location}
                    color={
                      fromLocation === location ? COLORS.white : COLORS.black
                    }
                    fontSize={14}
                    fontFamily={fonts.medium}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputsContainer}>
            <View style={styles.inputWithCircle}>
              <View
                style={[
                  styles.circleIndicator,
                  (activeInput === "input1" || state.input1) &&
                    styles.activeCircleIndicator,
                ]}
              >
                <CustomText
                  label="1"
                  color={
                    activeInput === "input1" || state.input1
                      ? COLORS.white
                      : COLORS.black
                  }
                  lineHeight={24}
                  fontSize={16}
                  fontFamily={fonts.semiBold}
                />
              </View>
              {dynamicInputs.length > 0 && (
                <View style={styles.connectingLine} />
              )}
              <View style={styles.inputWrapper}>
                <CustomInput
                  borderRadius={100}
                  width={"85%"}
                  value={state.input1}
                  onChangeText={(text) => handleInputChange("input1", text)}
                  style={{ flex: 1 }}
                  onFocus={() => setActiveInput("input1")}
                  placeholder="Add Steps"
                  isClear
                />
                <Icons
                  name="reorder-three"
                  family="Ionicons"
                  size={30}
                  color={COLORS.subtitle}
                  style={styles.inputIcon}
                />
              </View>
            </View>

            {dynamicInputs.map((input, index) => (
              <View key={input.id} style={styles.inputWithCircle}>
                <View
                  style={[
                    styles.circleIndicator,
                    (activeInput === input.key || input.value) &&
                      styles.activeCircleIndicator,
                  ]}
                >
                  <CustomText
                    label={input.id.toString()}
                    color={
                      activeInput === input.key || input.value
                        ? COLORS.white
                        : COLORS.black
                    }
                    fontSize={16}
                    fontFamily={fonts.semiBold}
                  />
                </View>
                {index < dynamicInputs.length - 1 && (
                  <View style={styles.connectingLine} />
                )}
                <View style={styles.inputWrapper}>
                  <CustomInput
                    borderRadius={100}
                    width={"85%"}
                    value={input.value}
                    onChangeText={(text) => {
                      if (text === "") {
                        handleRemoveInput(input.id);
                      } else {
                        handleDynamicInputChange(input.id, text);
                      }
                    }}
                    style={{ flex: 1 }}
                    onFocus={() => setActiveInput(input.key)}
                    placeholder="Add Steps"
                    isClear
                  />
                  <Icons
                    name="reorder-three"
                    family="Ionicons"
                    size={30}
                    color={COLORS.subtitle}
                    style={styles.inputIcon}
                  />
                </View>
              </View>
            ))}
          </View>

          <View>
            <Icons
              name={"map-marker-alt"}
              family={"FontAwesome5"}
              size={16}
              color={COLORS.black}
              style={{
                position: "absolute",
                top: 25,
                left: 10,
              }}
            />
            <CustomInput
              withLabel={"Where to"}
              value={state.whereTo}
              onChangeText={(text) => handleInputChange("whereTo", text)}
            />
          </View>

          <View style={[styles.row, { marginBottom: 16 }]}>
            <View>
              <CustomText
                label={"Adults"}
                color={COLORS.black}
                fontSize={16}
                fontFamily={fonts.medium}
              />
              <CustomText
                label={"Current adults"}
                color={COLORS.gray5}
                fontSize={12}
                fontFamily={fonts.semiBold}
              />
            </View>
            <View style={[styles.row, { gap: 12 }]}>
              <TouchableOpacity
                style={styles.buttons}
                onPress={() => handleDecrement("adult")}
              >
                <Icons
                  name={"minus"}
                  family={"AntDesign"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
              <CustomText
                label={tourists.adult.toString()}
                color={COLORS.black}
                fontSize={16}
                fontFamily={fonts.semiBold}
                marginTop={3}
              />
              <TouchableOpacity
                style={styles.buttons}
                onPress={() => handleIncrement("adult")}
              >
                <Icons
                  name={"plus"}
                  family={"AntDesign"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.row, { marginBottom: 16 }]}>
            <View>
              <CustomText
                label={"Children"}
                color={COLORS.black}
                fontSize={16}
                fontFamily={fonts.medium}
              />
              <CustomText
                label={"Current children"}
                color={COLORS.gray5}
                fontSize={12}
                fontFamily={fonts.semiBold}
              />
            </View>
            <View style={[styles.row, { gap: 12 }]}>
              <TouchableOpacity
                style={styles.buttons}
                onPress={() => handleDecrement("children")}
              >
                <Icons
                  name={"minus"}
                  family={"AntDesign"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
              <CustomText
                label={tourists.children.toString()}
                color={COLORS.black}
                fontSize={16}
                fontFamily={fonts.semiBold}
                marginTop={3}
              />
              <TouchableOpacity
                style={styles.buttons}
                onPress={() => handleIncrement("children")}
              >
                <Icons
                  name={"plus"}
                  family={"AntDesign"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.row, { marginBottom: 16 }]}>
            <View>
              <CustomText
                label={"Infants"}
                color={COLORS.black}
                fontSize={16}
                fontFamily={fonts.medium}
              />
              <CustomText
                label={"Current Infants"}
                color={COLORS.gray5}
                fontSize={12}
                fontFamily={fonts.semiBold}
              />
            </View>
            <View style={[styles.row, { gap: 12 }]}>
              <TouchableOpacity
                style={styles.buttons}
                onPress={() => handleDecrement("infants")}
              >
                <Icons
                  name={"minus"}
                  family={"AntDesign"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
              <CustomText
                label={tourists.infants.toString()}
                color={COLORS.black}
                fontSize={16}
                fontFamily={fonts.semiBold}
                marginTop={3}
              />
              <TouchableOpacity
                style={styles.buttons}
                onPress={() => handleIncrement("infants")}
              >
                <Icons
                  name={"plus"}
                  family={"AntDesign"}
                  size={20}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>
          </View>

          <Divider marginVertical={16} />
          <View style={[styles.row, { marginBottom: 16 }]}>
            <CustomText
              label={"Round Trip?"}
              color={COLORS.black}
              fontSize={16}
              fontFamily={fonts.semiBold}
            />
            <CustomSwitch value={isRoundTrip} setValue={setIsRoundTrip} />
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              onPress={handleDateTimePress}
              style={{ width: "58%" }}
            >
              <CustomInput
                withLabel={"When You Need it?"}
                width={"100%"}
                value={formatDateTime(state.date, null)}
                editable={false}
                placeholder="Select Date"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDateTimePress}
              style={{ width: "40%" }}
            >
              <CustomInput
                withLabel={"When Time?"}
                width={"100%"}
                value={formatDateTime(null, state.time)}
                editable={false}
                placeholder="Select Time"
              />
            </TouchableOpacity>
          </View>

          <AuthFooter
            title={
              "The easiest and most affordable way to reach your destination."
            }
            isMain
            onPress={handleConfirm}
            onBackPress={() =>
              navigation.canGoBack
                ? navigation.goBack
                : navigation.navigate("Home")
            }
          />
        </ScrollView>
      </CustomModal>

      <DateTimeModal
        isVisible={isDateTimeModalVisible}
        onDisable={() => setIsDateTimeModalVisible(false)}
        onConfirm={handleDateTimeConfirm}
        initialDate={state.date}
        initialTime={state.time}
      />
    </>
  );
};

export default YourTrips;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    flexGrow: 1,
    width: "100%",
    paddingTop: 25,
  },
  row: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  buttons: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    backgroundColor: COLORS.inputBg,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    marginTop: 24,
    borderRadius: 12,
    height: 48,
  },
  locationScrollContainer: {
    marginTop: 8,
    marginBottom: 16,
    gap: 10,
  },
  locationItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.inputBg,
    borderRadius: 100,
    marginRight: 8,
  },
  selectedLocationItem: {
    backgroundColor: COLORS.black,
  },
  inputsContainer: {
    marginBottom: 16,
    gap: 16,
    position: "relative",
  },
  inputWithCircle: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  circleIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginBottom: 16,
    zIndex: 2,
  },
  activeCircleIndicator: {
    backgroundColor: COLORS.black,
  },
  connectingLine: {
    position: "absolute",
    width: 2,
    height: 30,
    backgroundColor: "#12121229",
    left: 15,
    top: 60,
    zIndex: 1,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    right: 12,
    zIndex: 1,
  },
  dismissIcon: {
    height: 48,
    width: 48,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.lightGray,
    position: "absolute",
    top: -60,
    left: "50%",
    transform: [{ translateX: -24 }],
  },
});
