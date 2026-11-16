import { useNavigation } from "@react-navigation/native";
import { Image, Pressable, StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import { PNGIcons } from "../../../../assets/images/icons";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import Divider from "../../../../components/Divider";
import { useTheme } from "../../../../contexts/ThemeContext";

// Figma Settings (2274:1656): 24pt Material icon, #A19375 at 64 %
const GLYPH_COLOR = "rgba(161, 147, 117, 0.64)";

const SettingsItems = ({ title, des, screen, img, glyph, glyphFamily = "MaterialSymbolsRounded", isLast, onPress }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <>
      <Pressable
        style={[styles.row, { paddingHorizontal: 12 }]}
        onPress={() => (onPress ? onPress() : navigation.navigate(screen))}
      >
        <View style={[styles.row, { flex: 1 }]}>
          {glyph ? (
            <View style={styles.icon}>
              <Icons family={glyphFamily} name={glyph} size={24} color={GLYPH_COLOR} />
            </View>
          ) : (
            <Image source={img ? img : PNGIcons.user} style={[styles.icon, { tintColor: colors.text }]} />
          )}
          <View style={{ width: "90%" }}>
            <CustomText
              label={title}
              fontSize={16}
              fontFamily={fonts.medium}
              lineHeight={16 * 1.4}
            />
            <CustomText
              label={des}
              fontSize={12}
              fontFamily={fonts.regular}
              color={colors.textSecondary}
              lineHeight={12 * 1.4}
              marginTop={4}
            />
          </View>
        </View>
        <Image source={Images.Arrow} style={[styles.nextIocn, { tintColor: colors.textSecondary }]} />
      </Pressable>
      {!isLast && (
        <Divider
          thickness={1}
          color={colors.surfaceAlt}
          marginTop={6}
          marginBottom={6}
        />
      )}
    </>
  );
};

export default SettingsItems;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 5,
  },
  icon: {
    height: 24,
    width: 24,
    resizeMode: "contain",
    alignItems: "center",
    justifyContent: "center",
  },
  nextIocn: {
    height: 12,
    width: 12,
    resizeMode: "contain",
  },
});
