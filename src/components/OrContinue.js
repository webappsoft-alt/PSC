import {StyleSheet, View} from 'react-native';
import React from 'react';
import CustomText from './CustomText';
import {COLORS} from '../utils/COLORS';
import fonts from '../assets/fonts';
import Text from "./ScaledText";

const OrContinue = ({title, marginBottom, marginTop}) => {
  return (
    <View style={[styles.mainContainer, {marginTop, marginBottom}]}>
      <View style={styles.border} />
      <CustomText
        label={title}
        marginLeft={10}
        marginRight={10}
        color={COLORS.white}
        fontSize={18}
        fontFamily={fonts.semiBold}
      />
      <View style={styles.border} />
    </View>
  );
};

export default OrContinue;

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  border: {
    height: 2,
    flex: 1,
    backgroundColor: '#35383F',
  },
});
