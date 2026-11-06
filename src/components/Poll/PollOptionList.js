import { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import fonts from "../../assets/fonts";
import { useTheme } from "../../contexts/ThemeContext";
import { COLORS } from "../../utils/COLORS";
import CustomText from "../CustomText";
import ImageFast from "../ImageFast";
import { formatOptionVotes } from "./pollUtils";
import InitialsFill from "../InitialsFill";

/**
 * Poll option rows — Figma Home-Feed poll card (8100:2454) and the
 * New-Poll alerts (3342:2737 before voting, 3342:2645 after).
 *
 * Row 40 tall, radius 12, white 4%, rows 6 apart, 12 side padding.
 * Results: a fill grows from the left (radius 12 on the left side):
 *   1st  → white fill, #121212 text, count = label size
 *   2nd  → white 16% fill, count Medium 12 @64%
 *   rest → white 4% fill, count Medium 10 @64%
 * (the Figma voter-avatar stacks (18pt, 8100:2547) are not shown — client:
 * a photo only when the option tags a PSC user, 24pt "Rectangle 5", plus the
 * viewer's own picture after the label on the option they voted for)
 * percentage on the right: Medium 14 white.
 * Label: Medium 14 in the feed, Medium 12 in the alert.
 */

const DARK_TEXT = "#121212";
const FILL = ["#FFFFFF", "rgba(255, 255, 255, 0.16)", "rgba(255, 255, 255, 0.04)"];

const tier = (rank) => (rank < 0 ? 2 : Math.min(rank, 2));

// Client (Nov 2026): election polls look like a normal poll in the feed —
// the fill follows the position only (Figma 8100:2454 has no candidate
// colour in the rows); party colours stay on the election detail page
const fillColor = (t) => FILL[t];

// Photo of the PSC user tagged in the option (24pt, Figma candidate rows),
// or the option's own picture (PSC official polls)
const OptionPhoto = ({ option }) => {
  const uri = option?.mentionUser?.profile?.avatar || option?.image;
  if (!uri && !option?.mentionUser) return null;
  return uri ? (
    <ImageFast source={{ uri }} removeLoading style={styles.optionImage} />
  ) : (
    // no photo → initials ("TR"), as everywhere else in the app
    <View style={[styles.optionImage, styles.clip]}>
      <InitialsFill user={option.mentionUser} name={option.text} size={24} />
    </View>
  );
};

// The viewer's own picture on the option they picked — first avatar of the
// Figma voter stack (8100:2548): 18 × 18, radius 100, 6 after the label
const MyVoteAvatar = ({ user }) => {
  if (!user) return null;
  const uri = user?.profile?.avatar;
  return uri ? (
    <ImageFast source={{ uri }} removeLoading style={styles.voterImage} />
  ) : (
    <View style={[styles.voterImage, styles.clip]}>
      <InitialsFill user={user} size={18} />
    </View>
  );
};

// A tagged option reads as the user's name (Figma "Marine Le Pen")
export const optionLabel = (option) => {
  const u = option?.mentionUser;
  if (!u) return option?.text || "";
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return name || u.username || option?.text || "";
};

// Left content of a result row: [photo] label [+votes]
// Client (Nov 2026): a photo only when the option tags a PSC user
// ("A tagged user in a post or text has its profile picture attached").
const RowContent = ({ option, rank, labelSize, dark, voter }) => {
  const t = tier(rank);
  const others = option.votesCount || 0;
  const countStyle =
    t === 0
      ? { fontSize: labelSize, color: dark ? DARK_TEXT : COLORS.white }
      : t === 1
      ? { fontSize: 12, color: COLORS.gray64 }
      : { fontSize: 10, color: COLORS.gray64 };
  return (
    <>
      <View style={styles.left}>
        <OptionPhoto option={option} />
        <CustomText
          label={optionLabel(option)}
          fontSize={labelSize}
          fontFamily={fonts.medium}
          color={dark ? DARK_TEXT : COLORS.white}
          numberOfLines={1}
          containerStyle={styles.labelWrap}
        />
        <MyVoteAvatar user={voter} />
        {others > 0 ? (
          <CustomText
            label={formatOptionVotes(others)}
            containerStyle={styles.noShrink}
            fontFamily={fonts.medium}
            letterSpacing={-0.005 * countStyle.fontSize}
            fontSize={countStyle.fontSize}
            color={countStyle.color}
          />
        ) : null}
      </View>
      <View style={styles.right}>
        <CustomText
          label={`${option.percent || 0}%`}
          fontSize={14}
          fontFamily={fonts.medium}
          color={dark ? DARK_TEXT : COLORS.white}
        />
      </View>
    </>
  );
};

const ResultRow = memo(
  ({ option, rank, labelSize, disabled, onPress, rowWidth, onRowLayout, voter }) => {
    const t = tier(rank);
    // dark text over the leader's white fill
    const isLeader = t === 0 && rank >= 0;
    // the fill is exactly the option's share of the row
    const target = ((option.percent || 0) / 100) * rowWidth;
    const width = useSharedValue(target);
    useEffect(() => {
      width.value = withTiming(target, { duration: 350 });
    }, [target, width]);
    const fillStyle = useAnimatedStyle(() => ({ width: width.value }));

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={onPress}
        onLayout={onRowLayout}
        style={styles.row}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: fillColor(t) },
            fillStyle,
          ]}
        />
        {/* white text on the dark part of the row */}
        <RowContent
          option={option}
          rank={rank}
          labelSize={labelSize}
          voter={voter}
        />
        {/* leader: the part of the text over the white fill turns dark
            (same row drawn again, clipped to the fill) */}
        {isLeader && rowWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.fillClip, fillStyle]}
          >
            <View style={[styles.rowInner, { width: rowWidth }]}>
              <RowContent
                option={option}
                rank={rank}
                labelSize={labelSize}
                voter={voter}
                dark
              />
            </View>
          </Animated.View>
        ) : null}
      </TouchableOpacity>
    );
  },
);

const PollOptionList = ({
  poll,
  showResults,
  onVote,
  disabled,
  variant = "feed",
}) => {
  const { colors } = useTheme();
  // the logged-in user, shown on the option they voted for
  const userData = useSelector((state) => state.users.userData);
  const [rowWidth, setRowWidth] = useState(0);
  const labelSize = variant === "alert" ? 12 : 14;
  const options = poll?.options || [];

  // results: most voted first (Figma), ties keep the author's order
  const ordered = useMemo(() => {
    if (!showResults) return options;
    return options
      .map((o, i) => ({ o, i }))
      .sort((a, b) => (b.o.votesCount || 0) - (a.o.votesCount || 0) || a.i - b.i)
      .map(({ o }) => o);
  }, [options, showResults]);

  return (
    <View style={styles.list}>
      {ordered.map((option, index) =>
        showResults ? (
          <ResultRow
            key={String(option._id)}
            option={option}
            // client: the white / 16% / 4% shades follow the position
            rank={index}
            labelSize={labelSize}
            disabled={disabled}
            rowWidth={rowWidth}
            voter={
              poll?.myVote && String(option._id) === String(poll.myVote)
                ? userData
                : null
            }
            onRowLayout={
              index === 0
                ? (e) => setRowWidth(e.nativeEvent.layout.width)
                : undefined
            }
            onPress={() => onVote?.(option._id)}
          />
        ) : (
          <TouchableOpacity
            key={String(option._id)}
            activeOpacity={0.8}
            disabled={disabled}
            onPress={() => onVote?.(option._id)}
            style={[styles.row, { backgroundColor: colors.surfaceAlt }]}
          >
            <View style={styles.left}>
              <OptionPhoto option={option} />
              <CustomText
                label={optionLabel(option)}
                fontSize={labelSize}
                fontFamily={fonts.medium}
                numberOfLines={1}
                containerStyle={styles.labelWrap}
              />
            </View>
          </TouchableOpacity>
        ),
      )}
    </View>
  );
};

export default PollOptionList;

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },
  row: {
    height: 40,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  fillClip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  rowInner: {
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    flexShrink: 1,
  },
  labelWrap: {
    flexShrink: 1,
  },
  clip: {
    overflow: "hidden",
  },
  // Figma "Rectangle 5" (8100:2556): 24 × 24, radius 100
  optionImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    flexShrink: 0,
  },
  noShrink: {
    flexShrink: 0,
  },
  // Figma voter stack avatar (8100:2548): 18 × 18, radius 100
  voterImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    flexShrink: 0,
  },
  // Figma 8100:2552: pad L12 R12; never shrinks, so "100%" is always whole
  right: {
    paddingHorizontal: 12,
    flexShrink: 0,
  },
});
