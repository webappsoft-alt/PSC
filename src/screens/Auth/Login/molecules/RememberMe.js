import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';
import CustomText from '../../../../components/CustomText';
import fonts from '../../../../assets/fonts';
import CustomCheckbox from '../../../../components/CustomCheckBox';
import Text from "../../../../components/ScaledText";

const RememberMe = () => {
  const [isCheck, setCheck] = useState(false);
  return (
    <View style={styles.row}>
      <CustomCheckbox value={isCheck} onValueChange={setCheck} />
      <CustomText
        label="Remember me"
        fontFamily={fonts.semiBold}
        alignSelf="flex-end"
        fontSize={18}
      />
    </View>
  );
};

export default RememberMe;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
