import { BlurView } from "@react-native-community/blur";
import { useEffect } from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import ReactNativeModal from "react-native-modal";

const CustomModal = ({
  isVisible,
  transparent = true,
  onDisable,
  backdropOpacity = 0.76,
  mainMargin,
  marginTop,
  marginBottom,
  marginVertical,
  marginHorizontal,
  borderRadius,
  overflow,
  children,
  isChange,
  paddingBottom,
  animationIn,
  animationOut,
  swipeDirection,
  animationInTiming,
  animationOutTiming,
  isTop,
  isBlur = false,
  blurType = "dark",
  blurAmount = 4,
  hasBackdrop = true,
  useNativeDriver = true,
  propagateSwipe = false,
  blurColor,
  backdropColor,
  staticBlurBackdrop = false,
  customBackdrop,
}) => {
  useEffect(() => {
    let backHandler;

    if (isVisible) {
      backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (onDisable) {
          onDisable();
          return true;
        }
        return false;
      });
    }
    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [isVisible, onDisable]);

  // Default animation configurations based on modal type
  const getDefaultAnimations = () => {
    if (isChange) {
      return {
        animationIn: "slideInUp",
        animationOut: "slideOutDown",
        timing: 400,
      };
    }
    if (isTop) {
      return {
        animationIn: "slideInDown",
        animationOut: "slideOutUp",
        timing: 300,
      };
    }
    return {
      animationIn: "fadeIn",
      animationOut: "fadeOut",
      timing: 250,
    };
  };

  const defaultAnimations = getDefaultAnimations();

  return (
    <ReactNativeModal
      isVisible={isVisible}
      animationIn={animationIn || defaultAnimations.animationIn}
      animationOut={animationOut || defaultAnimations.animationOut}
      swipeDirection={swipeDirection}
      transparent={transparent}
      onBackdropPress={onDisable}
      onBackButtonPress={onDisable}
      animationInTiming={animationInTiming || defaultAnimations.timing}
      animationOutTiming={animationOutTiming || defaultAnimations.timing}
      onDismiss={onDisable}
      backdropOpacity={isBlur ? 0 : backdropOpacity}
      backdropColor={backdropColor}
      hasBackdrop={hasBackdrop}
      useNativeDriver={useNativeDriver}
      propagateSwipe={propagateSwipe}
      backdropTransitionInTiming={0.1}
      backdropTransitionOutTiming={0.1}
      customBackdrop={
        customBackdrop ||
        (isBlur && staticBlurBackdrop ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={onDisable}
            style={StyleSheet.absoluteFill}
          >
            <BlurView
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              blurType={blurType}
              blurAmount={blurAmount}
              reducedTransparencyFallbackColor={
                blurColor || "rgba(0,0,0,0.1)"
              }
            />
            <View pointerEvents="none" style={styles.backdropDim} />
          </TouchableOpacity>
        ) : undefined)
      }
      style={[
        styles.modalStyle,
        {
          margin: mainMargin,
          marginTop,
          marginBottom,
          marginVertical,
          marginHorizontal,
          borderRadius,
          overflow,
        },
      ]}
    >
      {isBlur && !staticBlurBackdrop && (
        <BlurView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          blurType={blurType}
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor={blurColor || "rgba(0,0,0,0.1)"}
        />
      )}
      <TouchableOpacity
        style={
          isChange
            ? [
                styles.mainContainer1,
                {
                  paddingBottom:
                    paddingBottom || Platform.OS == "android" ? 0 : 15,
                },
              ]
            : isTop
            ? styles.mainContainer2
            : styles.mainContainer
        }
        activeOpacity={1}
        onPress={onDisable}
      >
        <TouchableOpacity
          style={styles.container}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </ReactNativeModal>
  );
};

export default CustomModal;

const styles = StyleSheet.create({
  modalStyle: {
    margin: 0,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  mainContainer: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer1: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  mainContainer2: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  container: {
    width: "100%",
  },
});

// Usage Examples:

// 1. Center Modal with Fade Animation
// <CustomModal isVisible={isVisible} onDisable={() => setIsVisible(false)}>
//   <View style={{backgroundColor: 'white', padding: 20, borderRadius: 10}}>
//     <Text>Center Modal Content</Text>
//   </View>
// </CustomModal>

// 2. Bottom Sheet Modal
// <CustomModal
//   isVisible={isVisible}
//   onDisable={() => setIsVisible(false)}
//   isChange={true}
// >
//   <View style={{backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
//     <Text>Bottom Sheet Content</Text>
//   </View>
// </CustomModal>

// 3. Top Modal with Blur
// <CustomModal
//   isVisible={isVisible}
//   onDisable={() => setIsVisible(false)}
//   isTop={true}
//   isBlur={true}
//   blurAmount={20}
// >
//   <View style={{backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10}}>
//     <Text>Top Modal with Blur</Text>
//   </View>
// </CustomModal>

// 4. Custom Animation Modal
// <CustomModal
//   isVisible={isVisible}
//   onDisable={() => setIsVisible(false)}
//   animationIn="bounceIn"
//   animationOut="bounceOut"
//   animationInTiming={800}
//   animationOutTiming={600}
// >
//   <View style={{backgroundColor: 'white', padding: 20, borderRadius: 10}}>
//     <Text>Custom Animation Modal</Text>
//   </View>
// </CustomModal>
