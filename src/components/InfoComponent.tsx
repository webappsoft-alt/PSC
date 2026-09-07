import React from "react";
import { View } from "react-native";

import CustomText from "./CustomText";
import Icons from "./Icons";
import { COLORS } from "../utils/COLORS";

interface InfoComponentProps {
  text?: string;
  children?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
  isError?: boolean;
  isSuccess?: boolean;
  color?: string;
  paddingRight?: number;
}
const InfoComponent = ({
  text,
  children,
  marginBottom,
  marginTop,
  isError,
  color,
  isSuccess,
  paddingRight = 12,
}: InfoComponentProps) => {
  const theme =  COLORS.black; 
  const hasCustomBody = children != null;
  const iconColor = color
    ? color
    : isError
      ? COLORS.error
      : isSuccess
        ? COLORS.success
        : theme.textSecondary;
  const textColor = color
    ? color
    : isError
      ? COLORS.error
      : isSuccess
        ? COLORS.success
        : theme.textSecondary;

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 6,
        marginBottom,
        marginTop,
        paddingRight,
      }}
    >
      <Icons
        family={isError ? "Entypo" : isSuccess ? "Octicons" : "MaterialIcons"}
        name={
          isError
            ? "circle-with-cross"
            : isSuccess
              ? "check-circle-fill"
              : "info-outline"
        }
        color={iconColor}
        size={12}
        style={{ marginTop: 2.4 }}
      />
      {hasCustomBody ? (
        <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
      ) : (
        <CustomText label={text} fontSize={12} color={textColor} />
      )}
    </View>
  );
};

export default InfoComponent;
