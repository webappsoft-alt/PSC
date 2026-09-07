import {
  StyleSheet,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import React, { useEffect, useState } from "react";
import moment from "moment";
import CustomDatePicker from "../../../../components/CustomDatePicker";
import ErrorComponent from "../../../../components/ErrorComponent";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TimingDetails = ({
  marginTop = 0,
  marginBottom = 8,

  startDate,
  setStartDate,
  startTime,
  setStartTime,

  endDate,
  setEndDate,
  endTime,
  setEndTime,
}) => {
  const [timingError, setTimingError] = useState("");
  const [showSuccessColor, setShowSuccessColor] = useState(false);
  useEffect(() => {
    validateTiming();
  }, [startDate, startTime, endDate, endTime]);

  const validateTiming = () => {
    LayoutAnimation.easeInEaseOut();

    if (!startDate || !startTime || !endDate || !endTime) {
      setTimingError("");
      return;
    }

    const start = moment(startDate).set({
      hour: moment(startTime).hour(),
      minute: moment(startTime).minute(),
    });

    const end = moment(endDate).set({
      hour: moment(endTime).hour(),
      minute: moment(endTime).minute(),
    });

    if (end.isSameOrBefore(start)) {
      setTimingError("End date & time must be after start date & time");
    } else {
      setShowSuccessColor(true);
      setTimingError("");
    }
  };

  return (
    <View style={{ marginBottom, marginTop }}>
      <View style={[styles.row, { marginBottom: 8 }]}>
        <CustomDatePicker
          withLabel={"starting date"}
          width={"54%"}
          isIcon1
          placeholder="Jul 12, 2025"
          value={startDate}
          setValue={setStartDate}
          type="date"
          minDate={new Date()}
        />

        <CustomDatePicker
          withLabel={"time"}
          width={"44%"}
          type="time"
          isIcon1
          placeholder="10:00 AM"
          value={startTime}
          setValue={setStartTime}
        />
      </View>

      <View style={styles.row}>
        <CustomDatePicker
          withLabel={"end date"}
          width={"54%"}
          isIcon1
          placeholder="Jul 12, 2025"
          value={endDate}
          setValue={setEndDate}
          type="date"
          minDate={startDate || new Date()}
          // error={!!timingError}
          hideError={true}
        />

        <CustomDatePicker
          withLabel={"time"}
          width={"44%"}
          type="time"
          isIcon1
          placeholder="11:50 PM"
          value={endTime}
          setValue={setEndTime}
          error={!!timingError}
          hideError={true}
        />
      </View>

      {timingError ? (
        <ErrorComponent
          errorTitle={timingError}
          error={timingError}
          marginTop={4}
          color={timingError ? "#EE1045" : showSuccessColor ? "#64CD75" : ""}
        />
      ) : null}
    </View>
  );
};

export default TimingDetails;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
