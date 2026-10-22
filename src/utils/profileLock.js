/**
 * Local profile PIN of the profile selector (ported from Viral's
 * utils/profileLock.ts). Every saved account has its own 6-digit PIN; only a
 * salted hash is kept (redux-persist, users.profilePins), so the selector works
 * offline. The server-side account PIN (user/create-pin) is set alongside it at
 * registration, but entering an account from the selector checks this one.
 *
 * Treat the hash as obfuscation, not protection: a 6-digit space is small and
 * anything that can read the store already holds the account's tokens.
 */
import {
  setPinSalt,
  setProfilePin,
} from "../store/reducer/usersSlice";

export const PROFILE_PIN_LENGTH = 6;

const newSalt = () =>
  `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2)}${Math.random().toString(36).slice(2)}`;

/** FNV-1a over salt + pin, a few rounds (same as Viral). */
export function hashPin(pin, salt) {
  let input = `${salt}:${pin}`;
  let out = "";
  for (let round = 0; round < 4; round += 1) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    const chunk = hash.toString(16).padStart(8, "0");
    out += chunk;
    input = `${chunk}:${input}`;
  }
  return out;
}

/** Stores the PIN of `userId`; returns the salt used. */
export function saveProfilePin(dispatch, users, userId, pin) {
  if (!userId || !pin) return;
  let salt = users?.pinSalt;
  if (!salt) {
    salt = newSalt();
    dispatch(setPinSalt(salt));
  }
  dispatch(setProfilePin({ userId: String(userId), hash: hashPin(pin, salt) }));
}

export function hasProfilePin(users, userId) {
  return Boolean(userId && users?.profilePins?.[String(userId)]);
}

export function verifyProfilePin(users, userId, pin) {
  const stored = users?.profilePins?.[String(userId)];
  const salt = users?.pinSalt;
  if (!stored || !salt || !pin) return false;
  return stored === hashPin(pin, salt);
}
