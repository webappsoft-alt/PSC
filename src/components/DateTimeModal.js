import { TouchableOpacity, StyleSheet, View, Image } from "react-native";
import { useState } from "react";

import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import CustomDatePicker from "./CustomDatePicker";
import AuthFooter from "./Auth/AuthFooter";

import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const DateTimeModal = ({
  isVisible,
  onDisable,
  onConfirm,
  initialDate,
  initialTime,
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || null);
  const [selectedTime, setSelectedTime] = useState(initialTime || null);

  const handleConfirm = () => {
    onConfirm({
      date: selectedDate,
      time: selectedTime,
    });
    onDisable();
  };

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.mainContainer}>
        <CustomText
          label="Select date & time"
          fontFamily={fonts.semiBold}
          fontSize={24}
          lineHeight={24 * 1.4}
          color={COLORS.black}
          marginBottom={16}
        />
        <CustomText
          label={
            "Veuillez entrer les informations relevant de votre identité comme mentionnez sur vos documents officiels."
          }
          color={COLORS.subtitle}
          lineHeight={14 * 1.4}
          fontSize={14}
          fontFamily={fonts.semiBold}
        />
        <TouchableOpacity onPress={onDisable} style={styles.dismissIcon}>
          <Image source={PNGIcons.cross} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 24,
          }}
        >
          <CustomDatePicker
            value={selectedDate}
            setValue={setSelectedDate}
            withLabel="Departure Date"
            placeholder="DD/MM/AAAA"
            type="date"
            width="49%"
          />
          <CustomDatePicker
            value={selectedTime}
            setValue={setSelectedTime}
            withLabel="Departure Time"
            placeholder="XX:XX"
            type="time"
            width="49%"
          />
        </View>

        <View style={styles.footerContainer}>
          <AuthFooter
            title="The easiest and most affordable way to reach your destination."
            isMain
            onPress={handleConfirm}
            onBackPress={onDisable}
          />
        </View>
      </View>
    </CustomModal>
  );
};

export default DateTimeModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  footerContainer: {
    marginTop: 20,
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
