import { StyleSheet, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";

const W48 = "rgba(255, 255, 255, 0.48)";

// icon · italic title · subtitle per profile tab (app empty-state pattern:
// Jobs marketplace / Events tab — 80 filled icon, 32 BoldItalic, Medium sub)
const TABS = {
  Posts: ["article", "No Posts", "There are no posts right now."],
  Reposts: ["repeat", "No Reposts", "There are no reposts right now."],
  Mentions: ["alternate_email", "No Mentions", "There are no mentions right now."],
  Replies: ["forum", "No Replies", "There are no replies right now."],
  Liked: ["favorite", "No Likes", "There are no liked posts right now."],
  Saved: ["bookmark", "No Saved Posts", "There are no saved posts right now."],
  About: ["info", "No Info", "There is no information about this profile yet."],
};

/** Empty state of the profile post tabs, same pattern as the rest of PSC. */
const TabEmptyState = ({ tabKey, text }) => {
  const [icon, title, subtitle] = TABS[tabKey] || TABS.Posts;
  return (
    <View style={styles.wrap}>
      <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={80} color={W48} />
      <CustomText
        label={text ? "Something went wrong" : title}
        fontSize={32}
        fontFamily={fonts.BoldItalic}
        fontStyle="italic"
        color="#FFFFFF"
        marginTop={12}
        textAlign="center"
      />
      <CustomText label={text || subtitle} fontFamily={fonts.medium} color={W48} textAlign="center" />
    </View>
  );
};

export default TabEmptyState;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 320,
  },
});
