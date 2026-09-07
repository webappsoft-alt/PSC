import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  View,
} from "react-native";

import { Images } from "../../../../assets/images";
import { COLORS } from "../../../../utils/COLORS";
import fonts from "../../../../assets/fonts";

const Footer = ({ inputText, setInputText, sendMessage, pad }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <View
      style={[
        styles.mainContainer,
        pad
          ? { padding: 20, paddingBottom: 0 }
          : { padding: 20, paddingBottom: 30 },
      ]}
    >
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder="Type your message"
          placeholderTextColor="#818898"
          value={inputText}
          multiline
          textAlignVertical="top"
          onChangeText={(text) => setInputText(text)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <TouchableOpacity disabled={!inputText} onPress={sendMessage}>
          <Image
            source={Images.send}
            style={[
              styles.send,
              {
                tintColor: !inputText ? "#A4ACB9" : COLORS.black,
              },
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Footer;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    width: "100%",
    backgroundColor: "#F6F8FA",
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#F6F8FA",
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: COLORS.primaryColor,
    borderWidth: 1,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    padding: 0,
    margin: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: COLORS.black,
    maxHeight: 100,
  },
  inputFocused: {
    color: COLORS.black,
  },
  send: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
});
