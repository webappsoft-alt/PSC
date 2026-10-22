import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Text, View } from "react-native";
import DatePicker from "react-native-date-picker";
import moment from "moment";

import {
  AuthHint,
  AuthStepTitle,
  AuthTextField,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";

const MIN_AGE = 16;

const isOldEnough = (date) => {
  const birth = moment(date);
  return birth.isValid() && moment().diff(birth, "years") >= MIN_AGE;
};

/**
 * "What’s your date of birth?" — and, for companies (FoundingDate step),
 * "Founding date". Field opens the native date picker.
 */
const DOB = forwardRef(({ stepKey, state, next, setBtnDisabled }, ref) => {
  const p = useAuthPalette();
  const founding = stepKey === "FoundingDate";
  const initial = founding ? state?.foundingDate : state?.dob;
  const [date, setDate] = useState(initial ? new Date(initial) : null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBtnDisabled?.(!date);
  }, [date]);

  const validate = (value) => {
    if (!value) return "Please select a date.";
    if (!founding && !isOldEnough(value)) {
      return `You must be at least ${MIN_AGE} years old to use PSC.`;
    }
    if (founding && moment(value).isAfter(moment(), "day")) {
      return "The founding date cannot be in the future.";
    }
    return "";
  };

  useImperativeHandle(ref, () => ({
    submit: () => {
      const err = validate(date);
      setError(err);
      if (err) return;
      const value = moment(date).format("YYYY-MM-DD");
      next(founding ? { foundingDate: value } : { dob: value });
    },
  }));

  const maxDate = founding
    ? new Date()
    : moment().subtract(MIN_AGE, "years").toDate();

  return (
    <View>
      <AuthStepTitle
        label={founding ? "Founding date" : "What’s your date of birth?"}
      />
      <AuthTextField
        onPress={() => setOpen(true)}
        value={date ? moment(date).format("MMMM D, YYYY") : ""}
        placeholder="E.g. October 30, 2009"
        valueFamily={fonts.regular}
        error={error}
      />
      {error ? (
        <AuthHint text={error} color={p.error} />
      ) : founding ? (
        <AuthHint text="When did your company was legally & officially registered." />
      ) : (
        <AuthHint text={`You must be at least ${MIN_AGE} years old to use`}>
          <Text style={{ fontFamily: fonts.medium, color: p.text }}> PSC</Text>.
        </AuthHint>
      )}

      <DatePicker
        modal
        open={open}
        mode="date"
        date={date || maxDate}
        maximumDate={maxDate}
        theme={p.isDark ? "dark" : "light"}
        buttonColor={COLORS.buttonColor}
        confirmButtonColor={COLORS.buttonColor}
        onConfirm={(d) => {
          setOpen(false);
          setDate(d);
          setError(validate(d));
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
});

export default DOB;
