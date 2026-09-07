import { useDispatch, useSelector } from "react-redux";
import { Keyboard } from "react-native";
import { useEffect } from "react";

import { setKeyboard, selectKeyboard } from "../store/reducer/appSlice";

export const useKeyboard = () => {
  const dispatch = useDispatch();
  const isKeyboardVisible = useSelector(selectKeyboard);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () =>
      dispatch(setKeyboard(true))
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () =>
      dispatch(setKeyboard(false))
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [dispatch]);

  return isKeyboardVisible;
};

export default useKeyboard;
