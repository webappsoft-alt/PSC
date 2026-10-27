import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../assets/fonts";
import { useTheme } from "../contexts/ThemeContext";
import { OrientationTiles } from "../screens/Main/Profile/PoliticalInformation";
import { put } from "../services/ApiRequest";
import { setUserData } from "../store/reducer/usersSlice";
import { isPoliticalValue } from "../utils/political";
import { ToastMessage } from "../utils/ToastMessage";
import CustomSwitch from "./CustomSwitch";
import CustomText from "./CustomText";
import FloatingSheet, { SheetCloseButton } from "./FloatingSheet";
import Icons from "./Icons";

const MSF = "MaterialSymbolsRoundedFilled";
const X = (fs) => Math.round(fs * 0.35 * 10) / 10;

/**
 * Regular users' self-declared political orientation (spec §3.1): optional,
 * one of the five labels, private by default, visible on the profile only
 * when the switch is on. Built from the Content Preference sheet pieces and
 * the Political-Information label tiles.
 */
const PoliticalOrientationSheet = ({ visible, onDismiss }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const current = userData?.political || {};
  const [value, setValue] = useState(null);
  const [visibleOnProfile, setVisibleOnProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(isPoliticalValue(current.declaredOrientation) ? current.declaredOrientation : null);
      setVisibleOnProfile(!!current.orientationVisible);
    }
  }, [visible, current.declaredOrientation, current.orientationVisible]);

  const save = async (declaredOrientation, orientationVisible) => {
    try {
      setSaving(true);
      const response = await put("user/profile", {
        political: { declaredOrientation, orientationVisible },
      });
      if (response?.data?.success) {
        dispatch(setUserData(response.data.data));
        onDismiss?.();
      }
    } catch (e) {
      console.log("political orientation save error", e);
      ToastMessage("Could not save your orientation", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FloatingSheet
      visible={visible}
      onDismiss={onDismiss}
      header={
        <View style={{ marginBottom: -X(12) }}>
          <View style={styles.titleRow}>
            <CustomText
              label="Political Orientation"
              fontSize={24}
              letterSpacing={-0.48}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            <SheetCloseButton onPress={onDismiss} />
          </View>
          <CustomText
            label="Optional. Only shown on your profile when you choose to."
            fontSize={12}
            letterSpacing={-0.12}
            color="rgba(255, 255, 255, 0.64)"
            marginTop={8 - X(12)}
          />
        </View>
      }
    >
      <OrientationTiles selected={value} onSelect={(v) => setValue(v === value ? null : v)} />

      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Icons family={MSF} name="menu" size={24} color={colors.text} />
          <CustomText
            label="Show on my profile"
            fontSize={14}
            letterSpacing={-0.56}
            fontFamily={fonts.BoldItalic}
            textTransform={"uppercase"}
            color={colors.text}
            containerStyle={styles.grow}
          />
        </View>
        <CustomSwitch value={visibleOnProfile} setValue={setVisibleOnProfile} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={saving}
          onPress={() => save(value, visibleOnProfile && value !== null)}
          style={[styles.actionBtn, { backgroundColor: "#FFFFFF" }]}
        >
          <CustomText label="Apply" fontSize={16} fontFamily={fonts.medium} color="#121212" />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={saving}
          onPress={() => {
            setValue(null);
            setVisibleOnProfile(false);
            save(null, false);
          }}
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
        >
          <CustomText label="Reset All" fontSize={18} fontFamily={fonts.medium} color={colors.text} />
        </TouchableOpacity>
      </View>
    </FloatingSheet>
  );
};

export default PoliticalOrientationSheet;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    height: 32,
  },
  toggleRow: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actions: {
    gap: 8,
  },
  actionBtn: {
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
