import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import ImageFast from "../../../../components/ImageFast";
import moment from "moment";
import CustomText from "../../../../components/CustomText";
import { BlurView } from "@react-native-community/blur";
import { Images } from "../../../../assets/images";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const EventCard = ({ item, onPress }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const imageSource = item?.media?.[0]?.url
    ? { uri: item.media[0].url }
    : item?.image;

  const startDate = item?.startDate
    ? moment(item.startDate).format("MMM DD, YYYY")
    : item?.startDate;
  const endDate = item?.endDate
    ? moment(item.endDate).format("MMM DD, YYYY")
    : item?.endDate;

  const ticketsDetails = item?.ticketing?.ticketsDetails;
  const price = ticketsDetails?.[0]?.ticketPrice || item?.price || 0;
  const availableTickets =
    (Array.isArray(ticketsDetails)
      ? ticketsDetails.reduce((acc, curr) => acc + (curr?.stock || 0), 0)
      : 0) ||
    item?.availableTickets ||
    0;

  const creatorAvatar = item?.user?.profile?.avatar;
  const creatorName = item?.user?.firstName;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageWrapper}>
        <ImageFast
          source={imageSource}
          style={styles.eventImage}
          resizeMode="cover"
        />

        {/* {item?.discount && (
          <View style={styles.discountBlurWrapper}>
            <Image source={Images.tag} style={{ height: 12, width: 12 }} />
            <CustomText
              label={`-${item.discount}%`}
              fontSize={12}
              fontFamily={fonts.medium}
            />
          </View>
        )} */}

        {/* Sponsored Label */}
        {item?.sponsors?.length > 0 && (
          <BlurView
            blurAmount={16}
            blurType="light"
            style={styles.sponsoredBlurWrapper}
          >
            <View style={styles.sponsoredBadge}>
              <CustomText
                label="Sponsored"
                fontSize={12}
                fontFamily={fonts.medium}
              />
            </View>
          </BlurView>
        )}

        <View
          style={[
            styles.bookmarkWrapper,
            {
              borderColor: item?.user?.profile?.profileColor,
            },
          ]}
        >
          {item?.user?.profile?.avatar ? (
            <Image
              source={{ uri: creatorAvatar }}
              style={styles.bookmarkIcon}
            />
          ) : (
            <View
              style={{
                height: 32,
                width: 32,
                borderRadius: 99,
                backgroundColor: item?.user?.profile?.profileColor,
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          )}
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.newRow}>
          {item?.isNew && (
            <View style={styles.newTag}>
              <CustomText
                label="NEW"
                color="#1D9053"
                fontSize={8}
                fontFamily={fonts.semiBold}
              />
            </View>
          )}

          <CustomText
            label={item?.eventName || item?.title}
            fontSize={14}
            fontFamily={fonts.medium}
            numberOfLines={1}
          />
        </View>

        {/* Venue */}
        <View style={styles.row}>
          <Image
            source={Images.event}
            style={{
              width: 12,
              height: 12,
              tintColor: colors.text,
              resizeMode: "contain",
            }}
          />
          <CustomText
            label={item?.venueName || "Venue"}
            fontSize={12}
            fontFamily={fonts.medium}
            marginLeft={2}
          />
        </View>

        {/* Date Range */}
        <View style={styles.row}>
          <Image
            source={Images.smallCalender}
            style={{
              width: 12,
              height: 12,
              tintColor: colors.text,
              resizeMode: "contain",
              marginRight: 2,
            }}
          />
          <CustomText
            label={
              startDate && endDate
                ? `${startDate} - ${endDate}`
                : startDate || ""
            }
            fontSize={12}
            color={colors.iconMuted}
            marginLeft={2}
          />
        </View>

        {/* Price + Tickets Left */}
        <View style={styles.row}>
          <CustomText
            label={`$${price}`}
            fontSize={12}
            color="rgba(29, 144, 83, 1)"
            fontFamily={fonts.medium}
          />
          <View
            style={{
              height: 12,
              width: 1,
              backgroundColor: colors.border,
              borderRadius: 99,
              marginHorizontal: 4,
            }}
          />
          <Image
            source={Images.ticket_card}
            style={{
              width: 12,
              height: 12,
              tintColor: colors.text,
              resizeMode: "contain",
            }}
          />
          <CustomText
            label={`${availableTickets} tickets left`}
            fontSize={12}
            fontFamily={fonts.medium}
            marginLeft={2}
          />
        </View>

        {/* Creator/Friends Row */}
        {(creatorAvatar || creatorName) && (
          <View style={[styles.row]}>
            {creatorAvatar && (
              <Image source={{ uri: creatorAvatar }} style={styles.avatar} />
            )}
            <CustomText
              label={creatorName || ""}
              fontSize={12}
              fontFamily={fonts.medium}
              marginLeft={creatorAvatar ? 4 : 0}
            />
            {item?.friends?.length > 1 && (
              <CustomText
                label={` & ${item.friends.length - 1} others`}
                fontSize={12}
                color={colors.iconMuted}
              />
            )}
          </View>
        )}

        {/* Match % */}
        {item?.matchPercent && (
          <View style={styles.matchTag}>
            <CustomText
              label={`${item.matchPercent}% MATCH`}
              color={"#1D9053"}
              fontSize={12}
              fontFamily={fonts.medium}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default EventCard;

const createStyles = (colors, isDark) => StyleSheet.create({
  cardContainer: {
    width: 240,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 8,
    paddingLeft: 0,
    marginRight: 2,
    paddingTop: 0,
  },

  imageWrapper: {
    width: "100%",
    height: 135,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 6,
  },

  eventImage: {
    width: "100%",
    height: "100%",
  },

  discountBlurWrapper: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#1D9053",
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    paddingHorizontal: 6,
  },

  sponsoredBlurWrapper: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  bookmarkWrapper: {
    height: 32,
    width: 32,
    borderRadius: 99,
    position: "absolute",
    top: 8,
    left: 8,
    borderWidth: 1,
  },
  bookmarkIcon: {
    width: "100%",
    height: "100%",
    borderRadius: 99,
    resizeMode: "cover",
    alignSelf: "center",
  },

  bookmarkBlur: {
    height: "100%",
    width: "100%",
    position: "absolute",
  },

  discountBadge: {
    paddingVertical: 2,
    paddingHorizontal: 10,
  },

  sponsoredBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
  },

  content: {},

  newRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  newTag: {
    backgroundColor: "#1D905329",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  avatar: {
    width: 14,
    height: 14,
    borderRadius: 20,
  },

  matchTag: {
    marginTop: 5,
    backgroundColor: "#1D905329",
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
});
