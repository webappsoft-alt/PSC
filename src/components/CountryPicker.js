import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import CountryBottomSheet from "./CountryBottomSheet";
import CustomText from "./CustomText";
import Icons from "./Icons";

import { COLORS } from "../utils/COLORS";
import fonts from "../assets/fonts";

const CountryPicker = ({
  selectedCountry,
  onCountrySelect,
  error,
  label = "Registered In",
  placeholder = "Select country",
}) => {
  const [showCountrySheet, setShowCountrySheet] = useState(false);

  const handleCountrySelect = (country) => {
    onCountrySelect(country);
    setShowCountrySheet(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.countrySelector,
          error && { borderColor: COLORS.red, borderWidth: 1 },
        ]}
        onPress={() => setShowCountrySheet(true)}
        activeOpacity={0.7}
      >
        <View>
          <CustomText
            label={label}
            fontSize={12}
            lineHeight={12 * 1.4}
            color={
              selectedCountry?.label || selectedCountry?.name
                ? COLORS.black
                : COLORS.inputLabel
            }
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {selectedCountry && (
              <Image
                source={{
                  uri: `https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`,
                }}
                style={{
                  height: 20,
                  width: 20,
                  marginRight: 10,
                  borderRadius: 4,
                }}
                resizeMode="contain"
              />
            )}

            <View>
              <CustomText
                label={
                  selectedCountry?.label || selectedCountry?.name
                    ? selectedCountry?.label || selectedCountry?.name
                    : placeholder
                }
                color={
                  selectedCountry?.label || selectedCountry?.name
                    ? COLORS.black
                    : COLORS.inputLabel
                }
                fontSize={16}
                fontFamily={fonts.medium}
              />
            </View>
          </View>
        </View>

        <Icons
          style={{ color: COLORS.black, fontSize: 20 }}
          family="Entypo"
          name="chevron-down"
        />
      </TouchableOpacity>

      <CountryBottomSheet
        isVisible={showCountrySheet}
        onClose={() => setShowCountrySheet(false)}
        selectedCountry={selectedCountry}
        onCountrySelect={handleCountrySelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});

export default CountryPicker;
