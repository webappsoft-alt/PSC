import {Platform, StyleSheet} from 'react-native';
import React from 'react';

import CustomText from './CustomText';

import fonts from '../assets/fonts';
import {COLORS} from '../utils/COLORS';
import {useTheme} from '../contexts/ThemeContext';

const DualText = ({title, secondTitle, marginBottom, marginTop, onPress}) => {
  const { colors, isDark } = useTheme();
  return (
    <CustomText
      color={isDark ? COLORS.white : colors.text}
      alignSelf="center"
      marginTop={marginTop}
      marginBottom={marginBottom}
      fontSize={12}
      label={title}>
      <CustomText
        label={secondTitle}
        color={isDark ? COLORS.white : colors.text}
        onPress={onPress}
        fontFamily={fonts.semiBold}
        fontSize={16}
        marginLeft={4}
        marginBottom={Platform.OS == 'android' ? -10 : -4}
      />
    </CustomText>
  );
};

export default DualText;

const styles = StyleSheet.create({});
