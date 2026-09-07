import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";

const TicketCard = ({
  title,
  pricePerPerson,
  subtitle,
  note,
  quantity = 0,
  onIncrement,
  onDecrement,
  isSoldOut = false,
  totalQuantity,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return (
    <View style={[styles.card, isSoldOut && styles.soldOutCard]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <CustomText label={title} fontFamily={fonts.medium} fontSize={16} />
          <CustomText
            label={`$${pricePerPerson} Per Person`}
            fontFamily={fonts.medium}
            fontSize={14}
          />
        </View>

        {isSoldOut ? (
          <View style={styles.soldOutBadge}>
            <CustomText
              label="Sold Out"
              color="#EE1045"
              fontSize={12}
              fontFamily={fonts.medium}
            />
          </View>
        ) : (
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={onDecrement}>
              <Icons
                family={"FontAwesome6"}
                name={"minus"}
                size={17}
                color={colors.text}
              />
            </TouchableOpacity>

            <CustomText
              label={quantity.toString()}
              marginHorizontal={12}
              fontFamily={fonts.medium}
            />

            <TouchableOpacity style={styles.iconBtn} onPress={onIncrement}>
              <Image
                source={Images.plus}
                style={{
                  height: 24,
                  width: 24,
                  tintColor: colors.text,
                  resizeMode: "contain",
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {subtitle && (
        <CustomText
          label={subtitle}
          color={colors.iconMuted}
          fontSize={12}
          marginTop={1}
        />
      )}

      {note && (
        <View style={styles.infoCard}>
          <CustomText
            label={note}
            color={COLORS.btnColor}
            fontSize={12}
            fontFamily={fonts.medium}
            lineHeight={12 * 1.4}
          />
        </View>
      )}
    </View>
  );
};

export default TicketCard;

const createStyles = (colors, isDark) => StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  soldOutCard: {},

  topRow: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },

  soldOutBadge: {
    backgroundColor: "#EE10450A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
  },
  infoCard: {
    backgroundColor: COLORS.btnSoftColor,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    marginTop: 8,
  },
});
