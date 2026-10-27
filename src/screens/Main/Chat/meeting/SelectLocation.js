import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import {
  calculateDistance,
  formatDistance,
  getCurrentLocation,
  placeDetails,
  reverseGeocode,
  searchPlaces,
} from "../../../../utils/LocationUtils";
import { ToastMessage } from "../../../../utils/ToastMessage";

/**
 * Figma Chat page "Select-Location" (2212:6024, 375×812) — Schedule a meeting
 * › "Where Will You Meet?". Page #262626; header #121212 pad 56/12/12/12:
 * search pill 303×40 white 4% (search 20 · "Search location..." Medium 16
 * @48% · clear 20) + 40 cancel circle. Block #121212: row 56 (pad 16, gap 8)
 * "Select On The Map" (map 24 · Medium 16 −0.5 · chevron 24) · 1px white 4% ·
 * current place (my_location 24 · name Medium 16 + region Medium 14 @48% ·
 * "Currently here" Medium 14 @64%). 1 below: results block, rows 56 (name /
 * region · distance Medium 14 @64%) with 1px white 4% lines.
 *
 * Returns the pick to `returnTo` (route name) as params.pickedLocation.
 */
const SelectLocation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const tint = (o) => (isDark ? `rgba(255, 255, 255, ${o})` : `rgba(18, 18, 18, ${o})`);
  const returnTo = route?.params?.returnTo || "ScheduleMeeting";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [here, setHere] = useState(null); // { latitude, longitude, city, region }
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        const geo = await reverseGeocode(loc.latitude, loc.longitude).catch(() => null);
        setHere({
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: geo?.city || "Current location",
          region: [geo?.state, geo?.country].filter(Boolean).join(", "),
          address: geo?.formattedAddress || geo?.address || geo?.city || "Current location",
        });
      } catch (e) {
        // permission denied / unavailable: the row is simply not shown
      }
    })();
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlaces(query, here || {}));
      } catch (e) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [query, here]);

  // React Navigation 7: `navigate` pushes a NEW screen (it no longer jumps
  // back), which lost the chat target and reset the steps. popTo returns to
  // the existing Schedule screen and merges the pick into its params.
  const finish = (picked) => navigation.popTo(returnTo, { pickedLocation: picked }, { merge: true });

  const pick = async (r) => {
    try {
      const d = await placeDetails(r.placeId);
      if (!d) throw new Error();
      finish(d);
    } catch (e) {
      ToastMessage("Could not load this place", "error");
    }
  };

  const distanceOf = (r) => r.distance || "";

  const Row = ({ icon, title, subtitle, right, onPress, chevron }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
      {icon && <Icons family="MaterialSymbolsRoundedFilled" name={icon} size={24} color={colors.text} />}
      <View style={styles.rowTexts}>
        <CustomText label={title} fontSize={16} fontFamily={fonts.medium} letterSpacing={-0.5} color={colors.text} numberOfLines={1} />
        {!!subtitle && (
          <CustomText label={subtitle} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.5} color={tint(0.48)} numberOfLines={1} marginTop={-1.4} />
        )}
      </View>
      {!!right && <CustomText label={right} fontSize={14} fontFamily={fonts.medium} letterSpacing={-0.5} color={tint(0.64)} />}
      {chevron && <Icons family="MaterialSymbolsRounded" name="chevron_right" size={24} color={tint(0.64)} />}
    </TouchableOpacity>
  );
  const Line = () => <View style={[styles.line, { backgroundColor: tint(0.04) }]} />;

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#262626" : colors.surfaceAlt }]}>
      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
        <View style={[styles.search, { backgroundColor: tint(0.04) }]}>
          <Icons family="MaterialSymbolsRounded" name="search" size={20} color={tint(0.64)} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search location..."
            placeholderTextColor={tint(0.48)}
            selectionColor="#A19375"
            autoFocus
            style={[styles.input, { color: colors.text }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
              <Icons family="MaterialSymbolsRoundedFilled" name="cancel" size={20} color={tint(0.64)} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.cancel, { backgroundColor: tint(0.04) }]}>
          <Icons family="MaterialSymbolsRounded" name="close" size={20} color={tint(0.64)} />
        </TouchableOpacity>
      </View>

      {/* map + current place */}
      <View style={[styles.block, { backgroundColor: colors.background, marginTop: 1 }]}>
        <Row
          icon="map"
          title="Select On The Map"
          chevron
          onPress={() => navigation.navigate("SelectPickupOnMap", { returnTo, start: here })}
        />
        {here && (
          <>
            <Line />
            <Row icon="my_location" title={here.city} subtitle={here.region} right="Currently here" onPress={() => finish({ address: here.address, latitude: here.latitude, longitude: here.longitude })} />
          </>
        )}
      </View>

      {/* results */}
      <View style={[styles.block, styles.flex, { backgroundColor: colors.background, marginTop: 1 }]}>
        {searching ? (
          <ActivityIndicator color={colors.text} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(r) => r.placeId}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={Line}
            renderItem={({ item }) => <Row title={item.name} subtitle={item.secondary} right={distanceOf(item)} onPress={() => pick(item)} />}
            ListFooterComponent={results.length ? <Line /> : null}
          />
        )}
      </View>
    </View>
  );
};

export default SelectLocation;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  search: {
    flex: 1,
    height: 40,
    borderRadius: 100,
    paddingLeft: 12,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 16,
    padding: 0,
    height: 40,
  },
  cancel: {
    width: 40,
    height: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  block: {},
  row: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTexts: {
    flex: 1,
  },
  line: {
    height: 1,
  },
});
