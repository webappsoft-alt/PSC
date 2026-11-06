/**
 * One-shot result hand-off between a picker screen and whoever opened it
 * (keeps functions out of navigation params). The opener calls
 * `awaitPick(key, cb)` and navigates; the picker calls `resolvePick(key,
 * value)` and goes back.
 */
const waiting = {};

export const awaitPick = (key, cb) => {
  waiting[key] = cb;
};

export const resolvePick = (key, value) => {
  const cb = waiting[key];
  delete waiting[key];
  if (typeof cb === "function") cb(value);
  return !!cb;
};

export const isPicking = (key) => typeof waiting[key] === "function";
