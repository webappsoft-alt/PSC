import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const EventLocation = ({ address }) => {
  const LATITUDE = address?.location?.coordinates[1];
  const LONGITUDE = address?.location?.coordinates[0];
  const openDirections = () => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${LATITUDE},${LONGITUDE}`,
      android: `http://maps.google.com/maps?daddr=${LATITUDE},${LONGITUDE}`,
    });

    Linking.openURL(url);
  };

  const showAlert = () => {
    Alert.alert("Open Map", "Open location in map?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: openDirections,
      },
    ]);
  };

  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.mainContainer}>
      <CustomText
        label={"Where Will It Happen"}
        fontFamily={fonts.semiBold}
        fontSize={22}
      />

      <View style={[styles.row, { marginVertical: 4 }]}>
        <Image source={Images.event} style={[styles.icon, { tintColor: colors.text }]} />
        <CustomText
          label={address?.address}
          fontSize={16}
          fontFamily={fonts.medium}
          marginLeft={2}
        />
      </View>
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: LATITUDE,
            longitude: LONGITUDE,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={{ latitude: LATITUDE, longitude: LONGITUDE }} />
        </MapView>
      </View>

      <Pressable
        onPress={showAlert}
        style={[styles.addressContainer, styles.row]}
      >
        <View style={{ flex: 1 }}>
          <CustomText
            label={"ADDRESS"}
            color={colors.iconMuted}
            fontFamily={fonts.medium}
            fontSize={12}
            textTransform={"uppercase"}
          />
          <View style={[styles.row, { marginTop: 2, width: "90%" }]}>
             <Image
              source={Images.LocationPin}
              style={[styles.icon, { tintColor: colors.text }]}
            />
            <CustomText
              label={address?.address}
              fontFamily={fonts.medium}
              fontSize={16}
              lineHeight={16 * 1.4}
              marginLeft={6}
              numberOfLines={1}
            />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default EventLocation;

const createStyles = (colors, isDark) => StyleSheet.create({
  mainContainer: {
    padding: 12,
    paddingTop: 8,
  },

  mapWrapper: {
    height: 351,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    marginTop: 8,
    marginBottom: 8,
  },

  map: {
    flex: 1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    height: 16,
    width: 16,
    resizeMode: "contain",
  },

  addressContainer: {
    height: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
});
