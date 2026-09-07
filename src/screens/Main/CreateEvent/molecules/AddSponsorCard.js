import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { COLORS } from "../../../../utils/COLORS";
import CustomInput from "../../../../components/CustomInput";
import { PNGIcons } from "../../../../assets/images/icons";
import { Images } from "../../../../assets/images";

const AddSponsorCard = ({
  data,
  onNameChange,
  onDelete,
  onPickImage,
  uploading,
}) => {
  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cameraCircle}
        onPress={onPickImage}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : data.logo ? (
          <Image source={{ uri: data.logo }} style={styles.logoImage} />
        ) : (
          <Image source={Images.add_camera} style={styles.cameraIcon} />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <CustomInput
          withLabel={"Sponsor name"}
          placeholder={"Coca Cola"}
          value={data.name}
          onChangeText={onNameChange}
        />
      </View>

      <TouchableOpacity onPress={onDelete} style={{ alignSelf: "center" }}>
        <Image source={PNGIcons.trash} style={styles.trashIcon} />
      </TouchableOpacity>
    </View>
  );
};

export default AddSponsorCard;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  cameraCircle: {
    height: 56,
    width: 56,
    borderRadius: 99,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cameraIcon: {
    height: 24,
    width: 24,
    resizeMode: "contain",
    tintColor: COLORS.white,
  },
  logoImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
  },
  trashIcon: {
    height: 40,
    width: 40,
    resizeMode: "contain",
  },
});
