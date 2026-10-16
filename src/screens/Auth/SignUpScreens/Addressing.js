import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";

import fonts from "../../../assets/fonts";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const Addressing = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [selected, setSelected] = useState(state?.addressing || "firstname");

    useEffect(() => {
      setBtnDisabled?.(!selected);
    }, [selected]);

    const submit = () => {
      setState({ ...state, addressing: selected });
      setCurrentIndex(8);
    };

    const back = () => {
      setCurrentIndex(6);
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    const options = [
      {
        key: "firstname",
        title: "Using Your Firstname",
        subtitle: "Friendly",
        example: `E.g. Hi ${state?.full_name || "Ana"}, how was your day?`,
      },
      {
        key: "lastname",
        title: "Using Your Lastname",
        subtitle: "Corporate",
        example: `E.g. Hello Mr. ${
          state?.last_name || "Johnson"
        }, how was your day?`,
      },
    ];

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="How Would You Like To Be Addressed?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            letterSpacing={-0.24}
            marginTop={12}
            marginBottom={16}
            color={isDark ? COLORS.white : colors.text}
          />

          {options.map((item) => {
            const isSelected = selected === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={() => setSelected(item.key)}
                style={[styles.card, { backgroundColor: colors.surfaceAlt }]}
              >
                <View style={styles.cardText}>
                  <CustomText
                    label={item.title}
                    fontFamily={fonts.medium}
                    fontSize={16}
                    lineHeight={16 * 1.4}
                    color={isDark ? COLORS.white : colors.text}
                  />
                  <CustomText
                    label={item.subtitle}
                    fontFamily={fonts.semiBold}
                    fontSize={14}
                    lineHeight={14 * 1.4}
                    color={isDark ? COLORS.white : colors.text}
                  />
                  <CustomText
                    label={item.example}
                    fontFamily={fonts.regular}
                    fontSize={12}
                    lineHeight={12 * 1.4}
                    marginTop={4}
                    color={isDark ? COLORS.gray64 : colors.textSecondary}
                  />
                </View>
                <Icons
                  family="MaterialSymbolsRounded"
                  name={
                    isSelected ? "radio_button_checked" : "radio_button_unchecked"
                  }
                  size={22}
                  color={
                    isSelected
                      ? COLORS.buttonColor
                      : isDark
                      ? COLORS.gray64
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

export default Addressing;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  cardText: {
    flex: 1,
    marginRight: 12,
  },
});
