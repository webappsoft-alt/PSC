import { createRef } from "react";

export const toastRef = createRef();

export const ToastMessage = (message, type = "success") => {
  if (typeof message === "string") {
    toastRef.current?.show(message, type);
  }
};
