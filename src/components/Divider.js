import { View } from "react-native";

import { COLORS } from "../utils/COLORS";
import { useTheme } from "../contexts/ThemeContext";

const Divider = ({
  color,
  thickness = 2,
  marginVertical = 12,
  width = "100%",
  marginBottom,
  marginTop,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: color || colors.surfaceAlt || COLORS.inputBg,
        height: thickness,
        marginVertical,
        width: width,
        marginBottom,
        marginTop,
      }}
    />
  );
};

export default Divider;
