import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import CustomText from "../CustomText";
import Icons from "../Icons";
import {
  AuthHint,
  AuthStepTitle,
  AuthTextField,
  HINT_ROW_EXTRA,
  belowBase,
  capTop,
  ls,
  useAuthPalette,
} from "./AuthKit";
import fonts from "../../assets/fonts";

const RESEND_SECONDS = 30;
const CODE_LENGTH = 6;

/**
 * "Please enter the code" (Figma Verification-code): code field with a gold
 * tick once complete, where the code went (+ edit), then "Send again" with
 * its 30 s cooldown.
 *
 * Props: destination, isPhone, onEdit, onResend (async, returns true when a
 * new code was issued), onVerify (async (code) → error string | ""),
 * setBtnDisabled, setLoading.
 */
const VerificationCode = forwardRef(
  (
    {
      destination,
      isPhone,
      onEdit,
      onResend,
      onVerify,
      setBtnDisabled,
      setLoading,
    },
    ref,
  ) => {
    const p = useAuthPalette();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [seconds, setSeconds] = useState(RESEND_SECONDS);
    const [resending, setResending] = useState(false);
    const timer = useRef(null);

    const complete = code.trim().length >= CODE_LENGTH;

    useEffect(() => {
      setBtnDisabled?.(!complete);
    }, [complete]);

    useEffect(() => {
      if (seconds <= 0) return undefined;
      timer.current = setTimeout(() => setSeconds((s) => s - 1), 1000);
      return () => clearTimeout(timer.current);
    }, [seconds]);

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!complete) return;
        setLoading?.(true);
        const err = (await onVerify?.(code.trim())) || "";
        setLoading?.(false);
        setError(err);
      },
    }));

    const resend = async () => {
      if (seconds > 0 || resending) return;
      setResending(true);
      const ok = await onResend?.();
      setResending(false);
      if (ok) {
        setCode("");
        setError("");
        setSeconds(RESEND_SECONDS);
      }
    };

    const canResend = seconds <= 0 && !resending;

    return (
      <View>
        <AuthStepTitle label="Please enter the code" marginTop={32} />
        <AuthTextField
          value={code}
          onChangeText={(t) => {
            setCode(t.replace(/\s/g, ""));
            if (error) setError("");
          }}
          placeholder="E.g. XSI456"
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          error={error}
          right={
            complete && !error ? (
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="check_circle"
                size={24}
                color={p.gold}
              />
            ) : null
          }
        />
        <AuthHint
          text={
            error ||
            (complete
              ? "Valid verification code."
              : "Enter the 6-digit code we sent you.")
          }
          color={error ? p.error : undefined}
        />

        <CustomText
          label="Verification code was sent to:"
          fontSize={12}
          letterSpacing={ls(-3, 12)}
          color={p.t64}
          marginTop={12 - HINT_ROW_EXTRA - capTop(12)}
        />
        <View style={[styles.sentRow, { marginTop: 8 - belowBase(12) - 2.8 }]}>
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name={isPhone ? "call" : "mail"}
            size={14}
            color={p.text}
          />
          <CustomText
            label={destination}
            fontSize={14}
            fontFamily={fonts.medium}
            color={p.text}
            numberOfLines={1}
          />
          {onEdit ? (
            <TouchableOpacity hitSlop={10} onPress={onEdit}>
              <Icons
                family="MaterialSymbolsRoundedFilled"
                name="edit"
                size={14}
                color={p.text}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.resendBlock, { marginTop: 40 - 2.8 }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!canResend}
            onPress={resend}
            style={[
              styles.resendPill,
              { backgroundColor: p.t04, opacity: canResend ? 1 : 0.48 },
            ]}
          >
            {resending ? (
              <ActivityIndicator size="small" color={p.text} />
            ) : (
              <>
                <CustomText
                  label="Send again"
                  fontSize={12}
                  fontFamily={fonts.semiBold}
                  color={p.text}
                />
                <Icons
                  family="MaterialSymbolsRounded"
                  name="replay"
                  size={14}
                  color={p.text}
                />
              </>
            )}
          </TouchableOpacity>
          <View style={styles.resendHint}>
            <Icons
              family="MaterialSymbolsRounded"
              name="info"
              size={12}
              color={p.t64}
            />
            <CustomText
              label={
                seconds > 0
                  ? `You can request a new code in ${seconds} seconds.`
                  : "You can request a new code now."
              }
              fontSize={12}
              letterSpacing={ls(-3, 12)}
              color={p.t64}
            />
          </View>
        </View>
      </View>
    );
  },
);

export default VerificationCode;

const styles = StyleSheet.create({
  sentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resendBlock: {
    alignItems: "center",
  },
  resendPill: {
    height: 32,
    minWidth: 137,
    borderRadius: 100,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  resendHint: {
    marginTop: 16 - HINT_ROW_EXTRA,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
