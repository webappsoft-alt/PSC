import { del, get, post } from "./ApiRequest";

/**
 * Radios + Audio Posts API (PSC-Backend modules/radio, mounted at /radio).
 * Responses are axios responses: `res.data.data` is the payload.
 */
export const fetchRadio = (radioId) => get(`radio/${radioId}`);

export const fetchRadioSubtitles = (radioId) =>
  get(`radio/${radioId}/subtitles`);

export const playRadio = (radioId) => post(`radio/${radioId}/play`);

/** Audio Post: uploaded recording → draft + Whisper transcript job */
export const createAudioDraft = (audio, durationMs = 0) =>
  post("radio/draft", { audio, durationMs });

/** Editor "Continue": keep [startMs, endMs] at `speed` (0.5 · 1 · 2) */
export const editAudioDraft = (radioId, { startMs, endMs, speed }) =>
  post(`radio/${radioId}/edit`, { startMs, endMs, speed });

export const removeDisfluency = (radioId) =>
  post(`radio/${radioId}/disfluency`);

export const correctTranscript = (radioId) =>
  post(`radio/${radioId}/correct`);

export const publishAudioPost = (radioId, body) =>
  post(`radio/${radioId}/publish`, body);

export const discardAudioDraft = (radioId) => del(`radio/${radioId}/draft`);

export const deleteRadio = (radioId) => del(`radio/${radioId}`);

export const hideRadio = (radioId) => post(`radio/${radioId}/hide`);

export const reportRadio = (radioId, reason) =>
  post(`radio/${radioId}/report`, reason ? { reason } : {});
