import { useState } from "react";
import { StyleSheet, View } from "react-native";
import ScreenWrapper from "../../../components/ScreenWrapper";
import SearchInput from "../../../components/SearchInput";
import TopTab from "../../../components/TopTab";
import PeopleTab from "./molecules/PeopleTab";
import PostTab from "./molecules/PostTab";
import { useNavigation } from "@react-navigation/native";

const SearchScreen = ({ route }) => {
  const activeTab = route.params?.tab;
  const [tab, setTab] = useState(activeTab == "people" ? 1 : 0);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      headerUnScrollable={() => (
        <View style={{ paddingHorizontal: 12 }}>
          <SearchInput
            placeholder="Michael Jordan..."
            isCross
            isChange
            value={searchQuery}
            onChangeText={setSearchQuery}
            CrossPress={() => setSearchQuery("")}
            CrossPressBack={() => navigation.goBack()}
          />
          <TopTab
            rounded
            oval
            tab={tab}
            setTab={setTab}
            tabNames={["Posts", "People"]}
            marginTop={12}
            marginBottom={12}
            activeColor="#A1937514"
            ovalBg="#A1937500"
            borderWidth={1}
            borderColor="#A193750A"
            paddingHorizontal={14}
          />
        </View>
      )}
    >
      <View style={{ flex: 1, display: tab == 0 ? "flex" : "none" }}>
        <PostTab isActive={tab == 0} />
      </View>
      <View style={{ flex: 1, display: tab == 1 ? "flex" : "none" }}>
        <PeopleTab
          isActive={tab == 1}
          activeTab={activeTab}
          searchQuery={searchQuery}
        />
      </View>
    </ScreenWrapper>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gradient: {
    height: 80,
    width: "100%",
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
});
