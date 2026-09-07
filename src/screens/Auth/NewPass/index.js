import {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import ScreenWrapper from '../../../components/ScreenWrapper';
import SuccessModal from '../../../components/SuccessModal';
import CustomButton from '../../../components/CustomButton';
import CustomInput from '../../../components/CustomInput';
import ImageFast from '../../../components/ImageFast';
import DualText from '../../../components/DualText';
import Header from '../../../components/Header';

import {passwordRegex} from '../../../utils/constants';
import {post} from '../../../services/ApiRequest';
import {Images} from '../../../assets/images';

const NewPass = ({navigation, route}) => {
  const resetToken = route?.params?.token;
  const email = route?.params?.email;

  const [isModal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const init = {
    password: '',
    confirmPassword: '',
  };
  const inits = {
    passwordError: '',
    confirmPasswordError: '',
  };

  const [state, setState] = useState(init);
  const [errors, setErrors] = useState(inits);

  const array = [
    {
      id: 1,
      placeholder: 'Password',
      value: state.password,
      onChange: text => setState({...state, password: text}),
      error: errors?.passwordError,
      secureTextEntry: true,
    },
    {
      id: 2,
      placeholder: 'Confirm Password',
      value: state.confirmPassword,
      onChange: text => setState({...state, confirmPassword: text}),
      error: errors?.confirmPasswordError,
      secureTextEntry: true,
    },
  ];
  const errorCheck = useMemo(() => {
    return () => {
      let newErrors = {};
      if (!state.password) newErrors.passwordError = 'Please enter password';
      else if (!passwordRegex.test(state.password))
        newErrors.passwordError =
          'Password must contain 1 number, 1 special character, Uppercase and 8 digits';
      else if (!state.confirmPassword)
        newErrors.confirmPasswordError = 'Please enter confirm password';
      else if (!passwordRegex.test(state.confirmPassword))
        newErrors.confirmPasswordError =
          'Password must contain 1 number, 1 special character, Uppercase and 8 digits';
      else if (state.password !== state.confirmPassword)
        newErrors.confirmPasswordError = 'Password does not match';
      setErrors(newErrors);
    };
  }, [state]);

  useEffect(() => {
    errorCheck();
  }, [errorCheck]);

  const handleSetNewPassword = async () => {
    try {
      setLoading(true);
      const res = await post('auth/reset-password', {
        email,
        resetToken,
        newPassword: state.password,
      });
      setModal(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title="Create New Password" />}
      scrollEnabled
      footerUnScrollable={() => (
        <View style={{paddingHorizontal: 20}}>
          <CustomButton
            title="Reset Password"
            loading={loading}
            onPress={handleSetNewPassword}
            disabled={!Object.values(errors).every(error => error === '')}
          />
          <DualText
            title="Already have an account?"
            secondTitle=" Login"
            marginTop={16}
            marginBottom={20}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      )}>
      <ImageFast
        source={Images.createPass}
        style={styles.logo}
        resizeMode="contain"
      />

      {array?.map(item => (
        <CustomInput
          key={item?.id}
          placeholder={item.placeholder}
          value={item.value}
          onChangeText={item.onChange}
          error={item.error}
          secureTextEntry
        />
      ))}

      <SuccessModal
        source={Images.success2}
        isVisible={isModal}
        title="Congratulations!"
        desc="Your Password is Successfully Changed."
        setModal={setModal}
      />
    </ScreenWrapper>
  );
};

export default NewPass;
const styles = StyleSheet.create({
  logo: {
    width: '80%',
    height: 250,
    alignSelf: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
});
