import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const EMPTY_UPLOAD_PROGRESS_SNAPSHOT = {
  isStoryUploading: false,
  isStoryUploaded: false,
  isPostUploading: false,
  isPostUploaded: false,
  isLiveUploading: false,
  isLiveUploaded: false,
};

let latestUploadProgressSnapshot = EMPTY_UPLOAD_PROGRESS_SNAPSHOT;
const uploadProgressListeners = new Set();

function publishUploadProgressSnapshot(snapshot) {
  latestUploadProgressSnapshot = snapshot;
  uploadProgressListeners.forEach((listener) => listener(snapshot));
}

export function getUploadProgressSnapshot() {
  return latestUploadProgressSnapshot;
}

export function subscribeToUploadProgress(listener) {
  uploadProgressListeners.add(listener);
  return () => {
    uploadProgressListeners.delete(listener);
  };
}

const UploadProgressContext = createContext(null);

/**
 * Isolated from AppContext so toggling post/story/live upload flags does not
 * re-render every useApp() subscriber (settings, modals, etc.).
 */
export function UploadProgressProvider({ children }) {
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [isStoryUploaded, setIsStoryUploaded] = useState(false);
  const [isPostUploading, setIsPostUploading] = useState(false);
  const [isPostUploaded, setIsPostUploaded] = useState(false);
  const [isLiveUploading, setIsLiveUploading] = useState(false);
  const [isLiveUploaded, setIsLiveUploaded] = useState(false);

  useEffect(() => {
    if (!isStoryUploaded) return;
    const timer = setTimeout(() => {
      setIsStoryUploaded(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isStoryUploaded]);

  useEffect(() => {
    if (!isPostUploaded) return;
    const timer = setTimeout(() => {
      setIsPostUploaded(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isPostUploaded]);

  useEffect(() => {
    if (!isLiveUploaded) return;
    const timer = setTimeout(() => {
      setIsLiveUploaded(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isLiveUploaded]);

  useEffect(() => {
    publishUploadProgressSnapshot({
      isStoryUploading,
      isStoryUploaded,
      isPostUploading,
      isPostUploaded,
      isLiveUploading,
      isLiveUploaded,
    });
  }, [
    isStoryUploading,
    isStoryUploaded,
    isPostUploading,
    isPostUploaded,
    isLiveUploading,
    isLiveUploaded,
  ]);

  const value = useMemo(
    () => ({
      isStoryUploading,
      setIsStoryUploading,
      isStoryUploaded,
      setIsStoryUploaded,
      isPostUploading,
      setIsPostUploading,
      isPostUploaded,
      setIsPostUploaded,
      isLiveUploading,
      setIsLiveUploading,
      isLiveUploaded,
      setIsLiveUploaded,
    }),
    [
      isStoryUploading,
      isStoryUploaded,
      isPostUploading,
      isPostUploaded,
      isLiveUploading,
      isLiveUploaded,
    ],
  );

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) {
    throw new Error(
      "useUploadProgress must be used within UploadProgressProvider",
    );
  }
  return ctx;
}
