import React, { createContext, useContext, useState, useRef } from "react";
import { DeviceEventEmitter } from "react-native";
import { ToastMessage } from "../utils/ToastMessage";

const UploadContext = createContext(null);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within UploadProvider");
  }
  return context;
};

export const UploadProvider = ({ children }) => {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    type: null, // 'post' | 'reel'
    message: "",
  });

  const uploadProgressRef = useRef(null);

  const startUpload = (type, message) => {
    setUploadState({
      isUploading: true,
      type,
      message,
    });

    // Show the upload progress component
    if (uploadProgressRef.current) {
      uploadProgressRef.current.show(message);
    }
  };

  const completeUpload = (successMessage) => {
    // Hide upload progress
    if (uploadProgressRef.current) {
      uploadProgressRef.current.hide();
    }

    // Clear state
    setUploadState({
      isUploading: false,
      type: null,
      message: "",
    });

    // Show success toast
    setTimeout(() => {
      DeviceEventEmitter.emit("uploadCompleted");
      ToastMessage(
        successMessage || "Upload completed successfully",
        "success"
      );
    }, 300);
  };

  const failUpload = (errorMessage) => {
    // Hide upload progress
    if (uploadProgressRef.current) {
      uploadProgressRef.current.hide();
    }

    // Clear state
    setUploadState({
      isUploading: false,
      type: null,
      message: "",
    });

    // Show error toast
    setTimeout(() => {
      ToastMessage(errorMessage || "Upload failed", "error");
    }, 300);
  };

  const value = {
    uploadState,
    startUpload,
    completeUpload,
    failUpload,
    uploadProgressRef,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
};
