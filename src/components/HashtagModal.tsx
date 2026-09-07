import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Images } from "../assets/images";
import CustomInput from "./CustomInput";
import CustomModal from "./CustomModal";
import CustomText from "./CustomText";
import Icons from "./Icons";
import { COLORS } from "../utils/COLORS";
import { ToastMessage } from "../utils/ToastMessage";
import { get, post } from "../services/ApiRequest";

export interface TagItem {
  _id: string;
  tag: string;
}

interface HashtagModalProps {
  isVisible: boolean;
  selectedTags: TagItem[];
  onClose: () => void;
  onChange: (tags: TagItem[]) => void;
  forGenres?: boolean;
}

interface Hashtag {
  _id: string;
  tag: string;
  count: number;
  stats?: {
    views: number;
    impressions: number;
  };
  topic?: string[];
  ageRating?: number[];
}

const DRAMA_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Historical",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Crime",
  "Family",
  "Musical",
  "War",
  "Western",
];

const HashtagModal: React.FC<HashtagModalProps> = ({
  isVisible,
  selectedTags,
  onClose,
  onChange,
  forGenres = false,
}) => {
  const insets = useSafeAreaInsets();
  const theme = {
    background: COLORS.black,
    cardBackground: COLORS.white16,
    text: COLORS.white,
    textSecondary: COLORS.gray,
    textTertiary: COLORS.gray2,
    border: COLORS.gray5,
    borderLight: COLORS.white04,
  };
  const accentColor = COLORS.buttonColor;

  const [query, setQuery] = useState<string>("");
  const [tags, setTags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    if (!isVisible) return;

    if (forGenres) {
      const genreTags: Hashtag[] = DRAMA_GENRES.map((g, index) => ({
        _id: `genre-${index}`,
        tag: g,
        count: 0,
      }));

      setTags(genreTags);
      setIsLoading(false);
    } else {
      fetchHashtags();
    }
  }, [isVisible, forGenres]);

  const fetchHashtags = async () => {
    try {
      setIsLoading(true);
      const res = await get("hashtag/top?page=1&limit=100");

      if (res?.data?.success) {
        const fetchedHashtags = res.data?.data?.hashtags || [];

        const formattedTags: Hashtag[] = fetchedHashtags.map((tag: any) => ({
          _id: tag._id,
          tag: tag.tag,
          count: tag.count,
          stats: tag.stats,
          topic: tag.topic,
          ageRating: tag.ageRating,
        }));

        setTags(formattedTags.length > 0 ? formattedTags : []);
      }
    } catch (error) {
      console.log("Error fetching hashtags:", error);
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTags = useMemo(() => {
    if (!query) return tags;
    return tags.filter((tag) =>
      tag.tag.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, tags]);

  const toggleTag = (tagItem: Hashtag) => {
    const isSelected = selectedTags.some((t) => t._id === tagItem._id);

    if (isSelected) {
      onChange(selectedTags.filter((t) => t._id !== tagItem._id));
    } else {
      if (selectedTags.length >= 3) {
        ToastMessage("You can select only 3 items", "error");
        return;
      }
      onChange([...selectedTags, { _id: tagItem._id, tag: tagItem.tag }]);
    }
  };

  const addCustomTag = async () => {
    if (!query.trim()) return;
    if (selectedTags.length >= 3) {
      ToastMessage("You can select only 3 items", "error");
      return;
    }
    try {
      setIsCreating(true);
      const res = await post("hashtag/create", {
        tag: query.trim(),
      });

      if (res?.data?.success) {
        const newTagId = res.data?.data?._id;

        // Add the new tag to selected tags with its _id
        if (!selectedTags.some((t) => t.tag === query.trim())) {
          onChange([...selectedTags, { _id: newTagId, tag: query.trim() }]);
        }

        // Refresh the hashtags list
        await fetchHashtags();

        // Clear the input
        setQuery("");
      } else {
        ToastMessage(res?.data?.message || "Failed to create tag", "error");
      }
    } catch (error) {
      console.log("Error creating hashtag:", error);
      ToastMessage("Error creating tag. Please try again.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <CustomModal
      isChange
      isVisible={isVisible}
      onDisable={onClose}
      propagateSwipe={true}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={{ borderBottomWidth: 2, borderColor: theme.border }}>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <CustomInput
                placeholder={forGenres ? "Search genres..." : "Enter a tag..."}
                value={query}
                onChangeText={setQuery}
                search
                height={44}
                borderRadius={99}
                isClear
                marginBottom={8}
                returnKeyType="Done"
                editable={!isCreating}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                height: 40,
                width: 40,
                borderRadius: 40,
                backgroundColor: theme.cardBackground,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={onClose}
              disabled={isCreating}
            >
              <Icons
                family="Entypo"
                name="cross"
                size={22}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {selectedTags.length > 0 ? (
            <View>
              <FlatList
                data={selectedTags}
                keyExtractor={(item) => item._id}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  paddingTop: 0,
                  gap: 8,
                }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.tagChip,
                      { backgroundColor: theme.cardBackground },
                    ]}
                  >
                    <CustomText
                      label={forGenres ? item.tag : `#${item.tag}`}
                      color={theme.textSecondary}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        onChange(
                          selectedTags.filter((t) => t._id !== item._id),
                        );
                      }}
                    >
                      <Image
                        source={Images.cross}
                        style={{ height: 14, width: 14 }}
                        tintColor={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.text} />
          </View>
        ) : (
          <FlatList
            data={filteredTags}
            keyExtractor={(item) => item._id}
            renderItem={({ item, index }) => {
              const isSelected = selectedTags.some((t) => t._id === item._id);

              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    {
                      borderBottomWidth:
                        index === filteredTags.length - 1 ? 0 : 1,
                    },
                  ]}
                  onPress={() => toggleTag(item)}
                  activeOpacity={0.9}
                >
                  <View>
                    <CustomText
                      fontSize={16}
                      color={theme.text}
                      label={forGenres ? item.tag : `#${item.tag}`}
                      fontFamily="Poppins_500Medium"
                    />

                    {!forGenres && item.stats?.views ? (
                      <CustomText
                        fontSize={13}
                        color={theme.textSecondary}
                        label={`${item.stats.views.toLocaleString()} views`}
                      />
                    ) : null}
                  </View>

                  <Icons
                    size={22}
                    family="MaterialCommunityIcons"
                    color={isSelected ? theme.text : theme.textTertiary}
                    name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                  />
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              !forGenres && query.length > 0 && !filteredTags.length ? (
                <TouchableOpacity
                  onPress={addCustomTag}
                  disabled={isCreating}
                  style={[styles.createTag, isCreating && { opacity: 0.5 }]}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color={accentColor} />
                  ) : (
                    <CustomText
                      color={accentColor}
                      label={`Create #${query}`}
                    />
                  )}
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </View>
    </CustomModal>
  );
};

export default HashtagModal;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },

  createTag: {
    paddingVertical: 16,
    alignItems: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
