import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import CustomButton from "../../../../components/CustomButton";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { reverseGeocode } from "../../../../utils/LocationUtils";
import { FieldBox, FieldLabel } from "../../TvShow/molecules/ShowForm";

/**
 * Figma Chat page "Select-Pickup-On-Map" (2212:6099): full-screen map; header
 * #121212 pad 56/12/12/12 (search pill "Search your city" + 40 cancel); a 64
 * gold 16% circle with a 32 pin fixed at the centre (the map moves under it);
 * bottom panel #121212 pad 12/12/34/12 gap 12: "SET ADDRESS" field 56 ·
 * [48 circle white 4% back · "Confirm Address" gold 48 Medium 16] · 8 ·
 * "By pressing “Continue” you agree with PSC TOS." 12 −3%.
 */
const SelectPickupOnMap = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const returnTo = route?.params?.returnTo || "ScheduleMeeting";
  const start = route?.params?.start;
  const initial = {
    latitude: start?.latitude || 37.7749,
    longitude: start?.longitude || -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };
  const [center, setCenter] = useState(initial);
  const [address, setAddress] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const geo = await reverseGeocode(center.latitude, center.longitude);
        setAddress(geo?.formattedAddress || geo?.address || [geo?.city, geo?.country].filter(Boolean).join(", ") || "");
      } catch (e) {
        setAddress("");
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [center.latitude, center.longitude]);

  // popTo (not navigate): back to the existing Schedule screen, see SelectLocation
  const confirm = () =>
    navigation.popTo(
      returnTo,
      {
        pickedLocation: {
          address: address || `${center.latitude.toFixed(5)}, ${center.longitude.toFixed(5)}`,
          latitude: center.latitude,
          longitude: center.longitude,
        },
      },
      { merge: true },
    );

  return (
    <View style={styles.screen}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initial}
        onRegionChangeComplete={(r) => setCenter(r)}
        showsUserLocation
        userInterfaceStyle={isDark ? "dark" : "light"}
      />
      {/* fixed centre pin */}
      <View pointerEvents="none" style={styles.pinWrap}>
        <View style={styles.pin}>
          <Icons family="MaterialSymbolsRoundedFilled" name="location_on" size={32} color="#A19375" />
        </View>
      </View>

      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={[styles.search, { backgroundColor: tint(0.04) }]}>
          <Icons family="MaterialSymbolsRounded" name="search" size={24} color={tint(0.64)} />
          <CustomText label="Search your city" fontSize={16} fontFamily={fonts.medium} color={tint(0.48)} containerStyle={{ flex: 1 }} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.cancel, { backgroundColor: tint(0.04) }]}>
          <Icons family="MaterialSymbolsRounded" name="close" size={20} color={tint(0.64)} />
        </TouchableOpacity>
      </View>

      {/* bottom panel */}
      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 34), backgroundColor: colors.background }]}>
        <FieldBox>
          <View style={styles.fieldColumn}>
            <FieldLabel label="SET ADDRESS" />
            <CustomText label={address || "Move the map to pick a place"} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={address ? colors.text : tint(0.48)} numberOfLines={1} marginTop={4} />
          </View>
        </FieldBox>
        <View style={styles.actions}>
          <View style={styles.buttons}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.back, { backgroundColor: tint(0.04) }]}>
              <Icons family="MaterialSymbolsRounded" name="chevron_left" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <CustomButton title="Confirm Address" height={48} fontSize={16} onPress={confirm} />
            </View>
          </View>
          <View style={styles.tos}>
            <Icons family="MaterialSymbolsRounded" name="info" size={12} color={tint(0.48)} />
            <CustomText fontSize={12} letterSpacing={-0.36} color={tint(0.48)}>
              {"By pressing “Continue” you agree with "}
              <Text style={{ fontFamily: fonts.medium, color: colors.text }}>PSC</Text>
              {" TOS."}
            </CustomText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SelectPickupOnMap;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  search: {
    flex: 1,
    height: 44,
    borderRadius: 100,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancel: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    elevation: 5,
  },
  pin: {
    width: 64,
    height: 64,
    borderRadius: 100,
    backgroundColor: "rgba(161, 147, 117, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    gap: 12,
  },
  fieldColumn: {
    flex: 1,
    justifyContent: "center",
  },
  actions: {
    gap: 8,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  tos: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
