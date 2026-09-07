import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UploadProgressState = {
  isStoryUploading: boolean;
  setIsStoryUploading: (v: boolean) => void;
  isStoryUploaded: boolean;
  setIsStoryUploaded: (v: boolean) => void;
  isPostUploading: boolean;
  setIsPostUploading: (v: boolean) => void;
  isPostUploaded: boolean;
  setIsPostUploaded: (v: boolean) => void;
};

export type UploadProgressSnapshot = Pick<
  UploadProgressState,
  "isStoryUploading" | "isStoryUploaded" | "isPostUploading" | "isPostUploaded"
>;

type UploadProgressListener = (snapshot: UploadProgressSnapshot) => void;

const EMPTY_UPLOAD_PROGRESS_SNAPSHOT: UploadProgressSnapshot = {
  isStoryUploading: false,
  isStoryUploaded: false,
  isPostUploading: false,
  isPostUploaded: false,
};

let latestUploadProgressSnapshot: UploadProgressSnapshot =
  EMPTY_UPLOAD_PROGRESS_SNAPSHOT;
const uploadProgressListeners = new Set<UploadProgressListener>();

function publishUploadProgressSnapshot(snapshot: UploadProgressSnapshot) {
  latestUploadProgressSnapshot = snapshot;
  uploadProgressListeners.forEach((listener) => listener(snapshot));
}

export function getUploadProgressSnapshot(): UploadProgressSnapshot {
  return latestUploadProgressSnapshot;
}

export function subscribeToUploadProgress(listener: UploadProgressListener) {
  uploadProgressListeners.add(listener);
  return () => {
    uploadProgressListeners.delete(listener);
  };
}

const UploadProgressContext = createContext<UploadProgressState | null>(null);

/**
 * Isolated from AppContext so toggling post/story upload flags does not
 * re-render every useApp() subscriber (settings, modals, etc.).
 */
export function UploadProgressProvider({ children }: { children: ReactNode }) {
  const [isStoryUploading, setIsStoryUploading] = useState(false);
  const [isStoryUploaded, setIsStoryUploaded] = useState(false);
  const [isPostUploading, setIsPostUploading] = useState(false);
  const [isPostUploaded, setIsPostUploaded] = useState(false);

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
    publishUploadProgressSnapshot({
      isStoryUploading,
      isStoryUploaded,
      isPostUploading,
      isPostUploaded,
    });
  }, [isStoryUploading, isStoryUploaded, isPostUploading, isPostUploaded]);

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
    }),
    [
      isStoryUploading,
      isStoryUploaded,
      isPostUploading,
      isPostUploaded,
    ],
  );

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress(): UploadProgressState {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) {
    throw new Error(
      "useUploadProgress must be used within UploadProgressProvider",
    );
  }
  return ctx;
}
