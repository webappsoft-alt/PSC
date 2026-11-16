// Pre-publish nudity check (backend modules/moderation): content can be
// published, held for review ("pending_review") or blocked (422
// CONTENT_BLOCKED with a user-facing message).
export const HELD_MESSAGE = "Sent for review. It'll appear once approved";

/** true when the created post / story / audio post waits for review */
export const isHeld = (response) =>
  response?.data?.data?.status === "pending_review";

/** the server's explanation when the content was blocked, else null */
export const blockedMessage = (error) =>
  error?.data?.code === "CONTENT_BLOCKED" ? error.data.message : null;
