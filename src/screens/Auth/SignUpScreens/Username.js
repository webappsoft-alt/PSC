import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";

import CustomInput from "../../../components/CustomInput";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useNavigation } from "@react-navigation/native";
import { post } from "../../../services/ApiRequest";
import { ToastMessage } from "../../../utils/ToastMessage";
import Divider from "../../../components/Divider";
import { useTheme } from "../../../contexts/ThemeContext";

const StepTwo = forwardRef(
  (
    {
      currentIndex,
      setCurrentIndex,
      state,
      setState,
      setLoadingState,
      setBtnDisabled,
    },
    ref,
  ) => {
    const { colors, isDark } = useTheme();
    const [firstName, setFirstName] = useState(state?.first_name || "");
    const [usernameStatus, setUsernameStatus] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [isManualChange, setIsManualChange] = useState(true);

    const navigation = useNavigation();

    useEffect(() => {
      setBtnDisabled?.(!firstName.trim() || usernameStatus === "taken");
    }, [firstName, usernameStatus]);

    // Live availability check (debounced) while the user types.
    useEffect(() => {
      const name = firstName.trim();
      setUsernameStatus(null);
      if (!name || errorCheck(name)) return;

      const timer = setTimeout(async () => {
        try {
          const res = await post("auth/check-username", { username: name });
          if (res?.data?.success && !res?.error) {
            setUsernameStatus("available");
            setError("");
          } else {
            setUsernameStatus("taken");
            setError("Username is taken");
          }
        } catch (err) {
          setUsernameStatus("taken");
          setError("Username is taken");
        }
      }, 500);

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firstName]);

    const randomSuffix = [
      "official",
      "real",
      "x",
      "hub",
      "world",
      "live",
      "zone",
      "gram",
      "daily",
      "pro",
      "01",
      "99",
      "777",
    ];

    const generateSuggestions = (name) => {
      if (!name) {
        setSuggestions([]);
        return;
      }

      const base = name.toLowerCase().replace(/\s/g, "");

      const newSuggestions = new Set();

      while (newSuggestions.size < 8) {
        const random =
          randomSuffix[Math.floor(Math.random() * randomSuffix.length)];
        const number = Math.floor(Math.random() * 100);

        const patterns = [
          `${base}${number}`,
          `${base}${random}`,
          `${random}${base}`,
          `${base}.${random}`,
          `${base}${random}`,
          `${base}_${number}`,
        ];

        const pick = patterns[Math.floor(Math.random() * patterns.length)];
        newSuggestions.add(pick);
      }

      setSuggestions(Array.from(newSuggestions).slice(0, 8));
    };

    useEffect(() => {
      if (isManualChange) {
        generateSuggestions(firstName);
      }
    }, [firstName, isManualChange]);

    const errorCheck = (val) => {
      let newErrors = "";
      const nameRegex = /^[A-Za-z\s'-_]{2,30}$/;

      if (!val.trim()) {
        newErrors = "Please enter your first name";
      } else if (!nameRegex.test(val.trim())) {
        newErrors =
          "Please enter a valid first name (letters only, 2–30 characters)";
      }

      return newErrors;
    };

    const submit = async () => {
      const err = errorCheck(firstName);

      if (err) {
        setError(err);
        return;
      }

      setError("");

      const body = {
        username: firstName.trim(),
      };

      try {
        setLoading(true);
        if (setLoadingState) setLoadingState(true);

        const res = await post(`auth/check-username`, body);

        if (res?.error?.data?.success === false) {
          const message =
            res?.error?.message ||
            "Username already exists. Please choose another one.";

          setError("Username is taken");
          setUsernameStatus("taken");

          ToastMessage(message, "error");

          setLoading(false);
          if (setLoadingState) setLoadingState(false);
          return;
        }

        if (res?.data?.success && !res?.error) {
          setState({ ...state, first_name: firstName.trim() });
          setUsernameStatus("available");

          setCurrentIndex(7);
        } else {
          setUsernameStatus("taken");
        }

        setLoading(false);
        if (setLoadingState) setLoadingState(false);
      } catch (error) {
        setLoading(false);
        setUsernameStatus("taken");

        if (setLoadingState) setLoadingState(false);

        const message = "Username already exists. Please choose another one.";

        setError("Username is taken");
        ToastMessage(message, "error");
      }
    };

    const back = () => {
      setCurrentIndex(5);
    };

    const selectSuggestion = (username) => {
      setFirstName(username);
      setSelectedSuggestion(username);
      setIsManualChange(false); // STOP new suggestions
      setError("");
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: loading }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="Pick a username?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            marginTop={12}
            letterSpacing={-1}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomInput
            placeholder="E.g. James"
            autoCapitalize={"none"}
            maxLength={30}
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setSelectedSuggestion(null);
              setIsManualChange(true); // allow new suggestions

              if (error) {
                if (error.includes("already exists")) {
                  setError("");
                } else {
                  const newError = errorCheck(text);
                  if (!newError) {
                    setError("");
                  }
                }
              }
            }}
            error={error}
          />

          {usernameStatus == "available" && !error && (
            <ErrorComponent
              errorTitle="Username is available"
              color={COLORS.green}
              isValid
              marginBottom={2}
            />
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <ErrorComponent
              errorTitle="This will appear on your profile."
              marginBottom={2}
            />

            <CustomText
              label={`${firstName.length}/30`}
              color={isDark ? COLORS.gray64 : colors.textSecondary}
              fontSize={12}
            />
          </View>

          <ErrorComponent errorTitle="Inappropriate names are forbidden." />
        </View>

        <Divider thickness={1} color={isDark ? COLORS.inputBg : colors.border} marginVertical={16} />

        {/* USERNAME SUGGESTIONS */}
        <View style={styles.suggestionContainer}>
          <View style={styles.suggestionWrap}>
            {suggestions
              .filter((item) => item.length <= 30)
              .map((item, index) => {
                const isSelected = selectedSuggestion === item;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionItem,
                      { borderColor: isDark ? COLORS.inputBg : colors.border },
                      isSelected && {
                        backgroundColor: isDark ? COLORS.white : colors.text,
                        borderColor: isDark ? COLORS.white : colors.text,
                      },
                    ]}
                    onPress={() => selectSuggestion(item)}
                    activeOpacity={0.8}
                  >
                    <CustomText
                      label={`@${item}`}
                      fontFamily={fonts.medium}
                      fontSize={12}
                      color={isSelected ? (isDark ? COLORS.black : colors.background) : (isDark ? COLORS.gray64 : colors.textSecondary)}
                    />
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      </View>
    );
  },
);

export default StepTwo;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },

  suggestionContainer: {
    marginTop: 4,
  },

  suggestionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
  },

  selectedSuggestion: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
});
