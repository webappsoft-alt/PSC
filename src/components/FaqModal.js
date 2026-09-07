import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { BlurView } from "@react-native-community/blur";
import React, { useState, useEffect } from "react";

import CustomButton from "./CustomButton";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import CustomInput from "./CustomInput";

import { PNGIcons } from "../assets/images/icons";
import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const FaqModal = ({
  isVisible,
  onDisable,
  loading,
  title,
  subtitle,
  btnOne,
  btnTwo,
  onBtnOne,
  editingFaq,
  isEditMode,
}) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (editingFaq && isEditMode) {
      setQuestion(editingFaq.question || "");
      setAnswer(editingFaq.answer || "");
    } else {
      setQuestion("");
      setAnswer("");
    }
  }, [editingFaq, isEditMode, isVisible]);

  const handleSubmit = () => {
    if (question.trim() && answer.trim()) {
      onBtnOne(question.trim(), answer.trim());
    }
  };

  return (
    <CustomModal isChange isVisible={isVisible} onDisable={onDisable}>
      <View
        style={{
          padding: 5,
          width: "95%",
          alignSelf: "center",
          borderRadius: 24,
          marginBottom: 12,
          maxHeight: "100%",
          borderWidth: 1,
          backgroundColor: "#FFFFFF29",
          borderColor: "rgba(255, 255, 255, 0.16)",
        }}
      >
        <BlurView
          style={{
            maxHeight: "100%",
            width: "100%",
            borderRadius: 24,
          }}
          blurType="light"
          blurAmount={26}
          reducedTransparencyFallbackColor="#FFFFFF29"
        />

        <View style={styles.mainContainer}>
          <View style={styles.row}>
            <CustomText
              label={title || "Add Faq"}
              fontFamily={fonts.semiBold}
              fontSize={24}
            />
            <TouchableOpacity
              onPress={onDisable}
              style={{
                height: 32,
                width: 32,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: COLORS.lightGray,
              }}
            >
              <Image source={PNGIcons.cross} style={styles.icon} />
            </TouchableOpacity>
          </View>

          <CustomText
            label={subtitle || "Enter the question and answer for your FAQ."}
            fontFamily={fonts.medium}
            color={COLORS.gray1}
            marginTop={8}
          />

          {/* Question Input */}
          <View style={styles.inputContainer}>
            <CustomText
              label="Question"
              fontFamily={fonts.medium}
              fontSize={16}
              marginTop={16}
              marginBottom={8}
            />
            <CustomInput
              placeholder="Enter your question"
              value={question}
              onChangeText={setQuestion}
              cardInfo={`Maximum characters ${question?.length || 0}/100`}
            />
          </View>

          {/* Answer Input */}
          <View style={styles.inputContainer}>
            <CustomText
              label="Answer"
              fontFamily={fonts.medium}
              fontSize={16}
              marginTop={16}
              marginBottom={8}
            />
            <CustomInput
              placeholder="Enter your answer"
              value={answer}
              onChangeText={setAnswer}
              multiline
              height={120}
              cardInfo={`Maximum characters ${answer?.length || 0}/500`}
            />
          </View>

          <View>
            <CustomButton
              title={btnOne || "Get Started"}
              marginTop={24}
              onPress={handleSubmit}
              marginBottom={4}
              loading={loading}
              disabled={!question.trim() || !answer.trim()}
            />
            <CustomButton
              title={btnTwo || "Cancel"}
              backgroundColor={COLORS.lightGray}
              onPress={onDisable}
              color={COLORS.black}
            />
          </View>
        </View>
      </View>
    </CustomModal>
  );
};

export default FaqModal;

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
  },
  icon: {
    height: 16,
    width: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputContainer: {
    marginTop: 8,
  },
});
