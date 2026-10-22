import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";

import CustomText from "../../../components/CustomText";
import {
  AuthHint,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import { post } from "../../../services/ApiRequest";
import { applySession } from "../../../utils/accountSession";
import { flowOf } from "./flows";

const MAX_LENGTH = 37;
const USERNAME = /^[a-z0-9._]{3,37}$/;
const MAX_CHIPS = 7;

const clean = (v) =>
  String(v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Username ideas from the names entered earlier (Figma shows seven chips). */
const candidatesOf = (s) => {
  const company = s?.proType === "company";
  const first = clean(company ? s?.entityName : s?.firstName);
  const last = company ? "" : clean(s?.lastName);
  if (!first && !last) return [];
  const year = String(s?.dob || s?.foundingDate || "").slice(2, 4);
  const list = [
    `${first}${last}`,
    last ? `${first}.${last}` : `${first}.official`,
    last ? `${first}_${last}` : `the${first}`,
    last ? `${first}${last.charAt(0)}` : `${first}hq`,
    last ? `${first.charAt(0)}${last}` : `${first}app`,
    year ? `${first}${last}${year}` : `${first}${last}1`,
    `${first}${last}12`,
    last ? `${last}${first}` : `${first}group`,
    `${first}${last}.psc`,
    `real${first}${last}`,
  ];
  return [...new Set(list.filter((u) => USERNAME.test(u)))];
};

const isAvailable = async (username) => {
  try {
    const res = await post("auth/check-username", { username });
    return !!res?.data?.success;
  } catch (e) {
    return false;
  }
};

/**
 * "Pick a username?" — live availability, suggestion chips, and the account is
 * created here (auth/register) before moving on to the PIN setup.
 */
const Username = forwardRef(({ state, setBtnDisabled, setLoading }, ref) => {
  const p = useAuthPalette();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [username, setUsername] = useState(state?.username || "");
  const [status, setStatus] = useState(null); // checking | available | taken | invalid
  const [chips, setChips] = useState([]);
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  // Suggestions: keep the ones that are still free.
  useEffect(() => {
    (async () => {
      const ideas = candidatesOf(state);
      const free = [];
      for (const idea of ideas) {
        if (free.length >= MAX_CHIPS) break;
        // eslint-disable-next-line no-await-in-loop
        if (await isAvailable(idea)) free.push(idea);
      }
      if (!mounted.current) return;
      setChips(free);
      if (!username && free[0]) setUsername(free[0]);
    })();
  }, []);

  // Live check of what is typed.
  useEffect(() => {
    const value = username.trim();
    setError("");
    if (!value) {
      setStatus(null);
      return undefined;
    }
    if (!USERNAME.test(value)) {
      setStatus("invalid");
      return undefined;
    }
    setStatus("checking");
    const t = setTimeout(async () => {
      const ok = await isAvailable(value);
      if (mounted.current) setStatus(ok ? "available" : "taken");
    }, 450);
    return () => clearTimeout(t);
  }, [username]);

  useEffect(() => {
    setBtnDisabled?.(status !== "available");
  }, [status]);

  const register = async () => {
    if (status !== "available") return;
    const flow = flowOf(state);
    const company = flow === "company";
    setLoading?.(true);
    try {
      const fcmToken = await AsyncStorage.getItem("fcmToken");
      const body = {
        email: state?.email,
        phone: state?.phone,
        password: state?.password,
        username: username.trim(),
        firstName: company ? state?.entityName : state?.firstName,
        lastName: company ? "" : state?.lastName || "",
        ...(company
          ? { foundingDate: state?.foundingDate }
          : { dob: state?.dob }),
        ...(!company && state?.gender ? { gender: state.gender } : {}),
        ...(!company && state?.addressing
          ? { addressing: state.addressing }
          : {}),
        enhancedTailoredAds: !!state?.enhancedTailoredAds,
        role: flow,
        fcmToken: fcmToken || "",
      };
      const res = await post("auth/register", body);
      const data = res?.data;
      if (!data?.tokens?.accessToken) {
        setError(data?.message || "Registration failed. Please try again.");
        setLoading?.(false);
        return;
      }
      await applySession(dispatch, data?.user, data?.tokens);
      setLoading?.(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "PinOnBoarding" }],
      });
    } catch (err) {
      setLoading?.(false);
      if (mounted.current) {
        setError(err?.message || "Registration failed. Please try again.");
      }
    }
  };

  useImperativeHandle(ref, () => ({ submit: register }));

  const statusHint =
    status === "available"
      ? { text: "Available", icon: "check_circle", iconColor: p.success }
      : status === "taken"
      ? { text: "Username is taken", icon: "error", color: p.error }
      : status === "invalid"
      ? {
          text: "Use 3-37 lowercase letters, digits, dots or underscores.",
          icon: "error",
          color: p.error,
        }
      : status === "checking"
      ? { text: "Checking availability…", icon: "info" }
      : null;

  return (
    <View>
      <AuthStepTitle label="Pick a username?" />
      <AuthTextField
        value={username}
        onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, ""))}
        placeholder="E.g. viktorsola"
        maxLength={MAX_LENGTH}
        autoCapitalize="none"
        valueFamily={fonts.medium}
        error={status === "taken" || status === "invalid" || !!error}
      />
      {error ? <AuthHint text={error} color={p.error} icon="error" iconFamily="MaterialSymbolsRoundedFilled" /> : null}
      {statusHint ? (
        <AuthHint
          text={statusHint.text}
          icon={statusHint.icon}
          iconFamily="MaterialSymbolsRoundedFilled"
          iconColor={statusHint.iconColor}
          color={statusHint.color}
          marginTop={error ? 8 - 2 * HINT_ROW_EXTRA : 8 - HINT_ROW_EXTRA}
        />
      ) : null}
      <AuthHint
        text="This will appear on your profile."
        right={`${username.length}/${MAX_LENGTH}`}
        marginTop={
          statusHint || error ? 8 - 2 * HINT_ROW_EXTRA : 8 - HINT_ROW_EXTRA
        }
      />
      <AuthHint
        text="Inappropriate names are forbidden."
        marginTop={8 - 2 * HINT_ROW_EXTRA}
      />

      {chips.length ? (
        <>
          <View
            style={[
              styles.divider,
              { backgroundColor: p.t04, marginTop: 16 - HINT_ROW_EXTRA },
            ]}
          />
          <View style={styles.chips}>
            {chips.map((c) => {
              const on = c === username;
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.8}
                  onPress={() => setUsername(c)}
                  style={[
                    styles.chip,
                    on
                      ? { backgroundColor: p.text, borderColor: p.text }
                      : { borderColor: p.t04 },
                  ]}
                >
                  <CustomText
                    label={c}
                    fontSize={12}
                    fontFamily={fonts.medium}
                    color={on ? p.bg : p.t64}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
});

export default Username;

const styles = StyleSheet.create({
  divider: {
    height: 1,
  },
  chips: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 4,
    rowGap: 6,
  },
  chip: {
    height: 32,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
