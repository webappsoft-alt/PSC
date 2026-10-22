import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import {
  AuthHint,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  ls,
  useAuthPalette,
} from "../../../../components/Auth/AuthKit";
import fonts from "../../../../assets/fonts";

export const PASSWORD_RULES = [
  { text: "Minimum 8 characters.", test: (v) => v.length >= 8 },
  { text: "Minimum 1 uppercase", test: (v) => /[A-Z]/.test(v) },
  { text: "Minimum 1 digit", test: (v) => /\d/.test(v) },
];

export const isStrongPassword = (v) => PASSWORD_RULES.every((r) => r.test(v));

const generatePassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + digits + symbols;
  const pick = (set) => set.charAt(Math.floor(Math.random() * set.length));
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 12) chars.push(pick(all));
  return chars.sort(() => Math.random() - 0.5).join("");
};

/**
 * "Create a password" (Figma Password, 3/5): field, "Generate a password for
 * me", divider (FFFFFF 16%), the three rules and the encryption note.
 */
export const CreatePasswordStep = forwardRef(
  ({ initialValue = "", onSubmit, setBtnDisabled }, ref) => {
    const p = useAuthPalette();
    const [password, setPassword] = useState(initialValue);
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!password);
    }, [password]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (!isStrongPassword(password)) {
          setError("Your password does not meet the requirements.");
          return;
        }
        setError("");
        onSubmit?.(password);
      },
    }));

    return (
      <View>
        <AuthStepTitle
          label="Create a password"
          letterSpacing={-2}
          marginTop={32}
        />
        <AuthTextField
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) setError("");
          }}
          placeholder="********"
          secure
          textContentType="newPassword"
          autoComplete="password-new"
          error={error}
        />
        {error ? <AuthHint text={error} color={p.error} /> : null}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setPassword(generatePassword());
            setError("");
          }}
          style={[styles.generate, { marginTop: 12 - HINT_ROW_EXTRA }]}
        >
          <CustomText
            label="Generate a password for me"
            fontSize={12}
            letterSpacing={ls(-3, 12)}
            color={p.gold}
            fontFamily={fonts.regular}
          />
          <Icons
            family="MaterialSymbolsRounded"
            name="arrow_outward"
            size={12}
            color={p.gold}
          />
        </TouchableOpacity>

        <View
          style={[
            styles.divider,
            { backgroundColor: p.t16, marginTop: 12 - HINT_ROW_EXTRA },
          ]}
        />

        {PASSWORD_RULES.map((rule, i) => {
          const ok = rule.test(password);
          return (
            <AuthHint
              key={rule.text}
              text={rule.text}
              icon={ok ? "check_circle" : "info"}
              iconFamily={
                ok ? "MaterialSymbolsRoundedFilled" : "MaterialSymbolsRounded"
              }
              color={ok ? p.success : p.t64}
              marginTop={i === 0 ? 12 - HINT_ROW_EXTRA : 6 - 2 * HINT_ROW_EXTRA}
            />
          );
        })}
        <AuthHint
          text="Your password on PSC is encrypted & secured."
          icon="verified_user"
          iconFamily="MaterialSymbolsRoundedFilled"
          marginTop={6 - 2 * HINT_ROW_EXTRA}
        />
      </View>
    );
  },
);

/** "Confirm password": field + "Please re-enter your password". */
export const ConfirmPasswordStep = forwardRef(
  ({ password, onSubmit, setBtnDisabled }, ref) => {
    const p = useAuthPalette();
    const [value, setValue] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!value);
    }, [value]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        if (value !== password) {
          setError("Passwords do not match.");
          return;
        }
        setError("");
        onSubmit?.(value);
      },
    }));

    return (
      <View>
        <AuthStepTitle
          label="Confirm password"
          letterSpacing={-2}
          marginTop={32}
        />
        <AuthTextField
          value={value}
          onChangeText={(t) => {
            setValue(t);
            if (error) setError("");
          }}
          placeholder="********"
          secure
          textContentType="newPassword"
          autoComplete="password-new"
          error={error}
        />
        <AuthHint
          text={error || "Please re-enter your password"}
          color={error ? p.error : undefined}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  generate: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },
  divider: {
    height: 1,
  },
});
