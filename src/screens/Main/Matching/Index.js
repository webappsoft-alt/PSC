import { useIsFocused } from "@react-navigation/native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Images } from "../../../assets/images";
import ScreenWrapper from "../../../components/ScreenWrapper";
import TopTabWithBG from "../../../components/TopTabWithBG";
import HomeCard from "./molecules/HomeCard";
import MatchingHeader from "./molecules/MatchingHeader";
import MatchingModal from "./molecules/MatchingModal";

const Matching = () => {
  const isFocus = useIsFocused();
  const [tab, setTab] = useState("Matching");
  const [likesModal, setLikesModal] = useState(true);

  const modalSteps = [
    {
      title: "No more likes?",
      subtitle:
        "Subscribe to any plans and get instantly unlimited likes and start discovering individuals around you!",
      imgSource: Images.greenHeart,
      btnTitle1: "Subscribe",
      btnSubtitle: "from $9.90/month",
      btnTitle2: "Maybe later",
    },
    {
      title: "Rewinds",
      subtitle:
        "For an hour be the most reviewed profile in your category and get much more chance to connect with other like minded profiles.",
      imgSource: Images.rewind,
      btnTitle1: "Buy more Rewinds!",
      btnSubtitle: "$2 each",
      btnTitle2: "Maybe later",
    },
    {
      title: "Super Likes",
      subtitle:
        "Stand out with Super Likes and get much more chance to connect with other like minded profiles.",
      imgSource: Images.blueStar,
      btnTitle1: "Buy more Super Likes!",
      btnSubtitle: "$2 each",
      btnTitle2: "Maybe later",
    },
  ];

  const [modalStepIndex, setModalStepIndex] = useState(0);

  const handleFirstButton = () => {
    // Move to next step if available
    if (modalStepIndex < modalSteps.length - 1) {
      setModalStepIndex(modalStepIndex + 1);
    } else {
      // If last modal reached, close
      setLikesModal(false);
    }
  };

  const currentModal = modalSteps[modalStepIndex];

  // useEffect(() => {
  //   setLikesModal(true);
  //   setModalStepIndex(0);
  // }, [isFocus]);

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      headerUnScrollable={() => (
        <>
          <MatchingHeader />
          <View style={{ paddingHorizontal: 12 }}>
            <TopTabWithBG
              marginTop={0}
              tabNames={["Matching", "Jobs"]}
              tab={tab}
              setTab={setTab}
            />
          </View>
        </>
      )}
    >
      <HomeCard />

      <MatchingModal
        isVisible={likesModal}
        onDisable={() => setLikesModal(false)}
        title={currentModal.title}
        subtitle={currentModal.subtitle}
        imgSource={currentModal.imgSource}
        btnTitle1={currentModal.btnTitle1}
        btnSubtitle={currentModal.btnSubtitle}
        btnTitle2={currentModal.btnTitle2}
        onBtn1Press={handleFirstButton}
      />
    </ScreenWrapper>
  );
};

export default Matching;

const styles = StyleSheet.create({});
