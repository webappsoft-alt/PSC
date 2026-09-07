import React, { useState } from "react";
import {View, TouchableOpacity, StyleSheet, Image} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import Icons from "../../../../components/Icons";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import { Images } from "../../../../assets/images";
import { useTheme } from "../../../../contexts/ThemeContext";
import Text from "../../../../components/ScaledText";

const GoldPlanGift = () => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState("yearly");

  return (
    <View style={styles.container}>
      <View style={styles.giftRow}>
        <Icons
          family="Ionicons"
          name="checkmark-circle"
          color="#64CD75"
          size={15}
        />
        <Image source={Images.timer} style={{ height: 12, width: 12 }} />
        <Text style={[styles.giftText, { color: colors.textSecondary }]}>2 months as a gift !</Text>
      </View>

      <View style={[styles.planContainer, { backgroundColor: colors.surfaceAlt }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.planButton, { flex: 1 }]}
          onPress={() => setSelected("yearly")}
        >
          {selected === "yearly" ? (
            <LinearGradient
              colors={["#967A4F", "#D4A156"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.priceText}>
                $15.99<Text style={styles.subText}>/yr</Text>
              </Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-15%</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.unselectedButton}>
              <Text style={[styles.priceTextUnselected, { color: colors.text }]}>
                $15.99<Text style={[styles.subTextGray, { color: colors.textSecondary }]}>/yr</Text>
              </Text>
              <View style={[styles.discountBadgeUnselected, { backgroundColor: colors.surface }]}>
                <Text style={[styles.discountText, { color: colors.text }]}>-15%</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.planButton, { flex: 1.2 }]}
        >
          <View style={[styles.unselectedButton]}>
            <Text
              style={[
                styles.priceTextUnselected,
                { color: colors.text },
                selected === "monthly" && { color: "#fff" },
              ]}
            >
              $159.90<Text style={[styles.subTextGray, { color: colors.textSecondary }]}>/mo</Text>
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GoldPlanGift;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 8,
    marginTop: 6,
  },
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  giftText: {
    fontSize: 12,
    color: COLORS.gray64,

    fontFamily: fonts.regular,
  },
  planContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardColor,
    borderRadius: 30,
    padding: 4,
  },
  planButton: {
    borderRadius: 30,
    overflow: "hidden",
    height: 48,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unselectedButton: {
    flex: 1,
    borderRadius: 30,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  priceText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: fonts.medium,
  },
  priceTextUnselected: {
    fontSize: 16,
    color: "#fff",
    fontFamily: fonts.medium,
  },
  subText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    fontFamily: fonts.regular,
  },
  subTextGray: {
    fontSize: 14,
    color: "#999",
  },
  discountBadge: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  discountBadgeUnselected: {
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  discountText: {
    fontSize: 12,
    color: COLORS.black,
    fontFamily: fonts.semiBold,
    marginTop: 2,
  },
});
