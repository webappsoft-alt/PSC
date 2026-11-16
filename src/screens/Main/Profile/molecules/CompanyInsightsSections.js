import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import LogoAvatar from "../../../../components/LogoAvatar";
import { AboutIcon } from "./AboutIcons";

const INK = "#121212";
const W48 = "rgba(255, 255, 255, 0.48)";
const W64 = "rgba(255, 255, 255, 0.64)";
const W4 = "rgba(255, 255, 255, 0.04)";
const GOLD = "#A19375";
const X = (fs) => fs * 0.35;

const T = ({
  fs,
  ls = 0,
  ff = fonts.regular,
  color = "#FFFFFF",
  trim = true,
  ...rest
}) => (
  <CustomText
    fontSize={fs}
    letterSpacing={ls}
    fontFamily={ff}
    color={color}
    {...(trim ? { marginTop: -X(fs), marginBottom: -X(fs) } : {})}
    {...rest}
  />
);

/** Figma section subtitle: Regular 12 white 64% with the company name white Medium */
export const RichSub = ({ before, name, after, ls = 0 }) => (
  <Text style={[styles.sub, { letterSpacing: ls }]}>
    {before}
    <Text style={styles.subName}>{name}</Text>
    {after}
  </Text>
);

// legend/segment palette (Figma 8064:13706 legend dots); gray = Undisclosed
const SEGMENT = [
  "#BA9CEC",
  "#F7CB40",
  "#C83759",
  "#4F9DE8",
  "#7BC67E",
  "#F08F57",
  "#8ED1DC",
  "#D9A7E0",
];
const UNDISCLOSED = "#929292";

/** Donut 119pt, ring 8pt, flat segment ends + 2pt gaps (Figma Gauge/Style 1:
 * two half-gauge instances, Thickness 24 at 360 scaled to 118.68 → 7.91) */
const Donut = ({ slices }) => {
  const size = 119;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = Math.max(
    slices.reduce((s, x) => s + x.pct, 0),
    100,
  );
  const gap = 2;
  let offset = 0;
  return (
    <Svg width={size} height={size}>
      {slices.map((s, i) => {
        const len = (s.pct / total) * c;
        const el = (
          <Circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(len - gap, 1)} ${c}`}
            strokeDashoffset={-(offset + gap / 2)}
            strokeLinecap="butt"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return el;
      })}
    </Svg>
  );
};

/** Section title 18 Medium −0.5 (+ "SEE MORE" 12 SemiBold, Figma text case UPPER · 16 circle, gold chevron) */
const Header = ({ title, onMore }) => (
  <View style={styles.headerRow}>
    <T
      fs={18}
      ls={-0.5}
      ff={fonts.medium}
      label={title}
      containerStyle={styles.grow}
    />
    {!!onMore && (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onMore}
        style={styles.more}
        hitSlop={8}
      >
        <T fs={12} ff={fonts.semiBold} color={W64} label="SEE MORE" />
        <View style={styles.moreCircle}>
          <AboutIcon name="see" size={14} color={GOLD} />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

/** Premium unlock card (Figma 2085664215) — also used where a premium
 * section is hidden for non-subscribers (Workplace Reputation). */
// Figma: white 4% r8 card, 32/12, lock 56 white 64%, texts centred
export const UNLOCK_COPY = {
  ownership: {
    title: "Unlock Ownership Insights",
    subtitle: "Get the full shareholder breakdown and ownership structure with PSC Premium.",
  },
  financial: {
    title: "Unlock Financial Insights",
    subtitle: "Access annual reports, key metrics and detailed financial data with PSC Premium.",
  },
  workplace: {
    title: "Unlock Workplace Insights",
    subtitle: "Access employee ratings, reviews and detailed workplace insights with PSC Premium.",
  },
};

export const UnlockCard = ({
  onPress,
  title = "Unlock Enhanced Company Insights with PSC Premium",
  subtitle = "Access financial performance, workplace ratings, and detailed company intelligence with PSC Premium.",
}) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.unlockCard}
    >
      <Icons
        family="MaterialSymbolsRoundedFilled"
        name="lock"
        size={56}
        color={W64}
      />
      <View style={styles.unlockTexts}>
        <T
          fs={18}
          ls={-0.72}
          ff={fonts.medium}
          label={title}
          textAlign="center"
        />
        <T
          fs={12}
          color={W64}
          label={subtitle}
          textAlign="center"
        />
      </View>
    </TouchableOpacity>
);

/**
 * Shareholders & Ownership + Financial Reports (Figma Profile › Careem
 * 8064:13706; publicly traded companies only). Non-subscribers get the
 * unlock card instead of the data (client: "we will hide it to
 * none-subscribers"); tapping it opens Plans.
 */
const CompanyInsightsSections = ({ insights, name, logo }) => {
  const navigation = useNavigation();
  if (!insights) return null;

  // non-subscribers: every premium section keeps its own box (title +
  // subtitle) with a lock card instead of the data (client mock)
  if (insights.locked) {
    const unlock = () => navigation.navigate("Plans");
    return (
      <>
        <View style={styles.section}>
          <View style={styles.titleBlock}>
            <Header title="Shareholders & Ownership" />
            <RichSub
              before="Discover who owns "
              name={name}
              after=" & how its shares are distributed."
            />
          </View>
          <UnlockCard onPress={unlock} {...UNLOCK_COPY.ownership} />
        </View>
        {!!insights.sections?.reports && (
          <View style={styles.section}>
            <View style={styles.titleBlock}>
              <Header title="Financial Reports" />
              <RichSub
                before="Take a closer look at "
                name={name}
                after="’s financial performance & growth."
                ls={-0.24}
              />
            </View>
            <UnlockCard onPress={unlock} {...UNLOCK_COPY.financial} />
          </View>
        )}
      </>
    );
  }

  const shares = insights.shareholders || [];
  const slices = [
    ...shares
      .filter((s) => s.pct != null)
      .map((s, i) => ({ pct: s.pct, color: SEGMENT[i % SEGMENT.length] })),
    ...(insights.undisclosedPct
      ? [{ pct: insights.undisclosedPct, color: UNDISCLOSED }]
      : []),
  ];
  const legend = [
    ...shares.map((s, i) => ({
      name: s.name,
      pct: s.pct,
      color: SEGMENT[i % SEGMENT.length],
    })),
    ...(insights.undisclosedPct
      ? [
          {
            name: "Undisclosed Ownership",
            pct: insights.undisclosedPct,
            color: UNDISCLOSED,
          },
        ]
      : []),
  ];
  const own = insights.ownership;
  const reports = insights.reports || [];

  return (
    <>
      <View style={styles.section}>
        <View style={styles.titleBlock}>
          <Header title="Shareholders & Ownership" />
          <RichSub
            before="Discover who owns "
            name={name}
            after=" & how its shares are distributed."
          />
        </View>
        {insights.noShareholderInfo ? (
          // client spec wording when no reliable shareholder data exists
          <T
            fs={12}
            color={W48}
            label="Information Not Available"
            trim={false}
          />
        ) : (
          <View style={styles.ownRow}>
            {slices.length > 0 && <Donut slices={slices} />}
            <View style={styles.legend}>
              {legend.map((l, i) => (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: l.color }]} />
                  <T
                    fs={12}
                    ls={-0.48}
                    color={W64}
                    label={l.name}
                    numberOfLines={1}
                    containerStyle={styles.grow}
                  />
                  {l.pct != null && (
                    <T
                      fs={12}
                      ls={-0.24}
                      ff={fonts.medium}
                      label={`${l.pct}%`}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
        {!!own && (
          <View style={styles.sourceRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.sourceLink}
              disabled={!own.sourceUrl}
              onPress={() =>
                own.sourceUrl && Linking.openURL(own.sourceUrl).catch(() => {})
              }
            >
              <T
                fs={12}
                ls={-0.24}
                color={GOLD}
                label={`Source: ${own.sourceName}`}
              />
              {!!own.sourceUrl && (
                <Icons
                  family="MaterialSymbolsRounded"
                  name="link"
                  size={12}
                  color={GOLD}
                />
              )}
            </TouchableOpacity>
            <T
              fs={12}
              ls={-0.24}
              color={W48}
              label={`As of: ${moment(own.verifiedAt || own.asOf).format(
                "MMM D, YYYY",
              )}`}
            />
          </View>
        )}
      </View>

      {reports.length > 0 && (
        <View style={styles.section}>
          <View style={styles.titleBlock}>
            <Header
              title="Financial Reports"
              onMore={() =>
                navigation.navigate("FinancialReports", { reports, logo, name })
              }
            />
            <RichSub
              before="Take a closer look at "
              name={name}
              after="’s financial performance & growth."
              ls={-0.24}
            />
          </View>
          <View>
            {reports.map((r, i) => (
              <View key={`${r.url}-${i}`}>
                {i > 0 && <View style={styles.rule} />}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.reportRow}
                  onPress={() => Linking.openURL(r.url).catch(() => {})}
                >
                  {i === 0 && logo ? (
                    <LogoAvatar uri={logo} size={64} radius={8} />
                  ) : (
                    <View style={[styles.tile, styles.center]}>
                      <Icons
                        family="MaterialSymbolsRoundedFilled"
                        name="description"
                        size={24}
                        color={W64}
                      />
                    </View>
                  )}
                  <View style={styles.reportText}>
                    <T
                      fs={16}
                      ls={-0.64}
                      ff={fonts.medium}
                      label={r.title}
                      numberOfLines={1}
                    />
                    <View style={styles.meta}>
                      {[
                        r.format,
                        r.publishedAt &&
                          moment(r.publishedAt).format("MMM D, YYYY"),
                      ]
                        .filter(Boolean)
                        .map((m, k) => (
                          <View key={k} style={styles.meta}>
                            {k > 0 && <View style={styles.metaDot} />}
                            <T fs={12} ls={-0.24} color={W48} label={m} />
                          </View>
                        ))}
                    </View>
                  </View>
                  <View style={styles.chevCircle}>
                    <Icons
                      family="MaterialSymbolsRounded"
                      name="chevron_right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
};

export default CompanyInsightsSections;

const styles = StyleSheet.create({
  // Figma section: #121212, padding 12, gap 16
  section: { backgroundColor: INK, padding: 12, gap: 16 },
  grow: { flex: 1, flexShrink: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  titleBlock: { gap: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 19,
  },
  more: { flexDirection: "row", alignItems: "center", gap: 4 },
  moreCircle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: W4,
    alignItems: "center",
    justifyContent: "center",
  },
  sub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: W64,
    lineHeight: 16.8,
    marginTop: -X(12),
    marginBottom: -X(12),
  },
  subName: { fontFamily: fonts.medium, color: "#FFFFFF" },
  // donut 119 · gap 12 · legend rows 8 high, 8 apart (Figma 2085664319)
  ownRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  legend: { flex: 1, gap: 8, justifyContent: "center" },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 100 },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sourceLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  // unlock card (Figma 2085664215): white 4%, r8, 32/12, gap 12, lock 56
  unlockCard: {
    borderRadius: 8,
    backgroundColor: W4,
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
  },
  unlockTexts: { gap: 16, alignSelf: "stretch" },
  // report rows: 64 tile · gap 8 · rules 1px white 4% with 12 around
  rule: {
    height: 1,
    backgroundColor: W4,
    borderRadius: 100,
    marginVertical: 12,
  },
  reportRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: W4,
    overflow: "hidden",
  },
  reportText: { flex: 1, gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 2 },
  metaDot: { width: 3, height: 3, borderRadius: 100, backgroundColor: "rgba(255, 255, 255, 0.16)" },
  chevCircle: {
    width: 32,
    height: 32,
    borderRadius: 100,
    backgroundColor: W4,
    alignItems: "center",
    justifyContent: "center",
  },
});
