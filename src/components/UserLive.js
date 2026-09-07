import {StyleSheet, TouchableOpacity, View} from 'react-native';

import CustomText from './CustomText';
import ImageFast from './ImageFast';

import {Images} from '../assets/images';
import {COLORS} from '../utils/COLORS';
import fonts from '../assets/fonts';

const UserLive = ({
  isLive,
  source,
  marginRight = 10,
  borderColor,
  onPress,
  data,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={[
        styles.mainContainer,
        {
          marginRight,
          borderColor: isLive ? COLORS.red : borderColor || COLORS.primaryColor,
        },
      ]}>
      <ImageFast
        source={data?.profile ? {uri: data?.profile} : Images.placeholderUser}
        style={styles.user}
      />
      {isLive ? (
        <View style={styles.live}>
          <CustomText label="LIVE" fontFamily={fonts.semiBold} fontSize={9} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export default UserLive;

const styles = StyleSheet.create({
  mainContainer: {
    width: 72,
    height: 72,
    borderRadius: 100,
    borderWidth: 2,
    marginBottom: 25,
  },
  user: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  live: {
    width: 36,
    height: 21,
    borderRadius: 5.5,
    backgroundColor: '#C22920',
    position: 'absolute',
    alignSelf: 'center',
    bottom: -10,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
