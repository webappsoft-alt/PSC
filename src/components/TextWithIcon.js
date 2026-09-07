import {StyleSheet, View} from 'react-native';
import React from 'react';
import CustomText from './CustomText';
import fonts from '../assets/fonts';
import Icons from './Icons';
import {COLORS} from '../utils/COLORS';
import Text from "./ScaledText";

const TextWithIcon = ({
  title,
  marginBottom,
  marginTop,
  onPress,
  paddingRight,
}) => {
  return (
    <View
      style={[styles.mainContainer, {marginBottom, marginTop, paddingRight}]}>
      <CustomText label={title} fontFamily={fonts.bold} fontSize={19} />
      <Icons
        family="AntDesign"
        name="arrowright"
        size={22}
        color={COLORS.white}
        onPress={onPress}
      />
    </View>
  );
};

export default TextWithIcon;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
