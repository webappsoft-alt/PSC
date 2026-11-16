import { useRoute } from "@react-navigation/native";
import moment from "moment";
import { FlatList, Linking, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../assets/fonts";
import CustomText from "../../../components/CustomText";
import Header from "../../../components/Header";
import Icons from "../../../components/Icons";
import LogoAvatar from "../../../components/LogoAvatar";
import ScreenWrapper from "../../../components/ScreenWrapper";

const X = (fs) => fs * 0.35;
const INK = "#121212";
const W4 = "rgba(255, 255, 255, 0.04)";
const W48 = "rgba(255, 255, 255, 0.48)";

const T = ({ fs, ls = 0, ff = fonts.regular, color = "#FFFFFF", ...rest }) => (
  <CustomText fontSize={fs} letterSpacing={ls} fontFamily={ff} color={color} marginTop={-X(fs)} marginBottom={-X(fs)} {...rest} />
);

const open = (url) => url && Linking.openURL(url).catch(() => {});

/**
 * Financial Reports "SEE MORE" (Figma SEE-MORE-FINANCIAL-REPORTS 8382:5750):
 * #121212 list, rows 64 (padding 16, gap 8) — 32 company logo · title
 * Medium 16 −0.64 / PDF • date Regular 12 −0.24 white 48% (gap 8, 3pt dot
 * white 16%) · 32 circle white 4% with `visibility` 16 — 1px white 4% rules.
 */
const FinancialReports = () => {
  const { reports = [], logo } = useRoute().params || {};

  return (
    <ScreenWrapper
      paddingHorizontal={0.1}
      scrollEnabled={false}
      headerUnScrollable={() => (
        <View style={styles.header}>
          <Header title="Financial Reports" textTransform="none" />
        </View>
      )}
    >
      <FlatList
        data={reports}
        keyExtractor={(r, i) => `${r.url}-${i}`}
        style={styles.list}
        ItemSeparatorComponent={() => <View style={styles.rule} />}
        renderItem={({ item: r }) => (
          <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={() => open(r.url)}>
            {logo ? (
              <LogoAvatar uri={logo} size={32} radius={0} />
            ) : (
              <View style={[styles.tile, styles.center]}>
                <Icons family="MaterialSymbolsRoundedFilled" name="description" size={16} color={W48} />
              </View>
            )}
            <View style={styles.text}>
              <T fs={16} ls={-0.64} ff={fonts.medium} label={r.title} numberOfLines={1} />
              <View style={styles.meta}>
                {[r.format, r.publishedAt && moment(r.publishedAt).format("MMM D, YYYY")]
                  .filter(Boolean)
                  .map((m, k) => (
                    <View key={k} style={styles.meta}>
                      {k > 0 && <View style={styles.dot} />}
                      <T fs={12} ls={-0.24} color={W48} label={m} />
                    </View>
                  ))}
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.7} hitSlop={8} style={styles.eye} onPress={() => open(r.url)}>
              <Icons family="MaterialSymbolsRoundedFilled" name="visibility" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
};

export default FinancialReports;

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1, borderBottomColor: "#262626" },
  list: { flex: 1, backgroundColor: INK },
  center: { alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16 },
  tile: { width: 32, height: 32, backgroundColor: W4 },
  text: { flex: 1, gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 2 },
  dot: { width: 3, height: 3, borderRadius: 100, backgroundColor: "rgba(255, 255, 255, 0.16)" },
  eye: { width: 32, height: 32, borderRadius: 100, backgroundColor: W4, alignItems: "center", justifyContent: "center" },
  rule: { height: 1, backgroundColor: W4 },
});
