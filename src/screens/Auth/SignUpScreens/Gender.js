import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

import FloatingSheet from "../../../components/FloatingSheet";
import Icons from "../../../components/Icons";
import {
  AuthHint,
  AuthStepTitle,
  AuthTextField,
  OptionRow,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";

const GENDERS = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "other", label: "Other" },
];

/** "What is your gender?" — 48 field with chevron, picker in the app's bottom sheet. */
const Gender = forwardRef(({ state, next, setBtnDisabled }, ref) => {
  const p = useAuthPalette();
  const [gender, setGender] = useState(state?.gender || "");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBtnDisabled?.(!gender);
  }, [gender]);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (!gender) {
        setError("Please select an option.");
        return;
      }
      next({ gender });
    },
  }));

  const label = GENDERS.find((g) => g.key === gender)?.label || "";

  return (
    <View>
      <AuthStepTitle label="What is your gender?" />
      <AuthTextField
        onPress={() => setOpen(true)}
        value={label}
        placeholder="E.g. Male"
        error={error}
        right={
          <Icons
            family="MaterialSymbolsRounded"
            name="chevron_right"
            size={24}
            color={p.t64}
          />
        }
      />
      <AuthHint
        text={error || "Please select an option."}
        color={error ? p.error : undefined}
      />

      <FloatingSheet
        visible={open}
        onDismiss={() => setOpen(false)}
        title="Gender"
        subtitle="Please select an option."
      >
        <View style={styles.options}>
          {GENDERS.map((g) => (
            <OptionRow
              key={g.key}
              title={g.label}
              selected={gender === g.key}
              onPress={() => {
                setGender(g.key);
                setError("");
                setOpen(false);
              }}
            />
          ))}
        </View>
      </FloatingSheet>
    </View>
  );
});

export default Gender;

const styles = StyleSheet.create({
  options: {
    gap: 8,
  },
});
