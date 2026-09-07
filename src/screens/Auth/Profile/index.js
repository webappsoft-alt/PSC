import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect, useState} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  View,
} from 'react-native';

import ScreenWrapper from '../../../components/ScreenWrapper';
import CustomButton from '../../../components/CustomButton';
import UploadImage from '../../../components/UploadImage';
import CustomInput from '../../../components/CustomInput';
import ImageFast from '../../../components/ImageFast';
import Header from '../../../components/Header';
import Icons from '../../../components/Icons';

import {ToastMessage} from '../../../utils/ToastMessage';
import {post} from '../../../services/ApiRequest';
import {Images} from '../../../assets/images';
import {COLORS} from '../../../utils/COLORS';
import {useTheme} from '../../../contexts/ThemeContext';

const Profile = ({navigation, route}) => {
  const { colors, isDark } = useTheme();
  const keyboardHeight = new Animated.Value(0);
  const signupData = route.params?.signupData;

  const [name, setName] = useState('');
  const [profile, setProfile] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', event => {
      Animated.timing(keyboardHeight, {
        duration: event.duration,
        toValue: event.endCoordinates.height,
        useNativeDriver: false,
      }).start();
    });
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', event => {
      Animated.timing(keyboardHeight, {
        duration: event.duration,
        toValue: 0,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleContinue = async () => {
    const fcmtoken = await AsyncStorage.getItem('fcmToken');
    setLoading(true);
    try {
      const response = await post('auth/check-username', {username: name});

      if (response?.data?.available) {
        const res = await post('auth/send-signup-otp', {
          ...signupData,
          username: name,
        });
        console.log('=============res', res.data);

        if (res?.data) {
          navigation.navigate('OTPScreen', {
            isAccountCreated: false,
            signupData: {...signupData, username: name},
          });
        }
      } else {
        ToastMessage('User Name is already taken', 'error');
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  return (
    <ScreenWrapper
      scrollEnabled
      footerUnScrollable={() => (
        <Animated.View
          style={{marginBottom: keyboardHeight, paddingHorizontal: 20}}>
          <CustomButton
            title="Continue"
            marginBottom={30}
            disabled={!name}
            loading={loading}
            onPress={handleContinue}
          />
        </Animated.View>
      )}
      headerUnScrollable={() => <Header title="Fill Your Profile" />}>
      <View style={styles.profileContainer}>
        <ImageFast
          source={profile ? {uri: profile} : Images.placeholderUser}
          style={styles.profile}
        />
        <UploadImage
          handleChange={img => setProfile(img.path)}
          renderButton={onPress => (
            <TouchableOpacity
              onPress={onPress}
              style={[styles.edit, { backgroundColor: isDark ? COLORS.primaryColor : colors.text }]}
              activeOpacity={0.6}>
              <Icons
                family="MaterialIcons"
                name="edit"
                color={isDark ? COLORS.white : colors.background}
                size={18}
              />
            </TouchableOpacity>
          )}
        />
      </View>

      <CustomInput
        withLabel="User Name"
        placeholder="Enter"
        value={name}
        onChangeText={setName}
        error={!name ? 'Please Enter User Name' : false}
      />
    </ScreenWrapper>
  );
};

export default Profile;
const styles = StyleSheet.create({
  profileContainer: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  profile: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  edit: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: COLORS.primaryColor,
    right: 8,
    position: 'absolute',
    bottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
