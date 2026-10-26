import { StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import FloatingSheet from "../../../../components/FloatingSheet";
import { InfoLine } from "./ShowForm";
import { SHOWS, baseline, capGap, capTop } from "./showsLayout";

/**
 * Figma Shows › "Delete-A-Product" (7580:13200) — "Delete Show": SHOW
 * DETAILS (Medium 14 −0.5px UPPER @64%) · 12 · 64 thumb (r12) + name
 * (Medium 14 −2%) / "Total Seasons" / "Total Episodes" (Regular 14 @64%,
 * 6 apart); 32 · red pill (48, #EE1045) "Delete This Show" Medium 18 white
 * · 8 · centred note with "definitive" in Medium white.
 */
const DeleteShowSheet = ({ show, visible, onDismiss, onConfirm, deleting }) => (
  <FloatingSheet visible={visible} onDismiss={onDismiss} title="Delete Show">
    <View>
      <CustomText
        label="Show details"
        textTransform="uppercase"
        fontSize={14}
        fontFamily={fonts.medium}
        letterSpacing={-0.5}
        color={SHOWS.white64}
        marginTop={capTop(14)}
      />
      <View style={[styles.details, { marginTop: 12 + baseline(14) }]}>
        <View style={styles.thumb}>
          {show?.coverImage ? (
            <FastImage source={{ uri: show.coverImage }} style={StyleSheet.absoluteFill} />
          ) : null}
        </View>
        <View style={styles.texts}>
          <CustomText
            label={show?.showName || ""}
            fontSize={14}
            fontFamily={fonts.medium}
            letterSpacing={-0.28}
            color={SHOWS.white}
            numberOfLines={1}
            marginTop={capTop(14)}
          />
          <CustomText
            label={`Total Seasons: ${show?.stats?.totalSeasons || 0}`}
            fontSize={14}
            letterSpacing={-0.07}
            color={SHOWS.white64}
            marginTop={capGap(6, 14, 14)}
          />
          <CustomText
            label={`Total Episodes: ${show?.stats?.totalEpisodes || 0}`}
            fontSize={14}
            letterSpacing={-0.07}
            color={SHOWS.white64}
            marginTop={capGap(6, 14, 14)}
            marginBottom={baseline(14)}
          />
        </View>
      </View>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onConfirm}
        disabled={deleting}
        style={[styles.delete, deleting && { opacity: 0.48 }]}
      >
        <CustomText
          label={deleting ? "Deleting..." : "Delete This Show"}
          fontSize={18}
          fontFamily={fonts.medium}
          color={SHOWS.white}
        />
      </TouchableOpacity>
      <InfoLine
        center
        color={SHOWS.white48}
        style={{ marginTop: 8 }}
        parts={[
          { text: "Deleting this item now will be " },
          { text: "definitive", strong: true },
          { text: "." },
        ]}
      />
    </View>
  </FloatingSheet>
);

export default DeleteShowSheet;

const styles = StyleSheet.create({
  details: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: SHOWS.white04,
  },
  texts: {
    flex: 1,
    justifyContent: "center",
  },
  actions: {
    // Figma: details → button 32 (sheet gap 20 + 12)
    marginTop: 12,
  },
  delete: {
    height: 48,
    borderRadius: 100,
    backgroundColor: SHOWS.red,
    alignItems: "center",
    justifyContent: "center",
  },
});
