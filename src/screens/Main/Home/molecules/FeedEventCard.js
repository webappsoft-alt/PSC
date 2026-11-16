import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import { memo } from "react";
import { Image, Linking, Platform, Share, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";
import { COLORS } from "../../../../utils/COLORS";

const MS = "MaterialSymbolsRounded";
const MSF = "MaterialSymbolsRoundedFilled";
const X = (fs) => Math.round(fs * 0.35 * 10) / 10;
const WHITE_8 = "rgba(255, 255, 255, 0.08)";
const WHITE_64 = "rgba(255, 255, 255, 0.64)";

/** Figma pill (8331:2964): 28 r100 white 8%, padding 8, gap 4, Medium 14 white, 12 icon */
const Pill = ({ label, icon, iconRight, onPress }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.pill}>
    {!!icon && !iconRight && <Icons family={MSF} name={icon} size={12} color="#FFFFFF" />}
    <CustomText label={label} fontSize={14} fontFamily={fonts.medium} color="#FFFFFF" marginTop={-X(14)} marginBottom={-X(14)} />
    {!!icon && iconRight && <Icons family={MSF} name={icon} size={12} color="#FFFFFF" />}
  </TouchableOpacity>
);

/** Figma tile (Remind Me 94 × 60 / Info 58 × 60): white 8% r8, 24 icon, Light 14 white 64% */
const Tile = ({ label, icon, family, onPress, style }) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.tile, style]}>
    <Icons family={family} name={icon} size={24} color="#FFFFFF" />
    <CustomText label={label} fontSize={14} fontFamily={fonts.light} color={WHITE_64} marginTop={-X(14)} marginBottom={-X(14)} />
  </TouchableOpacity>
);

/**
 * Event in the Home feed — Figma Social Feed › Home-Feed "Frame 64"
 * (8331:2943). #121212, padding 16/12, row gap 7: date (MMM Medium 16 −0.5%
 * #A5A5A5 · day SemiBold 30) · column 309 gap 16 — cover 309 × 174 r8 with
 * the PSC mark (19 × 16 at 12/12) · gap 8 · 62 r8 thumbnail + Remind Me /
 * Info tiles · gap 8 · Get There / My Tickets / Share pills (gap 3) · "Coming
 * on JANUARY 15, 2027" Medium 14 / name BoldItalic 28 −4% / category (16
 * icon white 64% + Medium 14 #A2A2A2) / about Regular 12 #A8A8A8 / tags
 * Regular 12 #A8A8A8 split by 4pt #D9D9D9 dots (text gap 12) · "Join This
 * Event!" 48 r100 white, Medium 16 #121212 → event detail.
 */
const FeedEventCard = ({ event }) => {
  const navigation = useNavigation();
  if (!event?._id) return null;
  const start = event.startDate ? moment(event.startDate) : null;
  const cover = event.media?.[0]?.url;
  const thumb = event.media?.[1]?.url || cover;
  const [category, ...tags] = event.category || [];
  const openDetail = () => navigation.navigate("EventDetail", { id: event._id });

  const getThere = () => {
    const [lng, lat] = event.address?.location?.coordinates || [];
    const query = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(
      [event.address?.address, event.address?.city, event.address?.country].filter(Boolean).join(", "),
    );
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${query}`,
      android: `http://maps.google.com/maps?daddr=${query}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const share = () =>
    Share.share({
      message: `${event.eventName} on PSC: psc://event/${event._id}`,
      url: `psc://event/${event._id}`,
    }).catch(() => {});

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={openDetail} style={styles.card}>
        <View style={styles.date}>
          <CustomText
            label={start ? start.format("MMM").toUpperCase() : ""}
            fontSize={16}
            letterSpacing={-0.08}
            fontFamily={fonts.medium}
            color="#A5A5A5"
            textAlign="center"
            marginTop={-X(16)}
            marginBottom={-X(16)}
          />
          <CustomText
            label={start ? start.format("DD") : ""}
            fontSize={30}
            fontFamily={fonts.semiBold}
            color="#FFFFFF"
            textAlign="center"
            marginTop={(35 - 42) / 2}
            marginBottom={(35 - 42) / 2}
          />
        </View>

        <View style={styles.column}>
          <View style={styles.media}>
            <ImageFast source={{ uri: cover }} style={styles.cover}>
              <Image source={Images.signerLogo} style={styles.mark} resizeMode="contain" />
            </ImageFast>
            <View style={styles.thumbRow}>
              <ImageFast source={{ uri: thumb }} style={styles.thumb} />
              <View style={styles.tiles}>
                <Tile label="Remind Me" icon="notifications" family={MSF} style={styles.remind} />
                <Tile label="Info" icon="info" family={MS} onPress={openDetail} style={styles.info} />
              </View>
            </View>
            <View style={styles.pills}>
              <Pill label="Get There" icon="directions" onPress={getThere} />
              <Pill label="My Tickets" icon="confirmation_number" iconRight onPress={openDetail} />
              <Pill label="Share" icon="share" iconRight onPress={share} />
            </View>
          </View>

          <View style={styles.texts}>
            {!!start && (
              <CustomText
                label={`Coming on ${start.format("MMMM D, YYYY")}`.toUpperCase()}
                fontSize={14}
                fontFamily={fonts.medium}
                color="#FFFFFF"
                marginTop={-X(14)}
                marginBottom={-X(14)}
              />
            )}
            <CustomText
              label={event.eventName}
              fontSize={28}
              letterSpacing={-1.12}
              fontFamily={fonts.BoldItalic}
              fontStyle="italic"
              color="#FFFFFF"
              numberOfLines={2}
              marginTop={-X(28)}
              marginBottom={-X(28)}
            />
            {!!category && (
              <View style={styles.category}>
                <Icons family={MSF} name="category" size={16} color={WHITE_64} />
                <CustomText label={category} fontSize={14} letterSpacing={-0.07} fontFamily={fonts.medium} color="#A2A2A2" marginTop={-X(14)} marginBottom={-X(14)} />
              </View>
            )}
            {!!event.aboutThisEvent && (
              <CustomText label={event.aboutThisEvent} fontSize={12} color="#A8A8A8" numberOfLines={2} marginTop={-X(12)} marginBottom={-X(12)} />
            )}
            {tags.length > 0 && (
              <View style={styles.tags}>
                {tags.map((t, i) => (
                  <View key={`${t}-${i}`} style={styles.tag}>
                    <CustomText label={t} fontSize={12} color="#A8A8A8" marginTop={-X(12)} marginBottom={-X(12)} />
                    {i < tags.length - 1 && <View style={styles.tagDot} />}
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={openDetail} style={styles.join}>
            <CustomText label="Join This Event!" fontSize={16} fontFamily={fonts.medium} color="#121212" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <View style={styles.rule} />
    </>
  );
};

export default memo(FeedEventCard);

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 7, paddingVertical: 16, paddingHorizontal: 12, backgroundColor: "#121212" },
  date: { width: 35, gap: 1, alignItems: "center" },
  column: { flex: 1, gap: 16 },
  media: { gap: 8 },
  cover: { width: "100%", aspectRatio: 309 / 173.7, borderRadius: 8, overflow: "hidden" },
  mark: { width: 19, height: 16, margin: 12 },
  thumbRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  thumb: { width: 62, height: 62, borderRadius: 8, overflow: "hidden" },
  tiles: { flexDirection: "row", gap: 8 },
  tile: { height: 60, borderRadius: 8, backgroundColor: WHITE_8, alignItems: "center", paddingVertical: 8 },
  remind: { width: 94, paddingHorizontal: 8, gap: 7 },
  info: { width: 58, paddingHorizontal: 16, gap: 10 },
  pills: { flexDirection: "row", gap: 3, flexWrap: "wrap" },
  pill: { height: 28, borderRadius: 100, backgroundColor: WHITE_8, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  texts: { gap: 12 },
  category: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 16 },
  tags: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", rowGap: 6 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 4 },
  tagDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D9D9D9" },
  join: { height: 48, borderRadius: 100, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  rule: { height: 1, backgroundColor: COLORS.authHeader },
});
