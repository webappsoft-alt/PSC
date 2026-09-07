import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import { ProSvg, RegularSvg } from "../../../assets/svgs";

import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const ProRole = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [selectedType, setSelectedType] = useState(
      state?.role === "company"
        ? "company"
        : state?.role === "individual"
        ? "Individual"
        : "",
    );

    useEffect(() => {
      setBtnDisabled?.(!selectedType);
    }, [selectedType]);

    const submit = () => {
      const role = selectedType === "company" ? "company" : "individual";
      setState({ ...state, role: role });
      setCurrentIndex(4); // Go to Email
    };

    const back = () => {
      setCurrentIndex(2); // Back to UserType
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    const data = [
      {
        id: "Individual",
        title: "Individual",
        subtitle: "I am solo-entrepreneur or use it as a personal brand.",
        Icon: RegularSvg, // Using RegularSvg as per individual requirement if applicable, or matching design
      },
      {
        id: "company",
        title: "Company",
        subtitle: "We are an established company.",
        Icon: ProSvg,
      },
    ];

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="I am a"
            fontFamily={fonts.semiBold}
            fontSize={32}
            marginTop={16}
            marginBottom={16}
            color={isDark ? COLORS.white : colors.text}
          />
          {data?.map((item) => {
            const isSelected = selectedType === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => setSelectedType(item.id)}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected
                      ? isDark
                        ? COLORS.white
                        : colors.text
                      : isDark
                      ? COLORS.white04
                      : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isSelected
                      ? isDark
                        ? COLORS.white04
                        : colors.surfaceAlt
                      : "transparent",
                  },
                ]}
              >
                <View style={styles.row}>
                  <item.Icon color={isDark ? COLORS.white : colors.text} />
                  <CustomText
                    label={item.title}
                    fontFamily={fonts.medium}
                    fontSize={22}
                    color={isDark ? COLORS.white : colors.text}
                    marginLeft={8}
                  />
                </View>
                <View style={styles.textContainer}>
                  <CustomText
                    label={item.subtitle}
                    fontFamily={fonts.regular}
                    fontSize={14}
                    color={isDark ? COLORS.gray64 : colors.textSecondary}
                    marginTop={8}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  },
);

export default ProRole;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    height: 160,
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
