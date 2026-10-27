import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useDispatch, useSelector } from "react-redux";

import fonts from "../assets/fonts";
import { put } from "../services/ApiRequest";
import { setUserData } from "../store/reducer/usersSlice";
import { useTheme } from "../contexts/ThemeContext";
import {
  DEFAULT_CONTENT_PREFERENCE,
  POLITICAL_MAX,
  POLITICAL_MIN,
  getContentPreference,
} from "../utils/political";
import { ToastMessage } from "../utils/ToastMessage";
import CustomSwitch from "./CustomSwitch";
import CustomText from "./CustomText";
import FloatingSheet, { SheetCloseButton } from "./FloatingSheet";
import Icons from "./Icons";

const MSF = "MaterialSymbolsRoundedFilled";
const X = (fs) => Math.round(fs * 0.35 * 10) / 10;

const STOP_LABELS = ["RADICAL\nLEFT", "LEFT", "CENTER", "RIGHT", "RADICAL\nRIGHT"];
const RED = "rgba(238, 16, 69, 1)";
const BLUE = "rgba(0, 123, 255, 1)";

/**
 * Figma "Political-Bias-Content-Preference": five-stop track (4pt, red → blue
 * gradient, radius 100), white segment between the two 16pt handles, 12pt
 * end dots (red / blue) and a 12pt white centre dot, labels SemiBold 10 / −1%.
 */
const RangeSlider = ({ min, max, onChange }) => {
  const [width, setWidth] = useState(0);
  const range = useRef({ min, max });
  range.current = { min, max };

  const stopX = (i) => (width ? (i * width) / (POLITICAL_MAX - POLITICAL_MIN) : 0);
  const nearestStop = (x) =>
    Math.max(
      POLITICAL_MIN,
      Math.min(POLITICAL_MAX, Math.round((x / Math.max(width, 1)) * (POLITICAL_MAX - POLITICAL_MIN))),
    );

  const makeResponder = (which) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        handleMove(which, e.nativeEvent.locationX);
      },
      onPanResponderMove: (e, g) => {
        // moveX is in window space; convert with the track's measured origin
        handleMove(which, g.moveX - trackLeft.current);
      },
    });

  const trackLeft = useRef(0);
  const handleMove = (which, x) => {
    const stop = nearestStop(x);
    const { min: curMin, max: curMax } = range.current;
    if (which === "min") {
      if (stop !== curMin) onChange(Math.min(stop, curMax), curMax);
    } else if (stop !== curMax) {
      onChange(curMin, Math.max(stop, curMin));
    }
  };

  const minResponder = useMemo(() => makeResponder("min"), [width]); // eslint-disable-line react-hooks/exhaustive-deps
  const maxResponder = useMemo(() => makeResponder("max"), [width]); // eslint-disable-line react-hooks/exhaustive-deps
  const trackRef = useRef(null);

  const Dot = ({ x, size, color, bordered = true }) => (
    <View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          left: x - size / 2,
          top: 8 - size / 2,
          backgroundColor: color,
          borderWidth: bordered ? 1 : 0,
        },
      ]}
    />
  );

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.stopLabels}>
        {STOP_LABELS.map((l) => (
          <CustomText
            key={l}
            label={l}
            fontSize={10}
            letterSpacing={-0.1}
            fontFamily={fonts.semiBold}
            textAlign={"center"}
            containerStyle={styles.stopLabel}
          />
        ))}
      </View>
      <View
        ref={trackRef}
        style={styles.trackArea}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          trackRef.current?.measureInWindow?.((px) => {
            trackLeft.current = px;
          });
        }}
      >
        <LinearGradient
          colors={[RED, "rgba(238, 16, 69, 0.64)", "rgba(0, 123, 255, 0.64)", BLUE]}
          locations={[0, 0.25, 0.75, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.track}
        />
        {width > 0 && (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.selected,
                { left: stopX(min), width: stopX(max) - stopX(min) },
              ]}
            />
            <Dot x={stopX(0)} size={12} color={RED} />
            <Dot x={stopX(4)} size={12} color={BLUE} />
            <Dot x={stopX(2)} size={12} color="#FFFFFF" />
            <View
              {...minResponder.panHandlers}
              style={[styles.handleHit, { left: stopX(min) - 20 }]}
            >
              <View style={styles.handle} />
            </View>
            <View
              {...maxResponder.panHandlers}
              style={[styles.handleHit, { left: stopX(max) - 20 }]}
            >
              <View style={styles.handle} />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const ToggleRow = ({ label, value, onChange, last }) => {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Icons family={MSF} name="menu" size={24} color={colors.text} />
          <CustomText
            label={label}
            fontSize={14}
            letterSpacing={-0.56}
            fontFamily={fonts.BoldItalic}
            textTransform={"uppercase"}
            color={colors.text}
            containerStyle={styles.grow}
          />
        </View>
        <CustomSwitch value={value} setValue={onChange} />
      </View>
      {!last && <View style={[styles.separator, { backgroundColor: colors.surface }]} />}
    </>
  );
};

/**
 * Content Preference sheet — political range of the feed + which sources the
 * range applies to. Saved on the user (PUT user/profile → political.*).
 */
const ContentPreferenceSheet = ({ visible, onDismiss, onApplied }) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.users.userData);
  const [draft, setDraft] = useState(() => getContentPreference(userData));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setDraft(getContentPreference(userData));
  }, [visible, userData]);

  const save = async (next) => {
    try {
      setSaving(true);
      const response = await put("user/profile", { political: next });
      if (response?.data?.success) {
        dispatch(setUserData(response.data.data));
        onApplied?.(next);
        onDismiss?.();
      }
    } catch (e) {
      console.log("content preference save error", e);
      ToastMessage("Could not save your preferences", "error");
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
              label="Content Preference"
              fontSize={24}
              letterSpacing={-0.48}
              fontFamily={fonts.semiBold}
              color={colors.text}
            />
            <SheetCloseButton onPress={onDismiss} />
          </View>
          <CustomText
            label="Choose the political perspectives you want to see in your feed."
            fontSize={12}
            letterSpacing={-0.12}
            color="rgba(255, 255, 255, 0.64)"
            marginTop={8 - X(12)}
          />
        </View>
      }
    >
      <RangeSlider
        min={draft.feedMin}
        max={draft.feedMax}
        onChange={(feedMin, feedMax) => setDraft((d) => ({ ...d, feedMin, feedMax }))}
      />

      <CustomText
        label="Based on SI analysis of political orientation across users news providers and affiliated content."
        fontSize={12}
        letterSpacing={-0.12}
        color="rgba(255, 255, 255, 0.64)"
        marginTop={-X(12)}
        marginBottom={-X(12)}
      />

      <View style={styles.toggles}>
        <ToggleRow
          label="News providers"
          value={draft.filterNewsProviders}
          onChange={(v) => setDraft((d) => ({ ...d, filterNewsProviders: v }))}
        />
        <ToggleRow
          label="Users"
          value={draft.filterUsers}
          onChange={(v) => setDraft((d) => ({ ...d, filterUsers: v }))}
        />
        <ToggleRow
          label="Content"
          value={draft.filterContent}
          onChange={(v) => setDraft((d) => ({ ...d, filterContent: v }))}
          last
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={saving}
          onPress={() => save(draft)}
          style={[styles.actionBtn, { backgroundColor: "#FFFFFF" }]}
        >
          <CustomText
            label="Apply Preferences"
            fontSize={16}
            fontFamily={fonts.medium}
            color="#121212"
          />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={saving}
          onPress={() => {
            setDraft({ ...DEFAULT_CONTENT_PREFERENCE });
            save({ ...DEFAULT_CONTENT_PREFERENCE });
          }}
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
        >
          <CustomText
            label="Reset All"
            fontSize={18}
            fontFamily={fonts.medium}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
    </FloatingSheet>
  );
};

export default ContentPreferenceSheet;

const styles = StyleSheet.create({
  grow: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    height: 32,
  },
  sliderBlock: {
    gap: 8,
  },
  stopLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stopLabel: {
    width: 44,
  },
  trackArea: {
    height: 16,
    justifyContent: "center",
  },
  track: {
    height: 4,
    borderRadius: 100,
  },
  selected: {
    position: "absolute",
    top: 6,
    height: 4,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
  },
  dot: {
    position: "absolute",
    borderRadius: 100,
    borderColor: "rgba(255, 255, 255, 0.64)",
  },
  handleHit: {
    position: "absolute",
    top: -12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 16,
    height: 16,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.64)",
  },
  toggles: {
    gap: 8,
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
  separator: {
    height: 1,
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
