import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import Icons from "../../../../components/Icons";
import ErrorComponent from "../../../../components/ErrorComponent";
const PassCard = ({
  title,
  pricePerPerson,
  subtitle,
  includes,
  note,
  price,
  unitPrice,
  quantity = 0,
  onIncrement,
  onDecrement,
  onRemove,
  isDiscounted = false,
  oldPrice = 0,
  isSoldOut = false,
  showTrash = false,
  otherInfo,
}) => {
  return (
    <View style={[styles.card, isSoldOut && styles.soldOutCard]}>
      <View style={styles.headerRow}>
        <CustomText
          label={title}
          fontFamily={fonts.medium}
          fontSize={16}
          lineHeight={16 * 1.2}
        />

        {isSoldOut && (
          <View style={styles.soldOutBadge}>
            <CustomText
              label="Sold Out"
              color="#EE1045"
              fontSize={12}
              fontFamily={fonts.medium}
            />
          </View>
        )}
      </View>

      <CustomText
        label={`$${pricePerPerson} Per Person`}
        fontFamily={fonts.medium}
        fontSize={14}
        lineHeight={14 * 1.4}
      />

      {subtitle && (
        <CustomText label={subtitle} fontSize={12} fontFamily={fonts.medium} />
      )}

      {includes && (
        <CustomText
          label={`Includes: ${includes}`}
          color={COLORS.gray48}
          fontSize={12}
        />
      )}
      {otherInfo && (
        <CustomText
          label={`${otherInfo}`}
          color={COLORS.gray48}
          fontSize={12}
        />
      )}
      {note && (
        <ErrorComponent
          errorTitle={note}
          color={COLORS.btnColor}
          marginBottom={0}
        />
      )}

      <View style={styles.bottomRow}>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {price && (
              <CustomText
                label={`$${price} `}
                color={isDiscounted ? "#37B874" : COLORS.white}
                fontSize={16}
                fontFamily={fonts.medium}
              />
            )}

            {isDiscounted && oldPrice && (
              <CustomText
                label={`$${oldPrice}`}
                color={COLORS.gray64}
                fontSize={14}
                textStyle={{
                  textDecorationLine: "line-through",
                }}
              />
            )}

            {unitPrice && (
              <CustomText
                label={`($${unitPrice} per unit)`}
                color={COLORS.gray1}
                fontSize={12}
              />
            )}
          </View>
        </View>

        {!isSoldOut && (
          <View style={styles.counterRow}>
            {showTrash ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onRemove}
                activeOpacity={0.9}
              >
                <Icons
                  family={"MaterialIcons"}
                  name={"delete-forever"}
                  size={20}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            ) : quantity > 0 ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onDecrement}
                activeOpacity={0.9}
              >
                <Icons
                  family={"FontAwesome6"}
                  name={"minus"}
                  size={17}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            ) : null}

            <CustomText
              label={quantity.toString()}
              marginHorizontal={16}
              fontFamily={fonts.medium}
            />

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onIncrement}
              activeOpacity={0.9}
            >
              <Image
                source={Images.plus}
                style={{
                  height: 24,
                  width: 24,
                  tintColor: COLORS.white,
                  resizeMode: "contain",
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default PassCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.inputBg,
    borderRadius: 12,
    padding: 12,
    paddingVertical: 7,
    marginBottom: 8,
    marginHorizontal: 12,
  },

  soldOutCard: {},

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  soldOutBadge: {
    backgroundColor: "#EE10450A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    top: 6,
    borderRadius: 99,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 2,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  iconBtn: {
    height: 32,
    width: 32,
    borderRadius: 99,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
});
