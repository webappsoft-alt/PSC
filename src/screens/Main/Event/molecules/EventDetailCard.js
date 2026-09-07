import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { Images } from "../../../../assets/images";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

import CustomText from "../../../../components/CustomText";
import ImageFast from "../../../../components/ImageFast";
import Icons from "../../../../components/Icons";
import fonts from "../../../../assets/fonts";
import moment from "moment";

const EventDetailCard = ({
  borderTopWidth = 4,
  onCardPress,
  item,
  onInfoPress,
  marginBottom,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const createdAtMonth = item?.startDate
    ? moment(item.startDate).format("MMM").toUpperCase()
    : "MAR";
  const createdAtDay = item?.startDate
    ? moment(item.startDate).format("DD")
    : "31";

  const startDateFormatted = item?.startDate
    ? moment(item.startDate).format("DD MMMM").toUpperCase()
    : "";

  const mainImage = item?.media?.[0]?.url;
  const secondImage = item?.media?.[1]?.url;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onCardPress}
      style={[styles.container, { borderTopWidth, marginBottom }]}
    >
      <View style={styles.dateContainer}>
        <CustomText
          label={createdAtMonth}
          fontSize={16}
          color={"#A5A5A5"}
          textAlign="center"
        />
        <CustomText
          label={createdAtDay}
          color={colors.text}
          fontSize={30}
          fontFamily={fonts.semiBold}
          textAlign="center"
        />
      </View>

      <View style={styles.rightContainer}>
        <View style={styles.imageWrapper}>
          <ImageFast source={{ uri: mainImage }} style={styles.img}>
            <Image
              source={Images.signerLogo}
              style={styles.icon}
              resizeMode="contain"
            />
          </ImageFast>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Image
            source={{ uri: secondImage }}
            style={{ height: 62, width: 62, marginTop: 10, borderRadius: 8 }}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.remindBtn}>
              <Image source={Images.bell_plus} style={[styles.icon2, { tintColor: colors.text }]} />
              <CustomText
                label="Remind Me"
                color={colors.textSecondary}
                fontSize={14}
                marginTop={4}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoBtn} onPress={onInfoPress}>
              <Icons
                family="MaterialIcons"
                name="info-outline"
                size={23}
                color={colors.text}
              />
              <CustomText
                label="Info"
                color={colors.textSecondary}
                fontSize={14}
                marginTop={4}
              />
            </TouchableOpacity>
          </View>
        </View>

        <CustomText
          label={`COMING ON ${startDateFormatted}`}
          fontSize={14}
          fontFamily={fonts.medium}
          color={colors.text}
          marginTop={8}
          textTransform="uppercase"
        />

        <CustomText
          label={item?.eventName}
          fontSize={28}
          fontFamily={fonts.semiBold}
          color={colors.text}
        />

        <CustomText
          label={item?.whatGuestCanExpect}
          fontSize={12}
          color={"#A2A2A2"}
          fontFamily={fonts.medium}
        />

        <CustomText
          label={item?.aboutThisEvent}
          fontSize={12}
          color={"#A8A8A8"}
          numberOfLines={2}
        />

        <View style={styles.tagsRow}>
          {item?.category?.slice(0, 4).map((tag, index, arr) => (
            <View
              key={index}
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <CustomText
                label={tag}
                fontSize={12}
                color={colors.textSecondary}
                marginLeft={index == 0 ? 0 : 3}
              />
              {index !== arr.length - 1 && (
                <CustomText label="•" fontSize={20} color={colors.textSecondary} />
              )}
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EventDetailCard;

const createStyles = (colors, isDark) => StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderTopColor: colors.surfaceAlt,
  },
  dateContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 45,
  },
  rightContainer: {
    flex: 1,
    marginLeft: 10,
  },
  imageWrapper: {
    position: "relative",
  },
  img: {
    width: "100%",
    height: 170,
    borderRadius: 8,
    resizeMode: "cover",
  },
  imageHeader: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  icon: {
    width: 20,
    height: 20,
    margin: 12,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  remindBtn: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  infoBtn: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  genreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  icon2: {
    height: 24,
    width: 24,
    resizeMode: "contain",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
});
