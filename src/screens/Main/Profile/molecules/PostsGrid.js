import { useNavigation } from "@react-navigation/native";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import ImageFast from "../../../../components/ImageFast";

const GAP = 2;
const TILE = (Dimensions.get("window").width - GAP * 2) / 3;
const isVideoUrl = (u) => /\.(mp4|mov|m4v|m3u8|webm)(\?|$)/i.test(String(u || ""));

/** First image / video poster of a post (a repost shows the original's). */
const coverOf = (post) => {
  const src = post?.parentPost && !post?.images?.length && !post?.video ? post.parentPost : post;
  const image = (src?.images || []).find((u) => !isVideoUrl(u));
  return {
    uri: src?.thumbnail || image || null,
    video: !!src?.video || (src?.images || []).some(isVideoUrl),
    multi: (src?.images || []).length > 1,
    text: (src?.description || []).join(" ").trim(),
  };
};

/**
 * Profile posts in a 3-column grid (compact header layout toggle):
 * square tiles 2pt apart; media posts show their image / video poster,
 * text posts their opening words. Tap → the post.
 */
const PostsGrid = ({ posts = [], ListEmptyComponent = null }) => {
  const navigation = useNavigation();
  if (!posts.length) return ListEmptyComponent;
  return (
    <View style={styles.grid}>
      {posts.map((p, i) => {
        const c = coverOf(p);
        return (
          <TouchableOpacity
            key={String(p?._id ?? p?.id ?? i)}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("DetailPageWithId", { postId: p.parentPostId && !p.description?.length ? p.parentPostId : p._id })}
            style={styles.tile}
          >
            {c.uri ? (
              <ImageFast source={{ uri: c.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={styles.textTile}>
                <CustomText
                  label={c.text || " "}
                  fontSize={12}
                  letterSpacing={-0.48}
                  fontFamily={fonts.regular}
                  color="rgba(255, 255, 255, 0.64)"
                  numberOfLines={5}
                />
              </View>
            )}
            {(c.video || c.multi) && (
              <View style={styles.badge}>
                <Icons family="MaterialSymbolsRoundedFilled" name={c.video ? "play_arrow" : "filter_none"} size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default PostsGrid;

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingBottom: 100 },
  tile: { width: TILE, height: TILE, backgroundColor: "rgba(255, 255, 255, 0.04)", overflow: "hidden" },
  textTile: { flex: 1, padding: 8 },
  badge: { position: "absolute", top: 6, right: 6 },
});
