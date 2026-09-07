import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CameraView } from "expo-camera";

export type CreateCameraState = {
  facing: "front" | "back";
  enableTorch: boolean;
  active: boolean;
  zoom: number;
};

type CreateCameraContextValue = {
  cameraRef: React.RefObject<CameraView | null>;
  cameraState: CreateCameraState;
  setCameraState: (state: Partial<CreateCameraState>) => void;
  onCameraReadyRef: React.MutableRefObject<(() => void) | null>;
  onMountErrorRef: React.MutableRefObject<((error: any) => void) | null>;
  resetCaptureStateRef: React.MutableRefObject<(() => void) | null>;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  cameraReady: boolean;
  setCameraReady: (ready: boolean) => void;
  hasPermission: boolean | null;
  setHasPermission: (granted: boolean) => void;
  isLiveMode: boolean;
  setIsLiveMode: (isLive: boolean) => void;
  destroyCamera: () => void;
  destroyVersion: number;
};

const CreateCameraContext = createContext<CreateCameraContextValue | null>(null);

const defaultCameraState: CreateCameraState = {
  facing: "back",
  enableTorch: false,
  active: false,
  zoom: 0,
};

export function CreateCameraProvider({ children }: { children: React.ReactNode }) {
  const cameraRef = useRef<CameraView | null>(null);
  const onCameraReadyRef = useRef<(() => void) | null>(null);
  const onMountErrorRef = useRef<((error: any) => void) | null>(null);
  const resetCaptureStateRef = useRef<(() => void) | null>(null);
  const [cameraState, setCameraStateState] = useState<CreateCameraState>(defaultCameraState);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReadyState] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [destroyVersion, setDestroyVersion] = useState(0);

  const setCameraReady = useCallback((ready: boolean) => {
    setCameraReadyState((prev) => {
      if (prev === ready) return prev;
      return ready;
    });
  }, []);

  const setCameraState = useCallback((partial: Partial<CreateCameraState>) => {
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

  const value: CreateCameraContextValue = useMemo(
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
  return ctx;
}
