import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import { ProSvg, RegularSvg } from "../../../assets/svgs";

import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const UserType = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [selectedType, setSelectedType] = useState(
      state?.userType || "",
    );

    useEffect(() => {
      setBtnDisabled?.(!selectedType);
    }, [selectedType]);

    const submit = () => {
      if (selectedType === "Regular") {
        setState({ ...state, userType: "Regular", role: "regular" });
        setCurrentIndex(4); // Go to Email
      } else {
        setState({ ...state, userType: "Pro" });
        setCurrentIndex(3); // Go to ProRole
      }
    };

    const back = () => {
      setCurrentIndex(1); // Back to DOB
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    const data = [
      {
        id: "Regular",
        title: "Regular",
        subtitle:
          "I want to use PSC to get the latest news and build my network in no time.",
        Icon: RegularSvg,
      },
      {
        id: "Pro",
        title: "Pro",
        subtitle:
          "I want to use PSC to get the latest trends and build an online presence for my company/ brand.",
        Icon: ProSvg,
      },
    ];

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="I want to use PSC as a"
            fontFamily={fonts.semiBold}
            fontSize={24}
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

export default UserType;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    height: 160,
    // flexDirection: "row",
    // alignItems: "flex-start",
  },
  textContainer: {
    // flex: 1,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
