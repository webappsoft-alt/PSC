// "@" mentions in chat — the same flow as the post publish form (Viral's
// comment mentions): typing "@" at the end of the text opens the people
// picker, the picked person is inserted as their name (without "@") and the
// message carries [{ user, offset, length }] ranges of `content`.

export const MENTION_COLOR = "#007BFF"; // PSC mention blue (CustomInput, Translate)

export const mentionName = (u) =>
  `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "";

/** what is typed after a trailing "@" (null when not mentioning) */
export const readMentionQuery = (text) => {
  const m = /(?:^|\s)@([\w.]*)$/.exec(text || "");
  return m ? m[1] : null;
};

/** replace the trailing "@query" with the person's name */
export const insertMention = (text, user) =>
  (text || "").replace(/(^|\s)@[\w.]*$/, `$1${mentionName(user)} `);

/**
 * picked: [{ user, name }] in the order they were inserted → ranges in the
 * text; a name that was edited away drops its mention.
 */
export const mentionRanges = (text, picked = []) => {
  const out = [];
  let from = 0;
  for (const p of picked) {
    if (!p?.name) continue;
    const at = (text || "").indexOf(p.name, from);
    if (at < 0) continue;
    out.push({ user: p.user, offset: at, length: p.name.length });
    from = at + p.name.length;
  }
  return out;
};

/** text split into plain / mention pieces for rendering */
export const mentionSegments = (text, ranges = []) => {
  const s = text || "";
  const sorted = [...(ranges || [])]
    .filter((r) => r && r.offset >= 0 && r.length > 0 && r.offset + r.length <= s.length)
    .sort((a, b) => a.offset - b.offset);
  const out = [];
  let i = 0;
  for (const r of sorted) {
    if (r.offset < i) continue;
    if (r.offset > i) out.push({ text: s.slice(i, r.offset) });
    out.push({ text: s.slice(r.offset, r.offset + r.length), mention: r });
    i = r.offset + r.length;
  }
  if (i < s.length) out.push({ text: s.slice(i) });
  return out;
};

/** post text (Figma "@Airbnb"): replace the trailing "@query" with "@Name " */
export const insertMentionTag = (text, user) =>
  (text || "").replace(/(^|\s)@[\w.]*$/, `$1@${mentionName(user)} `);
