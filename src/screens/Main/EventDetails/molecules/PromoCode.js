import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import CustomText from "../../../../components/CustomText";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";

import { Images } from "../../../../assets/images";
import Icons from "../../../../components/Icons";

const PromoCode = () => {
  return (
    <View style={styles.card}>
      {/* ✅ HEADER */}
      <TouchableOpacity style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image
            source={Images.promo_code}
            style={{ height: 20, width: 20, tintColor: COLORS.white }}
          />
          <CustomText
            label="Apply A Promo Code"
            fontFamily={fonts.semiBold}
            fontSize={16}
          />
        </View>

        <Icons
          family={"Entypo"}
          name={"chevron-down"}
          color={COLORS.gray64}
          size={22}
        />
      </TouchableOpacity>

      <View style={styles.learnRow}>
        <View>
          <View style={styles.discountCard}>
            <Image
              source={Images.promo_code}
              style={{ height: 12, width: 12, tintColor: COLORS.white }}
            />
            <CustomText label="-10%" fontFamily={fonts.medium} fontSize={12} />
          </View>
          <CustomText
            label="WELCOME10"
            fontFamily={fonts.medium}
            fontSize={16}
          />
        </View>

        <TouchableOpacity>
          <Icons
            color={COLORS.gray64}
            size={22}
            family={"Entypo"}
            name={"chevron-right"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PromoCode;

const styles = StyleSheet.create({
  card: {
    padding: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountCard: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: "#1D9053",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: 2,
  },
  learnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBg,
  },
});
