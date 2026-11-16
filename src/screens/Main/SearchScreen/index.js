import { useState } from "react";
import { StyleSheet, View } from "react-native";
import ScreenWrapper from "../../../components/ScreenWrapper";
import GlassBackButton from "../../../components/GlassBackButton";
import { SearchPill } from "../Career/molecules/CareerUI";
import TopTab from "../../../components/TopTab";
import PeopleSearchList from "./molecules/PeopleSearchList";
import PeopleTab from "./molecules/PeopleTab";
import PostTab from "./molecules/PostTab";
import { useNavigation } from "@react-navigation/native";

const SearchScreen = ({ route }) => {
  const activeTab = route.params?.tab;
  // Opened from another user's profile → only their Followers / Following
  const targetUserId = route.params?.userId;
  const [tab, setTab] = useState(
    activeTab == "people" || targetUserId ? 1 : 0,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [topic, setTopic] = useState(null);
  // global people search (Figma Search-People); a user's Followers /
  // Following or my own lists (opened with peopleTab) keep PeopleTab
  const globalPeople = !targetUserId && !route.params?.peopleTab;
  const navigation = useNavigation();

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      headerBlur
      headerUnScrollable={() => (
        // Figma Search-People header (2276:955): padding 52/12/12, gap 12 —
        // search pill 44 (`search` 24, Medium 16 white 64%, `cancel` 22) +
        // 40 close circle · topic chips (People) · Posts / People
        <View style={styles.header}>
          <View style={styles.fieldRow}>
            <View style={styles.grow}>
              <SearchPill
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search topics..."
                height={44}
                iconSize={24}
                fontSize={16}
                letterSpacing={0}
                placeholderColor="rgba(255, 255, 255, 0.64)"
                paddingHorizontal={12}
                gap={10}
                clearSize={22}
              />
            </View>
            <GlassBackButton icon="close" iconSize={20} color="rgba(255, 255, 255, 0.64)" onPress={() => navigation.goBack()} accessibilityLabel="Close" />
          </View>
          {!targetUserId && (
          <TopTab
            rounded
            oval
            tab={tab}
            setTab={setTab}
            tabNames={["Posts", "People"]}
            marginTop={0}
            marginBottom={0}
            activeColor="#A1937514"
            ovalBg="#A1937500"
            borderWidth={1}
            borderColor="#A193750A"
            paddingHorizontal={14}
          />
          )}

        </View>
      )}
    >
      <View style={{ flex: 1, display: tab == 0 ? "flex" : "none" }}>
        <PostTab isActive={tab == 0} />
      </View>
      <View style={{ flex: 1, display: tab == 1 ? "flex" : "none" }}>
        {globalPeople ? (
          <PeopleSearchList isActive={tab == 1} query={searchQuery} topic={topic} onTopic={setTopic} />
        ) : (
        <PeopleTab
          isActive={tab == 1}
          activeTab={activeTab}
          initialPeopleTab={route.params?.peopleTab}
          targetUserId={targetUserId}
          searchQuery={searchQuery}
        />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  // no fill: the shared progressive-blur header (headerBlur) shows through, as on other screens
  header: { paddingTop: 8, paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 40 },
  grow: { flex: 1 },
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
