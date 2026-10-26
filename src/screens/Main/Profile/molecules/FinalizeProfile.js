import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

const FinalizeProfile = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const userData = useSelector((state) => state.users.userData);

  const completionData = useMemo(() => {
    const profilePicDone = !!userData?.profile?.avatar;
    const bioDone = !!userData?.profile?.bio;
    const industryDone = !!(
      userData?.occupation?.jobTitle && userData?.occupation?.company
    );

    const socialMedia = userData?.socialMedia || {};
    const socialsDone = Object.values(socialMedia).some(
      (val) => val && typeof val === "string" && val.trim() !== "",
    );

    const imagesDone = userData?.profile?.matchingImages?.length > 0;

    const cards = [
      { id: 1, title: "ADD A PROFILE PICTURE", completed: profilePicDone },
      { id: 2, title: "WRITE A BIO", completed: bioDone },
      { id: 3, title: "SET YOUR INDUSTRY", completed: industryDone },
      { id: 4, title: "LINK SOCIALS", completed: socialsDone },
      { id: 5, title: "ADD YOUR IMAGES", completed: imagesDone },
    ];

    if (userData?.role === "individual") {
      cards.push({
        id: 6,
        title: "VERIFY IDENTITY",
        completed: !!userData?.profile?.isVerified,
      });
    }

    const completedCountInCards = cards.filter((c) => c.completed).length;
    const totalCompleted = 3 + completedCountInCards; // Starting from 3 as requested
    const allCompleted = completedCountInCards === cards.length;
    const totalPossible = 3 + cards.length;

    return { cards, totalCompleted, allCompleted, totalPossible };
  }, [userData]);

  if (completionData.allCompleted) return null;

  const ink = (a) =>
    isDark ? `rgba(255, 255, 255, ${a})` : `rgba(18, 18, 18, ${a})`;

  /**
   * Figma "Finalize your profil" section (375 fill, padding 16/12, gap 20):
   * title row (Medium 16 @64% · "3/" Regular 16 @64% + "7" Medium 16 · 16pt
   * green tick, gap 4) → 12 → description (Regular 12 @48%) → 20 → 120×132
   * cards (gap 8, padding 12/8, radius 12, 2pt stroke, SemiBold 12 −0.5%
   * uppercase, 24pt icon bottom-right).
   * RN text boxes are 1.4×fontSize, Figma trims to cap height (0.7×fontSize):
   * 0.35×fontSize per side is taken out of each gap (16pt → 3.2, 12pt → 4.2).
   */
  return (
    <>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <CustomText
          label="Finalize your profile"
          fontSize={16}
          fontFamily={fonts.medium}
          color={ink(0.64)}
        />

        <View style={styles.row}>
          <CustomText
            label={`${completionData.totalCompleted}/`}
            fontSize={16}
            color={ink(0.64)}
          />
          <CustomText
            label={completionData.totalPossible.toString()}
            fontSize={16}
            fontFamily={fonts.medium}
            color={colors.text}
          />
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="check_circle"
            size={16}
            color={GREEN}
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      <CustomText
        label="Complete your profile to gain up to 4.5x more followers and avoid being mistaken for inactive bots that risk bans."
        fontSize={12}
        color={ink(0.48)}
        marginTop={12 - 3.2 - 4.2}
      />

      {/* HORIZONTAL CARDS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cardsScroll}
        contentContainerStyle={styles.cardsContent}
      >
        {completionData.cards.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => {
                if (item?.id == 5) {
                  navigation.navigate("AddPicture");
                } else if (item?.id == 6) {
                  navigation.navigate("VerifyIdentity", { fromProfile: true });
                } else {
                  navigation.navigate("AccountInfo");
                }
              }}
              style={[
                styles.card,
                {
                  backgroundColor: item.completed
                    ? "rgba(55, 184, 116, 0.16)"
                    : ink(0.04),
                  borderColor: item.completed ? GREEN : ink(0.04),
                },
              ]}
            >
              <CustomText
                label={item.title}
                fontFamily={fonts.semiBold}
                fontSize={12}
                letterSpacing={-0.06}
                textTransform={"uppercase"}
                containerStyle={{ alignSelf: "stretch" }}
                color={item.completed ? "rgba(55, 184, 116, 0.64)" : ink(0.64)}
              />

              {item.completed ? (
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="check_circle"
                  size={24}
                  color={GREEN}
                />
              ) : (
                <Icons
                  family="MaterialSymbolsRounded"
                  name="add_circle"
                  size={24}
                  color={colors.text}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
    {/* Figma: next section starts 2pt below on #262626 */}
    <View style={styles.sectionGap} />
    </>
  );
};

export default FinalizeProfile;

const GREEN = "rgba(55, 184, 116, 1)";

const styles = StyleSheet.create({
  sectionGap: { height: 2, backgroundColor: "#262626" },
  container: {
    paddingTop: 16 - 3.2,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardsScroll: {
    marginTop: 20 - 4.2,
    marginRight: -12,
  },
  cardsContent: {
    gap: 8,
    paddingRight: 12,
  },
  card: {
    height: 132,
    width: 120,
    paddingTop: 12 - 4.2,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
});
