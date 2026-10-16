import { StyleSheet, View } from "react-native";
import React, { useState, useEffect } from "react";
import {
  useClearByFocusCell,
  useBlurOnFulfill,
  CodeField,
  Cursor,
} from "react-native-confirmation-code-field";

import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";
import ErrorComponent from "./ErrorComponent";
import CustomText from "./CustomText";
import { useTheme } from "../contexts/ThemeContext";

const CELL_COUNT = 4;

const OTPComponent = ({
  value,
  setValue,
  error,
  marginBottom = 8,
  marginTop = 0,
}) => {
  const { colors, isDark } = useTheme();
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  const [showSuccessColor, setShowSuccessColor] = useState(false);
  const [prevError, setPrevError] = useState(error);

  useEffect(() => {
    if (error) {
      // An error always wins over the transient green "corrected" state.
      setShowSuccessColor(false);
      setPrevError(error);
      return;
    }
    if (prevError) {
      setPrevError(error);
      setShowSuccessColor(true);
      const timer = setTimeout(() => setShowSuccessColor(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <View style={{ marginBottom, marginTop }}>
      <CodeField
        ref={ref}
        {...props}
        value={value}
        onChangeText={setValue}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({ index, symbol, isFocused }) => (
          <View
            onLayout={getCellOnLayoutHandler(index)}
            key={index}
            style={[
              styles.cellRoot,
              { backgroundColor: colors.surfaceAlt },
              isFocused && [
                styles.focusCell,
                { borderColor: isDark ? COLORS.white : colors.text },
              ],
              error && styles.errorCell,
              showSuccessColor && styles.successCell,
            ]}
          >
            <CustomText
              color={
                !symbol
                  ? isDark
                    ? COLORS.gray2
                    : colors.iconMuted
                  : isDark
                  ? COLORS.white
                  : colors.text
              }
              fontSize={32}
              fontFamily={fonts.medium}
              lineHeight={32 * 1.4}
            >
              {symbol || (isFocused ? <Cursor /> : (index + 1).toString())}
            </CustomText>
          </View>
        )}
      />

      {error && (
        <ErrorComponent
          errorTitle={error}
          color="#EE1045"
          error={error}
          marginTop={8}
          marginBottom={8}
        />
      )}
    </View>
  );
};

export default OTPComponent;

const styles = StyleSheet.create({
  codeFieldRoot: {
    width: "97%",
    justifyContent: "space-between",
    alignSelf: "center",
  },
  cellRoot: {
    height: 80,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  focusCell: {
    borderWidth: 1,
  },
  errorCell: {
    backgroundColor: "#EE10450A",
    borderColor: "#EE1045CC",
    borderWidth: 1,
  },
  successCell: {
    backgroundColor: "#64CD750A",
    borderColor: "#64CD75",
    borderWidth: 1,
  },
});
