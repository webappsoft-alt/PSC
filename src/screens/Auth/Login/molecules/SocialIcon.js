import React from 'react';
import {
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  View,
} from 'react-native';

import CustomText from '../../../../components/CustomText';

import {Images} from '../../../../assets/images';
import {COLORS} from '../../../../utils/COLORS';
import fonts from '../../../../assets/fonts';

const SocialIcon = ({
  googlePress,
  applePress,
  indicatorColor,
  googleLoading,
  appleLoading,
  isRow,
}) => {
  const array = [
    {
      id: 1,
      img: Images.facebook,
      title: 'Continue with Facebook',
      onPress: googlePress,
      loading: googleLoading,
    },
    {
      id: 2,
      img: Images.google,
      title: 'Continue with Google',
      onPress: googlePress,
      loading: googleLoading,
    },
    {
      id: 3,
      img: Images.apple,
      title: 'Login with Apple',
      onPress: applePress,
      loading: appleLoading,
    },
  ];

  return (
    <View style={isRow ? styles.mainContainer : {}}>
      {array?.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.item, {width: isRow ? '30%' : '100%'}]}
          onPress={item.onPress}>
          {item?.loading ? (
            <ActivityIndicator
              size={25}
              color={indicatorColor ? COLORS.primaryColor : COLORS.white}
            />
          ) : (
            <>
              <Image source={item.img} style={styles.icon} />
              {isRow ? null : (
                <CustomText
                  label={item.title}
                  fontSize={16}
                  marginLeft={10}
                  fontFamily={fonts.semiBold}
                  color={COLORS.white}
                />
              )}
            </>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default SocialIcon;

const styles = StyleSheet.create({
  mainContainer: {
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  item: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
