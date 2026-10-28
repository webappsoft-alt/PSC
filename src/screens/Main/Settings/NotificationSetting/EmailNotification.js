import { useState } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import CustomText from "../../../../components/CustomText";
import Header from "../../../../components/Header";
import ScreenWrapper from "../../../../components/ScreenWrapper";
import { put } from "../../../../services/ApiRequest";
import { setUserData } from "../../../../store/reducer/usersSlice";
import { store } from "../../../../store";
import { COLORS } from "../../../../utils/COLORS";
import ToggleCard from "../molecules/ToggleCard";

const EmailNotification = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.users);
  const [loading, setLoading] = useState(false);

  const updatePreferences = async (updates) => {
    const prevPreferences = userData?.notificationSettings || {};

    const updatedPreferences = {
      ...prevPreferences,
      ...updates,
    };

    dispatch(
      setUserData({
        ...userData,
        notificationSettings: updatedPreferences,
      }),
    );

    try {
      setLoading(true);

      const res = await put("user/profile", {
        notificationSettings: updates,
      });

      if (!res?.data?.success) {
        throw new Error("API failed");
      }
    } catch (error) {
      console.log("Error updating notification preferences:", error);

      const currentUserData = store.getState().users.userData;
      const currentSettings = currentUserData?.notificationSettings || {};
      const rollbackSettings = { ...currentSettings };
      Object.keys(updates).forEach((key) => {
        rollbackSettings[key] = prevPreferences[key];
      });

      dispatch(
        setUserData({
          ...currentUserData,
          notificationSettings: rollbackSettings,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper
      headerUnScrollable={() => <Header title={"Email notifications"} />}
      scrollEnabled
    >
      <CustomText
        label="Control when and how often PSC sends you emails."
        fontSize={14}
        color={COLORS.subtitle}
        marginBottom={20}
        marginTop={8}
        paddingHorizontal={12}
      />

      <ToggleCard
        title={"Form Email"}
        subtitle={"Receive email notifications for form activities"}
        marginTop={8}
        value={userData?.notificationSettings?.formEmail}
        setValue={(val) => updatePreferences({ formEmail: val })}
      />
      <ToggleCard
        title={"Store Email"}
        subtitle={"Receive email notifications for store activities"}
        marginTop={8}
        value={userData?.notificationSettings?.storeEmail}
        setValue={(val) => updatePreferences({ storeEmail: val })}
      />
      <ToggleCard
        title={"Job Email"}
        subtitle={"Receive email notifications for job activities"}
        marginTop={8}
        value={userData?.notificationSettings?.jobEmail}
        setValue={(val) => updatePreferences({ jobEmail: val })}
      />
      <ToggleCard
        title={"Wishlist Email"}
        subtitle={"Receive email notifications for wishlist activities"}
        marginTop={8}
        value={userData?.notificationSettings?.wishlistEmail}
        setValue={(val) => updatePreferences({ wishlistEmail: val })}
      />
      <ToggleCard
        title={"Team Email"}
        subtitle={"Receive email notifications for team activities"}
        marginBottom={40}
        marginTop={8}
        value={userData?.notificationSettings?.teamEmail}
        setValue={(val) => updatePreferences({ teamEmail: val })}
      />
    </ScreenWrapper>
  );
};

export default EmailNotification;

const styles = StyleSheet.create({});
