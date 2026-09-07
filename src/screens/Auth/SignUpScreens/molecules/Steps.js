import {StyleSheet, View} from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";
import Text from "../../../../components/ScaledText";

const Steps = ({ index, array }) => {
  return (
    <>
      {array.map((item, i) => (
        <View key={item?.id} style={styles.stepContainer}>
          <View
            style={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.step,
                  {
                    backgroundColor:
                      i < index ? COLORS.primaryColor : "#F2F2F2",
                  },
                ]}
              >
                <CustomText
                  label={item?.num}
                  fontSize={12}
                  color={i < index ? COLORS.white : COLORS.black}
                  fontFamily={fonts.bold}
                />
              </View>
            </View>
            <CustomText
              label={item?.name}
              fontSize={12}
              color={i < index ? COLORS.black : COLORS.primaryColor}
              fontFamily={fonts.regular}
              marginTop={5}
            />
          </View>
        </View>
      ))}
    </>
  );
};

export default Steps;

const styles = StyleSheet.create({
  step: {
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    width: 42,
    height: 42,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  dotedLine: {
    height: 1,
    borderWidth: 0.7,
    borderStyle: "dotted",
    // width: 100,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
