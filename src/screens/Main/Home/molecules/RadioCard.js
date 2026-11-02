import { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { post } from "../../../../services/ApiRequest";
import {
  setAudioUrl,
  setLoading,
  setPlaying,
  setPlayingRadioData,
  setPlayingRadioId,
  setShowRadioPlayer,
  requestRadioPlay,
} from "../../../../store/reducer/playerSlice";
import { COLORS } from "../../../../utils/COLORS";
import moment from "moment";
import Blur from "../../../../components/Blur";
import UserBadge from "../../../../components/UserBadge";

const RadioCard = ({ data = [] }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const showRadioPlayer = useSelector((state) => state.player.showRadioPlayer);
  const playingRadioId = useSelector((state) => state.player.playingRadioId);

  const handlePlay = useCallback(
    async (item) => {
      try {
        dispatch(requestRadioPlay(item));
        post(`radio/${item._id}/play`);
      } catch (error) {
        console.log("Radio play error", error);
      }
    },
    [dispatch],
  );

  const handleStop = useCallback(() => {
    // clearing the radio unmounts PlayerCard's player
    dispatch(setPlaying(false));
    dispatch(setLoading(false));
    dispatch(setShowRadioPlayer(false));
    dispatch(setAudioUrl(null));
    dispatch(setPlayingRadioId(null));
    dispatch(setPlayingRadioData(null));
  }, [dispatch]);

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      {/* Figma "TOP RADIOS" (Home-Feed 8005:8658): Bold Italic 16, −6 %,
          "TOP" white 48 %, gap 2; section pad 12, 16 to the cards */}
      <View style={[styles.header, styles.spaceBetween]}>
        <View style={styles.titleRow}>
          <CustomText
            label="TOP"
            fontSize={16}
            letterSpacing={-0.96}
            color={COLORS.gray48}
            fontFamily={fonts.BoldItalic}
            fontStyle="italic"
          />
          <CustomText
            label="RADIOS"
            fontSize={16}
            letterSpacing={-0.96}
            color={colors.text}
            fontFamily={fonts.BoldItalic}
            fontStyle="italic"
          />
        </View>
        {showRadioPlayer && (
          <TouchableOpacity activeOpacity={0.7} onPress={handleStop}>
            <CustomText
              label="Stop"
              color={COLORS.buttonColor}
              fontFamily={fonts.medium}
              fontSize={12}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Figma radio card: 303 × 60, pad 4, r16, white 16 % + 1pt inside
          stroke #121212 16 %, background blur 16 · inner r12 #121212, pad
          6/10/6/6, gap 8: [40 logo r8 (+ NEW chip) · gap 8 · listeners row
          (group 12 · Medium 10 −0.5 % @48 % · 3pt dot · time) gap 4 title
          (Medium 14 −0.5 %) + badge 14] · graphic_eq 24 · 32 play circle.
          The strip scrolls edge to edge (12 inset at both ends). */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {data?.map((item, index) => {
          const avatar = item?.userId?.profile?.avatar;
          const profileColor = item?.userId?.profile?.profileColor;
          const listeners = item?.play?.length || 0;
          const isPlaying = playingRadioId === item?._id;
          const endsAt = item?.endsAt || item?.expiresAt;
          const timeLabel = endsAt
            ? `${moment(endsAt).diff(moment(), "hours")}hrs left`
            : moment(item?.createdAt).fromNow();
          const isNew =
            !!item?.createdAt &&
            moment().diff(moment(item.createdAt), "hours") < 24;

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              // Figma "Radio-Detail" / "Audio-Post-Detail" — the strip lists
              // both kinds; prev / next on the detail walk this list
              onPress={() =>
                navigation.navigate("RadioDetail", { radio: item, list: data })
              }
              style={styles.cardOutline}
              key={item?._id || index}
            >
              <Blur
                blurType={isDark ? "dark" : "light"}
                blurAmount={16}
                borderRadius={16}
              />
              <View
                style={[
                  styles.cardInner,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.identity}>
                  <View style={styles.logoBox}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.image} />
                    ) : (
                      <View
                        style={[
                          styles.image,
                          styles.logoFallback,
                          { backgroundColor: profileColor || COLORS.green1 },
                        ]}
                      >
                        <Icons
                          family="MaterialSymbolsRoundedFilled"
                          name="graphic_eq"
                          size={20}
                          color={COLORS.white}
                        />
                      </View>
                    )}
                    {isNew ? (
                      <View style={styles.newChip}>
                        <CustomText
                          label="NEW"
                          fontSize={10}
                          fontFamily={fonts.semiBold}
                          color={COLORS.white}
                          marginTop={(7 - 14) / 2}
                          marginBottom={(7 - 14) / 2}
                        />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.texts}>
                    <View style={styles.metaRow}>
                      <View style={styles.listenersRow}>
                        <Icons
                          family="MaterialSymbolsRoundedFilled"
                          name="group"
                          size={12}
                          color={COLORS.gray64}
                        />
                        <CustomText
                          label={`${listeners.toLocaleString()} listener${
                            listeners !== 1 ? "s" : ""
                          }`}
                          fontSize={10}
                          letterSpacing={-0.05}
                          fontFamily={fonts.medium}
                          color={COLORS.gray48}
                          numberOfLines={1}
                        />
                      </View>
                      <View style={styles.dot} />
                      <CustomText
                        label={timeLabel}
                        fontSize={10}
                        letterSpacing={-0.05}
                        fontFamily={fonts.medium}
                        color={COLORS.gray48}
                        numberOfLines={1}
                      />
                    </View>
                    <View style={styles.titleLine}>
                      <CustomText
                        label={item?.title || "Untitled"}
                        fontFamily={fonts.medium}
                        fontSize={14}
                        letterSpacing={-0.07}
                        numberOfLines={1}
                        color={colors.text}
                        containerStyle={styles.shrink}
                      />
                      <UserBadge user={item?.userId} size={14} />
                    </View>
                  </View>
                </View>

                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name={isPlaying ? "volume_up" : "graphic_eq"}
                  size={24}
                  color={colors.text}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={isPlaying ? handleStop : () => handlePlay(item)}
                  style={[styles.circle, { backgroundColor: colors.surfaceAlt }]}
                >
                  <Icons
                    family="MaterialSymbolsRoundedFilled"
                    name={isPlaying ? "stop" : "play_arrow"}
                    size={16}
                    color={colors.text}
                  />
                </TouchableOpacity>
                {isPlaying ? <View style={styles.progress} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default RadioCard;

// CustomText line box = 1.4 × size; Figma texts are cap-trimmed
const ABOVE_CAP = 0.353;
const BELOW_BASELINE = 0.35;

const styles = StyleSheet.create({
  // Figma section: pad 12 (cap top of the 16pt title 12 below the top),
  // 16 from the title to the cards; the strip itself runs edge to edge
  mainContainer: { paddingVertical: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: -16 * ABOVE_CAP,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  spaceBetween: { justifyContent: "space-between" },
  listContent: {
    paddingTop: 16 - 16 * BELOW_BASELINE,
    paddingHorizontal: 12,
    gap: 8,
  },
  cardOutline: {
    width: 303,
    height: 60,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(18, 18, 18, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  cardInner: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 10,
    gap: 8,
  },
  identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  image: { position: "absolute", height: 40, width: 40, borderRadius: 8 },
  logoFallback: { alignItems: "center", justifyContent: "center" },
  // Figma "Chips": r4, pad 3, #007BFF, 1pt white stroke, SemiBold 10
  newChip: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.white,
    backgroundColor: "#007BFF",
    // stroke sits inside Figma's pad 3 → 1 border + 2
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  // Figma: rows 12 (icon) and 14 (badge) tall, 4 apart; in RN they are 14
  // and 19.6 (the 1.4 line boxes), centred, so the gap shrinks to 0.2
  texts: { flex: 1, justifyContent: "center", gap: 4 - (14 - 12) / 2 - (19.6 - 14) / 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  listenersRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  shrink: { flexShrink: 1 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  progress: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: COLORS.green1,
  },
});
