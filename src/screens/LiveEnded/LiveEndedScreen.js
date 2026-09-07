import { useRoute } from "@react-navigation/native";
import {StyleSheet, View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../assets/fonts";
import { Movie } from "../../assets/svgs";
import CustomText from "../../components/CustomText";
import Header from "../../components/Header";
import Icons from "../../components/Icons";
import { useTheme } from "../../contexts/ThemeContext";
import { COLORS } from "../../utils/COLORS";
import Text from "../../components/ScaledText";

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function LiveEndedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const params = route.params || {};
  const { colors } = useTheme();

  const durationSeconds = Number(params.durationSeconds || "0");
  const totalViewers = Number(params.totalViewers || "0");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Back"
        marginTop={insets.top}
        onBackPress={() =>
          navigation.reset({ index: 0, routes: [{ name: "MainStack" }] })
        }
      />

      <View style={styles.emptyContainer}>
        <Movie
          height={80}
          width={80}
          color={colors.iconMuted}
          marginBottom={20}
        />
        <CustomText
          label="Live Ended"
          fontSize={32}
          fontFamily={fonts.BoldItalic}
          fontStyle={"italic"}
          color={colors.text}
          marginBottom={6}
        />
        <CustomText
          label={`Lasted: ${formatDuration(durationSeconds)}`}
          fontSize={14}
          fontFamily={fonts.medium}
          textStyle={styles.emptyText}
          color={colors.textSecondary}
          marginBottom={8}
        />
        <View style={styles.viewerRow}>
          <Icons
            family="MaterialIcons"
            name="group"
            size={16}
            color={colors.text}
          />
          <Text style={[styles.viewerCount, { color: colors.text }]}>
            {Math.max(0, totalViewers)}
          </Text>
          <Text style={[styles.viewerLabel, { color: colors.textSecondary }]}>
            viewers
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  viewerCount: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  viewerLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
});
