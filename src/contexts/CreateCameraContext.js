import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const CreateCameraContext = createContext(null);

const defaultCameraState = {
  facing: "back",
  enableTorch: false,
  active: false,
  zoom: 0,
};

export function CreateCameraProvider({ children }) {
  const cameraRef = useRef(null);
  const onCameraReadyRef = useRef(null);
  const onMountErrorRef = useRef(null);
  const resetCaptureStateRef = useRef(null);
  const [cameraState, setCameraStateState] = useState(defaultCameraState);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReadyState] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [destroyVersion, setDestroyVersion] = useState(0);

  const setCameraReady = useCallback((ready) => {
    setCameraReadyState((prev) => {
      if (prev === ready) return prev;
      return ready;
    });
  }, []);

  const setCameraState = useCallback((partial) => {
    setCameraStateState((prev) => {
      const next = { ...prev, ...partial };
      if (
        prev.facing === next.facing &&
        prev.enableTorch === next.enableTorch &&
        prev.active === next.active &&
        prev.zoom === next.zoom
      )
        return prev;
      return next;
    });
  }, []);

  const destroyCamera = useCallback(() => {
    // Force all camera-related local state to a released baseline.
    setCameraReadyState(false);
    setIsRecording(false);
    setCameraStateState((prev) => ({
      ...prev,
      active: false,
      enableTorch: false,
    }));
    cameraRef.current = null;
    setDestroyVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      cameraRef,
      cameraState,
      setCameraState,
      onCameraReadyRef,
      onMountErrorRef,
      resetCaptureStateRef,
      isRecording,
      setIsRecording,
      cameraReady,
      setCameraReady,
      hasPermission,
      setHasPermission,
      isLiveMode,
      setIsLiveMode,
      destroyCamera,
      destroyVersion,
    }),
    [
      cameraState,
      setCameraState,
      isRecording,
      cameraReady,
      setCameraReady,
      hasPermission,
      isLiveMode,
      destroyCamera,
      destroyVersion,
    ]
  );

  return (
    <CreateCameraContext.Provider value={value}>
      {children}
    </CreateCameraContext.Provider>
  );
}

export function useCreateCamera() {
  const ctx = useContext(CreateCameraContext);
  if (!ctx) {
    throw new Error("useCreateCamera must be used within CreateCameraProvider");
  }
  return ctx;
}
