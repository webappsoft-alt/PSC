import { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import SoundPlayer from "react-native-sound-player";
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
        dispatch(setPlayingRadioId(item._id));
        dispatch(setPlayingRadioData(item));
        dispatch(setAudioUrl(item.audio));
        dispatch(setShowRadioPlayer(true));
        post(`radio/${item._id}/play`);
      } catch (error) {
        console.log("Radio play error", error);
      }
    },
    [dispatch],
  );

  const handleStop = useCallback(() => {
    try {
      SoundPlayer.stop();
    } catch (_) {}
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
      {/* Figma "TOP RADIOS": Medium 14, "TOP" @48% */}
      <View style={[styles.row, styles.spaceBetween]}>
        <View style={styles.row}>
          <CustomText
            label="TOP"
            fontSize={14}
            letterSpacing={-0.07}
            color={COLORS.gray48}
            fontFamily={fonts.medium}
          />
          <CustomText
            label="RADIOS"
            fontSize={14}
            letterSpacing={-0.07}
            color={colors.text}
            fontFamily={fonts.medium}
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

      {/* Figma "Radio" card: 351 × 64, r20, pad 4, fill white 16% + 1px
          inside stroke #121212 16%, background blur; inner r16 #121212,
          row pad 6 gap 8: 40 logo r8 · listeners (Medium 10 @48%) ·
          name (Medium 14) + badge · 32px circles (volume + stop while
          playing, waveform + play otherwise); green progress bar when live. */}
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
          const isVerified =
            item?.userId?.role === "individual" ||
            item?.userId?.role === "company";

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("RadioDetail", { item })}
              style={styles.cardOutline}
              key={item?._id || index}
            >
              <Blur blurType={isDark ? "dark" : "light"} blurAmount={6} />
              <View
                style={[
                  styles.cardInner,
                  { backgroundColor: colors.background },
                ]}
              >
                <View style={styles.cardRow}>
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

                  <View style={{ flex: 1 }}>
                    <View style={styles.row}>
                      <Icons
                        family="MaterialSymbolsRoundedFilled"
                        name="group"
                        size={12}
                        color={COLORS.gray48}
                      />
                      <CustomText
                        label={`${listeners.toLocaleString()} listener${
                          listeners !== 1 ? "s" : ""
                        }`}
                        fontSize={10}
                        letterSpacing={-0.05}
                        fontFamily={fonts.medium}
                        color={COLORS.gray48}
                      />
                      <View style={styles.dot} />
                      <CustomText
                        label={timeLabel}
                        fontSize={10}
                        letterSpacing={-0.05}
                        fontFamily={fonts.medium}
                        color={COLORS.gray48}
                      />
                    </View>
                    <View style={styles.row}>
                      <CustomText
                        label={item?.title || "Untitled"}
                        fontFamily={fonts.medium}
                        fontSize={14}
                        letterSpacing={-0.07}
                        numberOfLines={1}
                        color={colors.text}
                        style={{ flexShrink: 1 }}
                      />
                      <UserBadge user={item?.userId} />
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <View
                      style={[
                        styles.circle,
                        { backgroundColor: colors.surfaceAlt },
                      ]}
                    >
                      <Icons
                        family="MaterialSymbolsRoundedFilled"
                        name={isPlaying ? "volume_up" : "graphic_eq"}
                        size={18}
                        color={colors.text}
                      />
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={isPlaying ? handleStop : () => handlePlay(item)}
                      style={[
                        styles.circle,
                        { backgroundColor: colors.surfaceAlt },
                      ]}
                    >
                      <Icons
                        family="MaterialSymbolsRoundedFilled"
                        name={isPlaying ? "stop" : "play_arrow"}
                        size={18}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
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

const styles = StyleSheet.create({
  // Figma section: pad H12 V12, list 10 below the title
  mainContainer: { padding: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  spaceBetween: { justifyContent: "space-between" },
  listContent: { paddingTop: 10, gap: 8 },
  cardOutline: {
    width: 351,
    height: 64,
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(18, 18, 18, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  cardInner: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 8,
  },
  image: { height: 40, width: 40, borderRadius: 8 },
  logoFallback: { alignItems: "center", justifyContent: "center" },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
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
    backgroundColor: COLORS.gray48,
    marginHorizontal: 2,
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
