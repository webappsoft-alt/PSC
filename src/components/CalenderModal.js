import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect } from "react";

import AuthFooter from "./Auth/AuthFooter";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Header from "./Header";

import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const CalenderModal = ({
  isVisible = false,
  onDisable,
  onConfirm,
  disabled = false,
  selectedDates = [],
  disabledDates = [],
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [selectTab, setSelectTab] = useState("");

  const today = new Date();
  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  useEffect(() => {
    if (selectTab) {
      handleQuickSelection(selectTab);
    }
  }, [selectTab]);

  const handleQuickSelection = (selection) => {
    const today = new Date();
    const currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    switch (selection) {
      case "Today":
        setSelectedStartDate(currentDate);
        setSelectedEndDate(currentDate);
        break;

      case "This week":
        const currentDay = today.getDay();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDay);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        setSelectedStartDate(currentDate);
        setSelectedEndDate(endOfWeek);
        break;

      case "This weekend":
        const currentDayOfWeek = today.getDay();
        const saturday = new Date(currentDate);
        const sunday = new Date(currentDate);

        const daysUntilSaturday = (6 - currentDayOfWeek + 7) % 7;
        const daysUntilSunday = (7 - currentDayOfWeek + 7) % 7;

        if (daysUntilSaturday === 0) {
          saturday.setDate(currentDate.getDate());
          sunday.setDate(currentDate.getDate() + 1);
        } else if (daysUntilSunday === 0) {
          saturday.setDate(currentDate.getDate() - 1);
          sunday.setDate(currentDate.getDate());
        } else {
          saturday.setDate(currentDate.getDate() + daysUntilSaturday);
          sunday.setDate(currentDate.getDate() + daysUntilSunday);
        }

        setSelectedStartDate(saturday);
        setSelectedEndDate(sunday);
        break;

      case "This month":
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        setSelectedStartDate(currentDate);
        setSelectedEndDate(endOfMonth);
        break;

      case "This year":
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        setSelectedStartDate(currentDate);
        setSelectedEndDate(endOfYear);
        break;

      default:
        break;
    }
  };

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const getNextMonths = (numberOfMonths = 6) => {
    const months = [];
    const currentDate = new Date();

    for (let i = 0; i < numberOfMonths; i++) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i
      );
      months.push(monthDate);
    }
    return months;
  };

  const getMonthName = (date) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[date.getMonth()];
  };

  const handleDatePress = (day) => {
    setSelectTab("");

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(day);
      setSelectedEndDate(null);
    } else if (selectedStartDate && !selectedEndDate) {
      if (day < selectedStartDate) {
        setSelectedStartDate(day);
      } else {
        setSelectedEndDate(day);
      }
    }
  };

  const monthsToShow = getNextMonths(6);

  const isDateInRange = (day) => {
    if (!selectedStartDate || !selectedEndDate) {
      return false;
    }
    return day >= selectedStartDate && day <= selectedEndDate;
  };

  const isStartDate = (day) => {
    return (
      selectedStartDate &&
      day.toDateString() === selectedStartDate.toDateString()
    );
  };

  const isEndDate = (day) => {
    return (
      selectedEndDate && day.toDateString() === selectedEndDate.toDateString()
    );
  };

  const isSelectedDate = (day) => {
    return selectedDates.some(
      (selectedDate) =>
        new Date(selectedDate).toDateString() === day.toDateString()
    );
  };

  const isToday = (day) => {
    return day.toDateString() === currentDate.toDateString();
  };

  const isDisabledDate = (day) => {
    return disabledDates.some(
      (disabledDate) =>
        new Date(disabledDate).toDateString() === day.toDateString()
    );
  };

  const handleConfirm = () => {
    if (onConfirm && selectedStartDate && selectedEndDate) {
      onConfirm({
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        selectedDates: selectedDates,
      });
    }
    if (onDisable) {
      onDisable();
    }
  };

  return (
    <CustomModal isVisible={isVisible} onDisable={onDisable}>
      <View style={styles.modalContent}>
        <Header title="Pick Dates" />

        <View style={styles.quickSelection}>
          {[
            "Today",
            "This week",
            "This weekend",
            "This month",
            "This year",
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={
                selectTab === item
                  ? styles.quickButton
                  : styles.quickButtonInactive
              }
              onPress={() => setSelectTab(item)}
            >
              <CustomText
                label={item}
                fontFamily={fonts.medium}
                lineHeight={14 * 1.4}
                color={selectTab === item ? COLORS.white : COLORS.black}
              />
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={{ paddingHorizontal: 7 }}
          showsVerticalScrollIndicator={false}
        >
          {monthsToShow.map((monthDate, monthIndex) => {
            const daysInCurrentMonth = getDaysInMonth(
              monthDate.getFullYear(),
              monthDate.getMonth()
            );
            const monthName = getMonthName(monthDate);

            return (
              <View key={monthIndex} style={styles.monthContainer}>
                <CustomText
                  fontFamily={fonts.medium}
                  fontSize={16}
                  lineHeight={16 * 1.4}
                  label={`${monthName} ${monthDate.getFullYear()}`}
                  color={COLORS.black}
                  marginBottom={5}
                  marginLeft={10}
                />

                <View style={styles.daysContainer}>
                  {daysInCurrentMonth.map((day, dayIndex) => {
                    const isBeforeToday = day < currentDate && !isToday(day);
                    const isSelectedStart = isStartDate(day);
                    const isSelectedEnd = isEndDate(day);
                    const inRange = isDateInRange(day);
                    const isSelected = isSelectedDate(day);
                    const isDisabled = isDisabledDate(day);

                    const isExactlyTwoDates =
                      selectedStartDate &&
                      selectedEndDate &&
                      selectedStartDate.toDateString() !==
                        selectedEndDate.toDateString() &&
                      Math.abs(
                        (selectedEndDate - selectedStartDate) /
                          (1000 * 60 * 60 * 24)
                      ) === 1;

                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        style={styles.day}
                        activeOpacity={1}
                        onPress={() =>
                          !isBeforeToday && !isDisabled && handleDatePress(day)
                        }
                        disabled={disabled || isBeforeToday || isDisabled}
                      >
                        <View
                          style={[
                            styles.dateContainer,
                            (isSelectedStart || isSelectedEnd || inRange) &&
                            !isBeforeToday &&
                            !isDisabled
                              ? styles.selectedDateContainer
                              : {},
                          ]}
                        >
                          <View
                            style={[
                              styles.dayInner,
                              !isBeforeToday &&
                              !isDisabled &&
                              isSelectedStart &&
                              isSelectedEnd &&
                              selectedStartDate?.toDateString() ==
                                selectedEndDate?.toDateString()
                                ? styles.singleSelectedDayInner
                                : !isBeforeToday &&
                                  !isDisabled &&
                                  isSelectedStart &&
                                  isExactlyTwoDates
                                ? styles.selectedStartDayInnerWide
                                : !isBeforeToday &&
                                  !isDisabled &&
                                  isSelectedEnd &&
                                  isExactlyTwoDates
                                ? styles.selectedEndDayInnerWide
                                : !isBeforeToday &&
                                  !isDisabled &&
                                  isSelectedStart
                                ? styles.selectedStartDayInner
                                : !isBeforeToday && !isDisabled && isSelectedEnd
                                ? styles.selectedEndDayInner
                                : !isBeforeToday && !isDisabled && inRange
                                ? styles.selectedCenterDayInner
                                : {},
                              isDisabled || isBeforeToday
                                ? styles.disabledDayInner
                                : {},
                            ]}
                          >
                            <CustomText
                              label={day.getDate()}
                              fontFamily={fonts.medium}
                              lineHeight={14 * 1.4}
                              color={
                                isBeforeToday || isDisabled
                                  ? COLORS.gray
                                  : isSelectedStart || isSelectedEnd || inRange
                                  ? COLORS.white
                                  : COLORS.black
                              }
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 12 }}>
          <AuthFooter
            onPress={handleConfirm}
            onBackPress={onDisable}
            disabled={!selectedStartDate || !selectedEndDate}
            btnTitle="Confirm Dates"
            btnSize={16}
            btnFamily={fonts.medium}
            secondText={
              selectedStartDate && selectedEndDate
                ? `From ${selectedStartDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })} - ${selectedEndDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`
                : "Select your dates"
            }
          />
        </View>
      </View>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: COLORS.white,
    height: "100%",
  },
  quickSelection: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingVertical: 15,
    gap: 10,
  },
  quickButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 10,
    borderRadius: 100,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  quickButtonInactive: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    borderRadius: 100,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  monthContainer: {
    marginBottom: 22,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  day: {
    width: "14.1%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  dateContainer: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "#1212120A",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDateContainer: {
    backgroundColor: "#4347FF",
  },
  dayInner: {
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  selectedStartDayInner: {
    backgroundColor: "#4347FF",
    width: 40,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
  },
  selectedEndDayInner: {
    backgroundColor: "#4347FF",
    width: 40,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  selectedStartDayInnerWide: {
    backgroundColor: "#4347FF",
    width: 60,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
  },
  selectedEndDayInnerWide: {
    backgroundColor: "#4347FF",
    width: 60,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  singleSelectedDayInner: {
    backgroundColor: "#4347FF",
    width: 40,
    height: 40,
    borderRadius: 100,
  },
  selectedCenterDayInner: {
    backgroundColor: "#4347FF",
    width: 85,
  },
  disabledDayInner: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 100,
    width: 40,
    height: 40,
  },
});

export default CalenderModal;
