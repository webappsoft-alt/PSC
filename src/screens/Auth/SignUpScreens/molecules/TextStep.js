import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { View } from "react-native";

import {
  AuthHint,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  useAuthPalette,
} from "../../../../components/Auth/AuthKit";

export const MAX_LENGTH = 37;

/**
 * One-field step (names, industry, working at, job title):
 * title → 48 field → helper rows (8 apart), "n/37" on the first row.
 *
 * `hints`: [{ text, counter?: boolean }]
 */
const TextStep = forwardRef(
  (
    {
      title,
      placeholder,
      initialValue = "",
      hints = [],
      validate,
      onSubmit,
      setBtnDisabled,
      autoCapitalize = "words",
      keyboardType,
    },
    ref,
  ) => {
    const p = useAuthPalette();
    const [value, setValue] = useState(initialValue || "");
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!value.trim());
    }, [value]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        const trimmed = value.trim().replace(/\s+/g, " ");
        const err = validate ? validate(trimmed) : trimmed ? "" : "Required";
        setError(err || "");
        if (err) return;
        onSubmit?.(trimmed);
      },
    }));

    return (
      <View>
        <AuthStepTitle label={title} />
        <AuthTextField
          value={value}
          onChangeText={(t) => {
            setValue(t);
            if (error) setError("");
          }}
          placeholder={placeholder}
          maxLength={MAX_LENGTH}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          error={error}
        />
        {error ? <AuthHint text={error} color={p.error} /> : null}
        {hints.map((h, i) => (
          <AuthHint
            key={h.text}
            text={h.text}
            right={h.counter ? `${value.length}/${MAX_LENGTH}` : undefined}
            marginTop={
              i === 0 && !error ? 8 - HINT_ROW_EXTRA : 8 - 2 * HINT_ROW_EXTRA
            }
          />
        ))}
      </View>
    );
  },
);

export default TextStep;
