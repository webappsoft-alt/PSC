import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";

import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const UserType = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [selectedType, setSelectedType] = useState(state?.userType || "");

    useEffect(() => {
      setBtnDisabled?.(!selectedType);
    }, [selectedType]);

    const submit = () => {
      if (selectedType === "Regular") {
        setState({ ...state, userType: "Regular", role: "regular" });
        setCurrentIndex(4); // Customer skips ProRole -> Firstname
      } else {
        setState({ ...state, userType: "Pro" });
        setCurrentIndex(3); // Professional -> ProRole
      }
    };

    const back = () => {
      setCurrentIndex(1); // Back to DOB
    };

    useImperativeHandle(ref, () => ({ submit, back }));

    const data = [
      {
        id: "Regular",
        title: "A Customer",
        color: COLORS.darkGreen,
      },
      {
        id: "Pro",
        title: "A Professional",
        color: COLORS.darkPurple,
      },
    ];

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="I am"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            letterSpacing={-0.24}
            marginTop={12}
            marginBottom={16}
            color={isDark ? COLORS.gray64 : colors.textSecondary}
          />
          {data?.map((item) => {
            const isSelected = selectedType === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedType(item.id)}
                style={[
                  styles.card,
                  {
                    backgroundColor: item.color,
                    borderColor: isSelected
                      ? isDark
                        ? COLORS.white
                        : colors.text
                      : "transparent",
                  },
                ]}
              >
                <CustomText
                  label={item.title}
                  fontFamily={fonts.semiBold}
                  fontSize={24}
                  lineHeight={24 * 1.4}
                  letterSpacing={-0.24}
                  color={COLORS.white}
                />
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
    height: 190,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
});
