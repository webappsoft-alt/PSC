import { del, get, post, put } from "./ApiRequest";

/** Shows API (PSC-Backend modules/show, mounted at /shows). */
const qs = (params = {}) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

export const fetchShowsFeed = ({ topic, search } = {}) =>
  get(`shows/feed${qs({ topic, search })}`);

export const fetchMyShows = (search = "") =>
  get(`shows/mine${qs({ search })}`);

export const createShow = (body) => post("shows", body);

export const deleteShow = (showId) => del(`shows/${showId}`);

export const toggleSaveShow = (showId) => put(`shows/${showId}/save`, {});

export const verifyEpisodeNumber = (showId, seasonNumber, episodeNumber) =>
  get(
    `shows/${showId}/verify-episode${qs({ seasonNumber, episodeNumber })}`,
  );

export const createEpisode = (showId, body) =>
  post(`shows/${showId}/episode`, body);

/** Show detail: show + episodes + "similar" / "alsoWatched" card rails. */
export const fetchShow = (showId) => get(`shows/${showId}`);

/** Paid episode → Stripe PaymentIntent { clientSecret, paymentIntentId, amount, currency } */
export const createEpisodePurchase = (showId, episodeId) =>
  post(`shows/${showId}/episode/${episodeId}/purchase`, {});

export const confirmEpisodePurchase = (showId, episodeId, paymentIntentId) =>
  post(`shows/${showId}/episode/${episodeId}/purchase/confirm`, {
    paymentIntentId,
  });

export const saveWatchProgress = (body) => put("shows/watch-progress", body);

/** "What Would Like To See More?" → "original" | "popular" | "" */
export const setShowsSeeMore = (choice) => put("shows/see-more", { choice });
