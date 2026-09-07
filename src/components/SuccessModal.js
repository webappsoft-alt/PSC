import {useNavigation} from '@react-navigation/native';
import {StyleSheet, View} from 'react-native';

import CustomButton from './CustomButton';
import CustomModal from './CustomModal';
import CustomText from './CustomText';
import ImageFast from './ImageFast';

import {Images} from '../assets/images';
import {COLORS} from '../utils/COLORS';
import fonts from '../assets/fonts';
import {useTheme} from '../contexts/ThemeContext';

const SuccessModal = ({
  isVisible,
  setModal,
  title,
  desc,
  buttonTitle,
  onPress,
  source,
}) => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  return (
    <CustomModal isVisible={isVisible}>
      <View style={[styles.mainContainer, { backgroundColor: isDark ? COLORS.bg : colors.background }]}>
        <ImageFast
          source={source || Images.check}
          style={styles.img}
          resizeMode="contain"
        />
        <CustomText
          label={title}
          fontFamily={fonts.bold}
          fontSize={26}
          marginBottom={15}
          textAlign="center"
        />
        <CustomText
          label={desc}
          fontSize={16}
          textAlign="center"
          marginBottom={20}
          lineHeight={22}
        />
        <CustomButton
          title={buttonTitle || 'Go to Login'}
          onPress={
            onPress
              ? onPress
              : () => {
                  setModal(false);
                  setTimeout(() => {
                    navigation.navigate('Login');
                  }, 100);
                }
          }
        />
      </View>
    </CustomModal>
  );
};

export default SuccessModal;

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: COLORS.bg,
    padding: 25,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  img: {
    width: 185,
    height: 185,
    marginBottom: 30,
  },
});
