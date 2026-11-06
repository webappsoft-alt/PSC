import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import fonts from "../../../../assets/fonts";
import ErrorComponent from "../../../../components/ErrorComponent";
import Icons from "../../../../components/Icons";
import { useTheme } from "../../../../contexts/ThemeContext";
import { COLORS } from "../../../../utils/COLORS";
import MentionList from "./MentionList";

// Viral: "@" at the end of the text opens the people picker; the picked
// person is inserted as "@Name" and painted in the mention colour
const MENTION_COLOR = "#007BFF"; // PSC mention blue (CustomInput)
const readMentionQuery = (text) => {
  const m = /(?:^|\s)@([\w.]*)$/.exec(text || "");
  return m ? m[1] : null;
};
const mentionName = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "";

const NOTE_TOP = 2 - 0.353 * 12;

export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 20;

let nextId = 1;
// mention: the tagged PSC user (shown with their photo in the poll)
export const newPollOption = (text = "", mention = null) => ({
  id: `opt_${nextId++}`,
  text,
  mention,
});

/**
 * Publish-A-Poll options list (Figma 7572:11945)
 *  - rows 40 tall, radius 12, white 4%, 12 side padding, 6 apart
 *  - empty row: "Option n" Regular 14 @64% · filled: Medium 14 white with a
 *    20pt cancel button (filled, 48%)
 *  - "Add an option" row appends a new option as soon as you type in it
 *  - up to 20 options ("Up to 20 options." note); an option left empty is
 *    deleted (blur / backspace on an empty row / its clear button), keeping
 *    at least 2 rows
 */
const PollOptionsEditor = ({ options, onChange, error }) => {
  const { colors } = useTheme();
  const inputRefs = useRef({});
  const pendingFocus = useRef(null);
  // { id, query } while an "@…" is being typed in an option
  const [mentioning, setMentioning] = useState(null);

  // focus the row that was just created / the previous one after a delete
  useEffect(() => {
    if (!pendingFocus.current) return;
    const ref = inputRefs.current[pendingFocus.current];
    pendingFocus.current = null;
    ref?.focus?.();
  }, [options]);

  const updateText = (id, text) => {
    onChange(
      options.map((o) => {
        if (o.id !== id) return o;
        // editing away the "@Name" token drops the tag
        const keep = o.mention && text.includes(`@${mentionName(o.mention)}`);
        return { ...o, text, mention: keep ? o.mention : null };
      }),
    );
    const query = readMentionQuery(text);
    setMentioning(query === null ? null : { id, query });
  };

  const applyMention = (id, user) => {
    const name = mentionName(user);
    onChange(
      options.map((o) =>
        o.id === id
          ? {
              ...o,
              text: o.text.replace(/(^|\s)@[\w.]*$/, `$1@${name}`),
              mention: user,
            }
          : o,
      ),
    );
    setMentioning(null);
    inputRefs.current[id]?.focus?.();
  };

  const removeOption = (id, focusPrevious = false) => {
    if (options.length <= POLL_MIN_OPTIONS) {
      updateText(id, "");
      return;
    }
    const index = options.findIndex((o) => o.id === id);
    if (focusPrevious && index > 0) pendingFocus.current = options[index - 1].id;
    onChange(options.filter((o) => o.id !== id));
  };

  const handleBlur = (id) => {
    setMentioning((m) => (m?.id === id ? null : m));
    const option = options.find((o) => o.id === id);
    if (option && !option.text.trim() && options.length > POLL_MIN_OPTIONS) {
      removeOption(id);
    }
  };

  const handleKeyPress = (id, text, e) => {
    if (e?.nativeEvent?.key === "Backspace" && text === "") {
      removeOption(id, true);
    }
  };

  const handleAddText = (text) => {
    if (!text || options.length >= POLL_MAX_OPTIONS) return;
    const option = newPollOption(text);
    pendingFocus.current = option.id;
    onChange([...options, option]);
    const query = readMentionQuery(text);
    if (query !== null) setMentioning({ id: option.id, query });
  };

  const inputStyle = (filled) => [
    styles.input,
    {
      color: colors.text,
      fontFamily: filled ? fonts.medium : fonts.regular,
    },
  ];

  return (
    <View style={styles.list}>
      {options.map((option, index) => {
        const filled = option.text.length > 0;
        const tagged = !!option.mention;
        const token = tagged ? `@${mentionName(option.mention)}` : "";
        const at = tagged ? option.text.indexOf(token) : -1;
        return (
          <View key={option.id}>
          <View style={[styles.row, { backgroundColor: colors.surfaceAlt }]}>
            {tagged && at >= 0 ? (
              // same-metrics overlay paints the "@Name" token (RN inputs
              // can't colour a substring); the real field is transparent
              <Text
                pointerEvents="none"
                numberOfLines={1}
                style={[
                  styles.overlay,
                  {
                    color: colors.text,
                    fontSize: 14,
                    fontFamily: filled ? fonts.medium : fonts.regular,
                  },
                ]}
              >
                {option.text.slice(0, at)}
                <Text style={{ color: MENTION_COLOR }}>{token}</Text>
                {option.text.slice(at + token.length)}
              </Text>
            ) : null}
            <TextInput
              ref={(r) => {
                if (r) inputRefs.current[option.id] = r;
                else delete inputRefs.current[option.id];
              }}
              value={option.text}
              onChangeText={(t) => updateText(option.id, t)}
              onBlur={() => handleBlur(option.id)}
              onKeyPress={(e) => handleKeyPress(option.id, option.text, e)}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor={colors.textSecondary}
              cursorColor={COLORS.buttonColor}
              selectionColor={COLORS.buttonColor}
              maxLength={100}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => {
                const next = options[index + 1];
                if (next) inputRefs.current[next.id]?.focus?.();
                else inputRefs.current.__add?.focus?.();
              }}
              style={[
                inputStyle(filled),
                tagged && at >= 0 && { color: "transparent" },
              ]}
            />
            {filled ? (
              <TouchableOpacity
                hitSlop={8}
                activeOpacity={0.7}
                onPress={() => removeOption(option.id)}
              >
                <Icons
                  family="MaterialSymbolsRoundedFilled"
                  name="cancel"
                  size={20}
                  color={COLORS.gray48}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          {mentioning?.id === option.id ? (
            <MentionList
              query={mentioning.query}
              onSelect={(u) => applyMention(option.id, u)}
            />
          ) : null}
          </View>
        );
      })}

      {options.length < POLL_MAX_OPTIONS ? (
        <View style={[styles.row, { backgroundColor: colors.surfaceAlt }]}>
          <TextInput
            ref={(r) => {
              if (r) inputRefs.current.__add = r;
              else delete inputRefs.current.__add;
            }}
            value=""
            onChangeText={handleAddText}
            placeholder="Add an option"
            placeholderTextColor={colors.textSecondary}
            cursorColor={COLORS.buttonColor}
            selectionColor={COLORS.buttonColor}
            style={inputStyle(false)}
          />
        </View>
      ) : null}

      {/* Figma 7574:12005: row 12, cap 2 below its top; the 12pt line box
          puts the cap 0.353 × 12 below the RN row top */}
      {error ? (
        <ErrorComponent
          errorTitle={error}
          color="#EE1045CC"
          error={error}
          font={fonts.regular}
          marginTop={NOTE_TOP}
        />
      ) : (
        <ErrorComponent
          errorTitle={`Up to ${POLL_MAX_OPTIONS} options.`}
          marginTop={NOTE_TOP}
        />
      )}
    </View>
  );
};

export default PollOptionsEditor;

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },
  row: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlay: {
    position: "absolute",
    left: 12,
    right: 40,
    padding: 0,
    margin: 0,
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
    margin: 0,
    fontSize: 14,
  },
});
