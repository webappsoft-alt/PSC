import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setIsTabBarVisible } from "../../../store/reducer/playerSlice";
import { FlatList, Image, View } from "react-native";
import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import AuthSlider from "../../../components/Auth/AuthSlider";
import CustomButton from "../../../components/CustomButton";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import ScreenWrapper from "../../../components/ScreenWrapper";
import UploadImageCustom from "../../../components/UploadImageCustom";
import { COLORS } from "../../../utils/COLORS";
import { uploadAndGetUrl } from "../../../utils/constants";
import { ToastMessage } from "../../../utils/ToastMessage";
import AddSponsorCard from "./molecules/AddSponsorCard";

const AddSponsor = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { sponsors = [], onSave } = route.params;

  useEffect(() => {
    if (isFocused) {
      dispatch(setIsTabBarVisible(true));
    }
  }, [isFocused, dispatch]);

  const [list, setList] = useState(sponsors);
  const [imageModal, setImageModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);

  const handleAddSponsor = () => {
    setList((prev) => [...prev, { name: "", logo: "" }]);
  };

  const handleDeleteSponsor = (index) => {
    setList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNameChange = (index, text) => {
    setList((prev) => {
      const copy = [...prev];
      copy[index].name = text;
      return copy;
    });
  };

  const handleImagePick = async (result) => {
    if (!result?.path) return;

    try {
      setUploading(true);

      const url = await uploadAndGetUrl(result);

      if (!url) {
        ToastMessage("Failed to upload image!", "error");
        return;
      }

      setList((prev) => {
        const copy = [...prev];
        copy[selectedIndex].logo = url;
        return copy;
      });
    } catch (err) {
      console.log("Upload error", err);
    } finally {
      setUploading(false);
      setImageModal(false);
    }
  };

  const handleConfirm = () => {
    onSave(list);
    navigation.goBack();
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => (
        <>
          <Header title={"New event"} />
          <View style={{ marginHorizontal: 12 }}>
            <AuthSlider
              min={1}
              max={3}
              gap={4}
              marginTop={8}
              marginBottom={7}
            />
          </View>
        </>
      )}
      footerUnScrollable={() => (
        <View style={{ padding: 12, marginBottom: 24 }}>
          <CustomButton title="Confirm" onPress={handleConfirm} />
        </View>
      )}
      scrollEnabled
    >
      <CustomText
        label={"Event Sponsors"}
        fontSize={24}
        fontFamily={fonts.semiBold}
        lineHeight={24 * 1.4}
        marginTop={8}
      />

      <CustomText
        label={"Please inform your Event’s sponsors below:"}
        fontSize={14}
        lineHeight={14 * 1.4}
        color={COLORS.gray64}
        marginBottom={32}
      />

      <FlatList
        data={list}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <AddSponsorCard
            data={item}
            onNameChange={(txt) => handleNameChange(index, txt)}
            onDelete={() => handleDeleteSponsor(index)}
            onPickImage={() => {
              setSelectedIndex(index);
              setImageModal(true);
            }}
            uploading={uploading && selectedIndex === index}
          />
        )}
      />

      <CustomButton
        title="Add A Sponsor"
        color={COLORS.white}
        backgroundColor={COLORS.inputBg}
        marginTop={12}
        borderRadius={12}
        leftView={
          <Image
            source={Images.plus}
            style={{
              height: 24,
              width: 24,
              resizeMode: "contain",
              tintColor: COLORS.white,
              marginRight: 10,
            }}
          />
        }
        onPress={handleAddSponsor}
      />

      {imageModal && (
        <UploadImageCustom
          imageModal={imageModal}
          setImageModal={setImageModal}
          handleChange={handleImagePick}
          mediaType="photo"
          camera={cameraRef}
        />
      )}
    </ScreenWrapper>
  );
};

export default AddSponsor;
