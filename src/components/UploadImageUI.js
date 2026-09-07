import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomText from './CustomText';
import ImageFast from './ImageFast';

import {Images} from '../assets/images';
import {COLORS} from '../utils/COLORS';
import fonts from '../assets/fonts';

const UploadImageUI = ({
  onPress,
  image,
  marginBottom,
  marginTop,
  loading,
  error,
}) => {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || !onPress}
        style={[
          styles.upload,
          {
            marginTop,
            marginBottom: error ? 5 : marginBottom || 15,
            borderColor: error ? COLORS.red : COLORS.inputBg,
          },
        ]}
        activeOpacity={0.6}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} size={30} />
        ) : (
          <>
            {image ? (
              <ImageFast source={{uri: image}} style={styles.image} />
            ) : (
              <>
                <View style={styles.cameraContainer}>
                  <ImageFast
                    source={Images.camera}
                    style={styles.camera}
                    resizeMode="contain"
                  />
                </View>
                <CustomText
                  label="Upload Image"
                  fontFamily={fonts.medium}
                  fontSize={16}
                  marginTop={5}
                />
              </>
            )}
          </>
        )}
      </TouchableOpacity>
      {error && (
        <CustomText
          label={error}
          color={COLORS.red}
          fontFamily={fonts.semiBold}
          fontSize={10}
          marginBottom={15}
        />
      )}
    </>
  );
};

export default UploadImageUI;

const styles = StyleSheet.create({
  upload: {
    width: '100%',
    height: 125,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cameraContainer: {
    width: 46,
    height: 46,
    backgroundColor: COLORS.primaryColor,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: 26,
    height: 26,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
