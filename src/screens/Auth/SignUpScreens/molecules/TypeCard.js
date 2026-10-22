import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import {
  capTop,
  ls,
  useAuthPalette,
} from "../../../../components/Auth/AuthKit";
import fonts from "../../../../assets/fonts";

/**
 * "Card Type - horizontal": 351 × 160, radius 12, padding 16.
 * Selected: A19375 4% fill + 2px A19375 stroke; otherwise 1px FFFFFF 4%.
 * Row = Material icon 32 (64%) + Medium 22 title, gap 8; description
 * Regular 14 (-1%, 64%) 16 below.
 */
const TypeCard = ({ icon, title, description, selected, onPress }) => {
  const p = useAuthPalette();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: selected ? p.gold04 : "transparent" }]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.stroke,
          selected
            ? { borderWidth: 2, borderColor: p.gold }
            : { borderWidth: 1, borderColor: p.t04 },
        ]}
      />
      <View style={styles.row}>
        <Icons
          family="MaterialSymbolsRoundedFilled"
          name={icon}
          size={28}
          color={p.t64}
        />
        <CustomText
          label={title}
          fontSize={22}
          fontFamily={fonts.medium}
          color={p.text}
        />
      </View>
      <CustomText
        label={description}
        fontSize={14}
        letterSpacing={ls(-1, 14)}
        color={p.t64}
        marginTop={16 - capTop(14)}
      />
    </TouchableOpacity>
  );
};

export default TypeCard;

const styles = StyleSheet.create({
  card: {
    height: 160,
    borderRadius: 12,
    padding: 16,
  },
  stroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    gap: 8,
  },
});
