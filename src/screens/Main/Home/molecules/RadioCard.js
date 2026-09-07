import { useCallback } from "react";
import { StyleSheet, TouchableOpacity, View, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import SoundPlayer from "react-native-sound-player";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
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
      {/* Header */}
      <View style={[styles.row, styles.spaceBetween]}>
        <View style={styles.row}>
          <CustomText
            label="TOP"
            color={colors.textSecondary}
            fontFamily={fonts.medium}
          />
          <CustomText
            label="RADIOS"
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

      {/* Horizontal Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {data?.map((item, index) => {
          const avatar = item?.userId?.profile?.avatar;
          const profileColor = item?.userId?.profile?.profileColor;
          const listeners = item?.play?.length || 0;
          const timeAgo = moment(item?.createdAt).fromNow();

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("RadioDetail", { item })}
              style={[styles.cardOutline, { backgroundColor: colors.surface }]}
              key={item?._id || index}
            >
              {/* <Blur blurType="dark" /> */}
              <View
                style={[
                  styles.cardInner,
                  { backgroundColor: colors.background },
                ]}
              >
                {/* User Avatar or Profile Color */}
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.image} />
                ) : (
                  <View
                    style={[
                      styles.image,
                      {
                        backgroundColor: profileColor || COLORS.buttonColor,
                        borderRadius: 8,
                      },
                    ]}
                  />
                )}

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    <Image
                      source={Images.friendGray}
                      style={[
                        styles.smallIcon,
                        { tintColor: isDark ? colors.white : COLORS.black },
                      ]}
                    />
                    <CustomText
                      label={`${listeners} listener${
                        listeners !== 1 ? "s" : ""
                      }`}
                      fontSize={10}
                      fontFamily={fonts.medium}
                      color={colors.textSecondary}
                    />
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.surfaceAlt },
                      ]}
                    />
                    <CustomText
                      label={timeAgo}
                      fontSize={10}
                      fontFamily={fonts.medium}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.row}>
                    <CustomText
                      label={item?.title || "Untitled"}
                      fontFamily={fonts.medium}
                      numberOfLines={1}
                      color={colors.text}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>

                {/* Actions */}
                {/* <ImageFast source={Images.radio} style={styles.radioIcon} /> */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={
                    playingRadioId === item?._id
                      ? handleStop
                      : () => handlePlay(item)
                  }
                  style={{ overflow: "hidden", borderRadius: 99 }}
                >
                  <Blur blurType={isDark ? "dark" : "light"} />
                  <Image
                    source={
                      playingRadioId === item?._id
                        ? Images.playerStop
                        : Images.playBg
                    }
                    style={[
                      styles.playIcon,
                      {
                        tintColor: isDark ? COLORS.white : COLORS.black,
                      },
                    ]}
                  />
                </TouchableOpacity>
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
  mainContainer: {
    padding: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  spaceBetween: {
    justifyContent: "space-between",
  },

  listContent: {
    paddingTop: 10,
  },

  cardOutline: {
    height: 60,
    width: 303,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginRight: 8,
    overflow: "hidden",
  },

  cardInner: {
    height: 52,
    width: 295,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    gap: 8,
  },

  image: {
    height: 40,
    width: 40,
    borderRadius: 8,
  },

  smallIcon: {
    height: 12,
    width: 12,
  },

  verifiedIcon: {
    height: 14,
    width: 14,
  },

  radioIcon: {
    height: 24,
    width: 24,
    marginLeft: "auto",
  },

  playIcon: {
    height: 32,
    width: 32,
  },

  dot: {
    height: 4,
    width: 4,
    borderRadius: 99,
    marginHorizontal: 4,
  },
});
