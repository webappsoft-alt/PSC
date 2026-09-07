import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import fonts from "../assets/fonts";
import { COLORS } from "../utils/COLORS";
import { COUNTRIES } from "../utils/constants";
import CustomInput from "./CustomInput";
import CustomText from "./CustomText";
import Icons from "./Icons";

const { height } = Dimensions.get("window");

const CountryBottomSheet = ({
  visible,
  onClose,
  selectedCountry,
  onSelectCountry,
}) => {
  const translateY = useRef(new Animated.Value(height)).current;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = COUNTRIES.filter((country) =>
    country.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: height * 0.25,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                transform: [{ translateY }],
                alignSelf: "center",
                width: "95%",
              }}
            >
              <View
                style={{
                  padding: 5,
                  borderRadius: 32,
                  borderWidth: 1,
                  backgroundColor: "#FFFFFF29",
                  borderColor: "rgba(255, 255, 255, 0.16)",
                }}
              >
                <BlurView
                  style={{
                    width: "100%",
                    borderRadius: 24,
                  }}
                  blurType="light"
                  blurAmount={26}
                  reducedTransparencyFallbackColor="#FFFFFF29"
                />
                <View
                  style={{
                    backgroundColor: "white",
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 30,
                    paddingTop: 20,
                    paddingHorizontal: 20,
                    paddingBottom: 40,
                  }}
                >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <CustomText
                  label={"Country"}
                  fontSize={20}
                  fontFamily={fonts.semiBold}
                  lineHeight={20 * 1.4}
                />
                <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                  <Icons
                    name="close"
                    family="Ionicons"
                    size={24}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>

              <CustomInput
                placeholder="Search country..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              <ScrollView style={{ gap: 16, minHeight: 400 }}>
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <TouchableOpacity
                      key={country.code}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        marginTop: 8,
                        paddingVertical: 16,
                        borderRadius: 12,
                        backgroundColor:
                          selectedCountry?.code == country.code
                            ? COLORS.darkPurple
                            : "#f3f4f6",
                      }}
                      onPress={() => {
                        onSelectCountry(country);
                        onClose();
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Image
                          style={{ height: 20, width: 20, borderRadius: 4 }}
                          source={{
                            uri: `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`,
                          }}
                          resizeMode="contain"
                        />
                        <CustomText
                          label={country.label}
                          fontWeight="500"
                          color={
                            selectedCountry?.code == country.code
                              ? "#ffffff"
                              : "#000000"
                          }
                        />
                      </View>
                      {selectedCountry?.code == country.code && (
                        <Icons
                          name="checkmark"
                          family="Ionicons"
                          size={24}
                          color="#000"
                        />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <CustomText
                    label="No countries found"
                    textAlign="center"
                    color="#6b7280"
                    marginTop={20}
                  />
                )}
              </ScrollView>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CountryBottomSheet;
