import { BlurView } from "@react-native-community/blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../assets/fonts";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS } from "../utils/COLORS";
import CustomText from "./CustomText";
import Icons from "./Icons";

/**
 * Floating bottom sheet — port of Viral's ProfileFloatingBottomSheet:
 * blurred dimmed backdrop (fade), card slides up.
 * Figma "Filters-Sorting" inspect: outer 351 hug, r32, pad 4, fill white 16%,
 * 1px inside stroke white 16%, background blur; inner fill #121212, r28,
 * pad 12, vertical gap 20. Title SemiBold 24 −0.5, subtitle Regular 14 @64%,
 * 32px close circle.
 */
const SCREEN_HEIGHT = Dimensions.get("window").height;

const FloatingSheet = ({ visible, onDismiss, title, subtitle, children }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);
  const slide = useRef(new Animated.Value(visible ? 0 : SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slide.setValue(SCREEN_HEIGHT);
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
      return;
    }
    Animated.timing(slide, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setModalVisible(false);
    });
  }, [visible, slide]);

  return (
    <Modal
      visible={modalVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={8}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.6)"
        />
        <View style={styles.dim} pointerEvents="none" />
        <TouchableWithoutFeedback onPress={onDismiss}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.wrapper,
                  {
                    marginBottom: Math.max(insets.bottom, 16) + 16,
                    transform: [{ translateY: slide }],
                  },
                ]}
              >
                <View style={styles.glass}>
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType="dark"
                    blurAmount={6}
                    reducedTransparencyFallbackColor="#2A2A2A"
                  />
                  <View
                    style={[styles.inner, { backgroundColor: colors.background }]}
                  >
                    <View>
                      <View style={styles.header}>
                        <CustomText
                          label={title}
                          fontSize={24}
                          lineHeight={30}
                          letterSpacing={-0.5}
                          fontFamily={fonts.semiBold}
                          color={colors.text}
                        />
                        <TouchableOpacity
                          onPress={onDismiss}
                          activeOpacity={0.7}
                          style={[
                            styles.close,
                            { backgroundColor: colors.surfaceAlt },
                          ]}
                        >
                          <Icons
                            family="MaterialSymbolsRounded"
                            name="close"
                            size={18}
                            color={colors.text}
                          />
                        </TouchableOpacity>
                      </View>
                      {subtitle ? (
                        <CustomText
                          label={subtitle}
                          fontSize={14}
                          lineHeight={20}
                          letterSpacing={-0.2}
                          color={COLORS.gray64}
                        />
                      ) : null}
                    </View>
                    {children}
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

/** Figma sheet footer: Reset All (white 4%) + Confirm (white), h48 r100. */
export const SheetActions = ({ onReset, onConfirm, confirmLabel = "Confirm" }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.actions}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onReset}
        style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]}
      >
        <CustomText
          label="Reset All"
          fontSize={16}
          fontFamily={fonts.medium}
          color={colors.text}
        />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onConfirm}
        style={[styles.actionBtn, { backgroundColor: COLORS.white }]}
      >
        <CustomText
          label={confirmLabel}
          fontSize={16}
          fontFamily={fonts.medium}
          color="#121212"
        />
      </TouchableOpacity>
    </View>
  );
};

/** Figma section label, e.g. "SORTING BY", "SPONSORS". */
export const SheetSectionLabel = ({ label }) => (
  <CustomText
    label={label}
    fontSize={14}
    lineHeight={20}
    letterSpacing={-0.2}
    fontFamily={fonts.regular}
    color={COLORS.gray64}
    marginBottom={4}
  />
);

export default FloatingSheet;

const styles = StyleSheet.create({
  root: { flex: 1 },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  overlay: { flex: 1, justifyContent: "flex-end" },
  wrapper: { marginHorizontal: 12, borderRadius: 32, overflow: "hidden" },
  glass: {
    padding: 4,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  inner: {
    borderRadius: 28,
    overflow: "hidden",
    padding: 12,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
