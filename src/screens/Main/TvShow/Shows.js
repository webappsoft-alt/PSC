import { BlurView } from "@react-native-community/blur";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Images } from "../../../assets/images";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { COLORS } from "../../../utils/COLORS";

const Shows = () => {
  return (
    <ScreenWrapper
      paddingHorizontal={0}
      translucent
      statusBarColor="transparent"
    >
      <View style={styles.container}>
        <Image
          source={Images.tv}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor="black"
        />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icons
              family="MaterialCommunityIcons"
              name="lock"
              size={50}
              color={COLORS.white}
            />
          </View>

          <CustomText
            label="Coming Soon"
            fontSize={32}
            color={COLORS.white}
            fontWeight="bold"
            marginTop={24}
          />

          <CustomText
            label="This feature is under development."
            fontSize={16}
            color={COLORS.gray64}
            marginTop={12}
            style={{ opacity: 0.8 }}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
});

export default Shows;
