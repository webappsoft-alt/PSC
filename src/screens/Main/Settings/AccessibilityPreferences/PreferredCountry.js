import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Divider from "../../../../components/Divider";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import ToggleCard from "../molecules/ToggleCard";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const POPULAR_COUNTRIES = [
  { id: "1", name: "United States of America", subtitle: "🇺🇸 USD ($)" },
  { id: "2", name: "United Kingdom", subtitle: "🇬🇧 GBP (£)" },
  { id: "3", name: "Canada", subtitle: "🇨🇦 CAD ($)" },
  { id: "4", name: "Australia", subtitle: "🇦🇺 AUD ($)" },
  { id: "5", name: "Switzerland", subtitle: "🇨🇭 CHF (Fr)" },
  { id: "6", name: "Germany", subtitle: "🇩🇪 EUR (€)" },
  { id: "7", name: "France", subtitle: "🇫🇷 EUR (€)" },
  { id: "8", name: "United Arab Emirates", subtitle: "🇦🇪 AED (د.إ)" },
  { id: "9", name: "Saudi Arabia", subtitle: "🇸🇦 SAR (﷼)" },
  { id: "10", name: "Pakistan", subtitle: "🇵🇰 PKR (₨)" },
  { id: "11", name: "India", subtitle: "🇮🇳 INR (₹)" },
  { id: "12", name: "China", subtitle: "🇨🇳 CNY (¥)" },
  { id: "13", name: "Japan", subtitle: "🇯🇵 JPY (¥)" },
  { id: "14", name: "Singapore", subtitle: "🇸🇬 SGD ($)" },
  { id: "15", name: "Brazil", subtitle: "🇧🇷 BRL (R$)" },
  { id: "16", name: "Mexico", subtitle: "🇲🇽 MXN ($)" },
  { id: "17", name: "Spain", subtitle: "🇪🇸 EUR (€)" },
  { id: "18", name: "Italy", subtitle: "🇮🇹 EUR (€)" },
  { id: "19", name: "Turkey", subtitle: "🇹🇷 TRY (₺)" },
  { id: "20", name: "South Africa", subtitle: "🇿🇦 ZAR (R)" },
];

const PreferredCountry = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedCountry, setSelectedCountry] = useState("United States of America");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.profile?.prefferedCountry) {
      setSelectedCountry(userData.profile.prefferedCountry);
    } else if (userData?.profile?.country) {
      setSelectedCountry(userData.profile.country);
    }
  }, [userData]);

  const handleCountryChange = async (countryName) => {
    if (loading || selectedCountry === countryName) return;
    setSelectedCountry(countryName);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { prefferedCountry: countryName },
      "Preferred country updated successfully"
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Preferred Country"} />}
      scrollEnabled={true}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      {POPULAR_COUNTRIES.map((item, index) => (
        <ToggleCard
          key={item.id}
          title={item.name}
          subtitle={item.subtitle}
          value={selectedCountry === item.name}
          onPress={() => handleCountryChange(item.name)}
          isBorder={true}
          isOption={true}
          marginBottom={index === POPULAR_COUNTRIES.length - 1 ? 40 : 0}
        />
      ))}
    </ScreenWrapper>
  );
};

export default PreferredCountry;

const styles = StyleSheet.create({});
