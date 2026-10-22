/**
 * Caption helpers for feed videos. Words come from the backend Whisper job
 * ({ word, startMs, endMs }, same as Viral). Words are grouped into short
 * phrases (≤ 5 words, broken at pauses) so the Figma pill shows one line.
 */
const MAX_WORDS = 5;
const PAUSE_MS = 700;
const LEAD_MS = 150; // show a phrase just before its first word
const HOLD_MS = 600; // keep it a moment after its last word

export function buildSubtitleLines(words) {
  if (!Array.isArray(words) || !words.length) return [];
  const lines = [];
  let current = [];
  for (const w of words) {
    if (!w || !w.word) continue;
    const prev = current[current.length - 1];
    const pause = prev ? w.startMs - prev.endMs : 0;
    if (current.length >= MAX_WORDS || (prev && pause > PAUSE_MS)) {
      lines.push(current);
      current = [];
    }
    current.push(w);
  }
  if (current.length) lines.push(current);
  return lines.map((line) => ({
    startMs: line[0].startMs,
    endMs: line[line.length - 1].endMs,
    text: line.map((w) => w.word).join(" "),
    words: line,
  }));
}

/**
 * Line on screen at `positionMs` plus the index of the word being spoken
 * (Figma: the current word is highlighted in yellow inside the pill).
 * Returns { text, words, activeIndex } or null.
 */
export function activeSubtitleLine(lines, positionMs) {
  if (!lines?.length || !Number.isFinite(positionMs)) return null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const next = lines[i + 1];
    const end = Math.min(
      line.endMs + HOLD_MS,
      next ? next.startMs - LEAD_MS : Infinity,
    );
    if (positionMs >= line.startMs - LEAD_MS && positionMs <= end) {
      const words = line.words || [];
      let activeIndex = -1;
      for (let j = 0; j < words.length; j += 1) {
        if (positionMs >= words[j].startMs) activeIndex = j;
      }
      return { text: line.text, words, activeIndex };
    }
  }
  return null;
}

export function activeSubtitleText(lines, positionMs) {
  if (!lines?.length || !Number.isFinite(positionMs)) return null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const next = lines[i + 1];
    const end = Math.min(
      line.endMs + HOLD_MS,
      next ? next.startMs - LEAD_MS : Infinity,
    );
    if (positionMs >= line.startMs - LEAD_MS && positionMs <= end) {
      return line.text;
    }
  }
  return null;
}

/** Drop "[MUSIC]", "(laughs)", ♪ … — not speech (same filter as Viral). */
export function stripNonSpeechText(text) {
  return String(text || "")
    .replace(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|<[^>]*>|[♪♫♬♩]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain transcript → evenly timed words across the clip (Viral fallback). */
export function wordsFromPlainText(text, durationMs = 0) {
  const parts = stripNonSpeechText(text).split(" ").filter(Boolean);
  if (!parts.length) return [];
  const given = Math.max(0, Number(durationMs) || 0);
  const span = given > 1500 ? given : parts.length * 280;
  const slice = span / parts.length;
  return parts.map((part, index) => {
    const startMs = Math.round(index * slice);
    return {
      word: part.replace(/^[,.?!;:]+|[,.?!;:]+$/g, "") || part,
      startMs,
      endMs: Math.max(startMs + 80, Math.round((index + 1) * slice)),
    };
  });
}

/**
 * Viral's generatedSubtitleWords: timed `subtitles[]` first, else the
 * `subtitlesText` spread over the video duration.
 */
export function captionWords(post, durationMs = 0) {
  const timed = Array.isArray(post?.subtitles)
    ? post.subtitles.filter(
        (w) => w && w.word && !/^\[.*\]$|^\(.*\)$/.test(String(w.word).trim()),
      )
    : [];
  if (timed.length) return timed;
  return wordsFromPlainText(post?.subtitlesText, durationMs);
}
