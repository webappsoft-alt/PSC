// Global session expiry handler
let sessionExpiryHandler = null;

export const setSessionExpiryHandler = (handler) => {
  sessionExpiryHandler = handler;
};

export const triggerSessionExpiry = () => {
  if (sessionExpiryHandler) {
    sessionExpiryHandler();
  }
};
