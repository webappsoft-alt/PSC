import { StyleSheet } from "react-native";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import Header from "../../../../components/Header";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";
import Divider from "../../../../components/Divider";
import { updateProfilePreference } from "../../../../utils/updateProfilePreference";

const languages = [
  { id: "1", code: "en", name: "🇺🇸 English", subtitle: "English - Global language" },
  { id: "2", code: "zh", name: "🇨🇳 Mandarin Chinese", subtitle: "中文 - Most spoken language" },
  { id: "3", code: "hi", name: "🇮🇳 Hindi", subtitle: "हिन्दी - Official language of India" },
  { id: "4", code: "es", name: "🇪🇸 Spanish", subtitle: "Español - Widely spoken in Americas" },
  { id: "5", code: "fr", name: "French", subtitle: "Français - Official language in 29 countries" },
  { id: "6", code: "ar", name: "Arabic", subtitle: "العربية - Spoken across Middle East" },
  { id: "7", code: "bn", name: "Bengali", subtitle: "বাংলা - Spoken in Bangladesh and India" },
  { id: "8", code: "ru", name: "Russian", subtitle: "Русский - Official language of Russia" },
  { id: "9", code: "pt", name: "Portuguese", subtitle: "Português - Spoken in Brazil and Portugal" },
  { id: "10", code: "id", name: "Indonesian", subtitle: "Bahasa Indonesia - Official language of Indonesia" },
  { id: "11", code: "ur", name: "Urdu", subtitle: "اردو - Official language of Pakistan" },
  { id: "12", code: "de", name: "German", subtitle: "Deutsch - Official language of Germany" },
  { id: "13", code: "ja", name: "Japanese", subtitle: "日本語 - Official language of Japan" },
  { id: "14", code: "sw", name: "Swahili", subtitle: "Kiswahili - Widely spoken in East Africa" },
  { id: "15", code: "mr", name: "Marathi", subtitle: "मराठी - Spoken in Maharashtra, India" },
  { id: "16", code: "te", name: "Telugu", subtitle: "తెలుగు - Spoken in South India" },
  { id: "17", code: "tr", name: "Turkish", subtitle: "Türkçe - Official language of Turkey" },
  { id: "18", code: "ko", name: "Korean", subtitle: "한국어 - Official language of Korea" },
  { id: "19", code: "ta", name: "Tamil", subtitle: "தமிழ் - Spoken in Tamil Nadu and Sri Lanka" },
  { id: "20", code: "vi", name: "Vietnamese", subtitle: "Tiếng Việt - Official language of Vietnam" },
];

const Language = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [selectedLanguage, setSelectedLanguage] = useState("🇺🇸 English");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData?.profile?.language) {
      const storedLang = userData.profile.language;
      const matched = languages.find(
        (l) => l.code === storedLang || l.name === storedLang || l.name.includes(storedLang)
      );
      if (matched) {
        setSelectedLanguage(matched.name);
      } else {
        setSelectedLanguage(storedLang);
      }
    }
  }, [userData]);

  const handleLanguageChange = async (langObj) => {
    if (loading || selectedLanguage === langObj.name) return;
    setSelectedLanguage(langObj.name);
    setLoading(true);
    await updateProfilePreference(
      dispatch,
      userData,
      { language: langObj.code || langObj.name },
      "Language updated successfully"
    );
    setLoading(false);
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Language"} />}
      scrollEnabled={true}
      paddingHorizontal={0.1}
    >
      <Divider thickness={4} marginVertical={0.1} />
      {languages.map((lang, index) => (
        <ToggleCard
          key={lang.id}
          title={lang.name}
          subtitle={lang.subtitle}
          value={selectedLanguage === lang.name}
          onPress={() => handleLanguageChange(lang)}
          isBorder={true}
          isOption={true}
          marginBottom={index === languages.length - 1 ? 40 : 0}
        />
      ))}
    </ScreenWrapper>
  );
};

export default Language;

const styles = StyleSheet.create({});
