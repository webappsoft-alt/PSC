import { StyleSheet, View } from "react-native";

import { COLORS } from "../../utils/COLORS";
import CustomText from "../CustomText";
import Icons from "../Icons";
import PollOptionList from "./PollOptionList";
import {
  isPollEnded,
  pollTimeLeft,
  usePollState,
  votesLabel,
} from "./pollUtils";

/**
 * Poll block of a poll post (Figma Home-Feed 8100:2384):
 * options (6 apart) → 8 → "group 64.2K votes · 240 days remaining."
 * Results show once the viewer voted, when the poll closed, and to its author.
 */
const PollPostBlock = ({ postId, poll: serverPoll, isOwner, paddingHorizontal = 8 }) => {
  const { poll, vote, voting } = usePollState(postId, serverPoll);
  const ended = isPollEnded(poll);
  const showResults = !!poll?.myVote || ended || !!isOwner;
  const timeLeft = pollTimeLeft(poll?.endsAt, "feed");

  if (!poll?.options?.length) return null;

  return (
    <View style={[styles.container, { paddingHorizontal }]}>
      <PollOptionList
        poll={poll}
        showResults={showResults}
        onVote={vote}
        disabled={ended || voting}
        variant="feed"
      />
      <View style={styles.meta}>
        <View style={styles.votes}>
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="group"
            size={14}
            color={COLORS.gray48}
          />
          <CustomText
            label={votesLabel(poll.totalVotes || 0)}
            fontSize={12}
            letterSpacing={-0.36}
            color={COLORS.gray64}
          />
        </View>
        {timeLeft ? (
          <>
            <View style={styles.dot} />
            <CustomText
              label={timeLeft}
              fontSize={12}
              letterSpacing={-0.36}
              color={COLORS.gray64}
            />
          </>
        ) : null}
      </View>
    </View>
  );
};

export default PollPostBlock;

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  // Figma 8100:2673: row 14 (= the group icon); pinned so the 12pt 1.4 line
  // boxes overflow it symmetrically and the caps sit where Figma has them
  meta: {
    height: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  votes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
});
