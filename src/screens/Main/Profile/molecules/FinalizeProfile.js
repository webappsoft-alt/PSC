import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Divider from "../../../../components/Divider";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";

const FinalizeProfile = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
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
      { id: 2, title: "ADD A BIO", completed: bioDone },
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

  return (
    <View style={{ paddingHorizontal: 12, marginTop: 16 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <CustomText
          label="Finalize your profile"
          fontSize={16}
          fontFamily={fonts.medium}
          color={colors.textSecondary}
        />

        <View style={styles.row}>
          <CustomText
            label={`${completionData.totalCompleted}/`}
            fontSize={16}
            color={colors.textSecondary}
          />
          <CustomText
            label={completionData.totalPossible.toString()}
            fontSize={16}
          />
          <Image
            source={Images.checkGreen}
            style={{ width: 16, height: 16, marginLeft: 4 }}
          />
        </View>
      </View>

      <CustomText
        label="Complete your profile to gain up to 4.5x more followers and avoid being mistaken for inactive bots that risk bans."
        fontSize={12}
        color={colors.textSecondary}
      />

      {/* HORIZONTAL CARDS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20 }}
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
                    ? "rgba(55,184,116,0.16)"
                    : colors.surfaceAlt,
                  borderColor: item.completed ? "#37B874" : colors.surfaceAlt,
                },
              ]}
            >
              <CustomText
                label={item.title}
                fontFamily={fonts.semiBold}
                fontSize={12}
                color={
                  item.completed ? COLORS.green + "64" : colors.textSecondary
                }
              />

              <View style={{ alignSelf: "flex-end" }}>
                <Image
                  source={item.completed ? Images.checkGreen : Images.plusWhite}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: item.completed ? undefined : colors.text,
                  }}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Divider marginTop={18} thickness={2} />
    </View>
  );
};

export default FinalizeProfile;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  card: {
    height: 132,
    width: 120,
    padding: 8,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "space-between",
  },
});
