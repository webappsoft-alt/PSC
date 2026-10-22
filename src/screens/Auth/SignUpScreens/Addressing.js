import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import CustomText from "../../../components/CustomText";
import {
  AuthStepTitle,
  SelectIcon,
  belowBase,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";

const OPTIONS = [
  {
    key: "firstname",
    title: "Using your Firstname",
    tone: "Friendly",
    example: "E.g. Hi Ana, how was your day?",
  },
  {
    key: "lastname",
    title: "Using your Lastname",
    tone: "Corporate",
    example: "E.g. Hello Mr. Johnson, how was your day?",
  },
];

/**
 * Card: 1px FFFFFF 4% stroke, radius 12, padding 16/12, row gap 16;
 * title Medium 16 (-0.5%) → tone Medium 14 → example Regular 12 48%, 16 apart.
 */
const Addressing = forwardRef(({ state, next, setBtnDisabled }, ref) => {
  const p = useAuthPalette();
  const [selected, setSelected] = useState(state?.addressing || "firstname");

  useEffect(() => {
    setBtnDisabled?.(!selected);
  }, [selected]);

  useImperativeHandle(ref, () => ({
    submit: () => next({ addressing: selected }),
  }));

  return (
    <View>
      <AuthStepTitle
        label="How Would You Like To Be Addressed?"
        marginBottom={24}
      />
      <View style={{ gap: 8 }}>
        {OPTIONS.map((o) => {
          const on = selected === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              activeOpacity={0.85}
              onPress={() => setSelected(o.key)}
              style={[styles.card, { borderColor: p.t04 }]}
            >
              <View style={styles.texts}>
                <CustomText
                  label={o.title}
                  fontSize={16}
                  fontFamily={fonts.medium}
                  letterSpacing={ls(-0.5, 16)}
                  color={p.text}
                />
                <CustomText
                  label={o.tone}
                  fontSize={14}
                  fontFamily={fonts.medium}
                  color={p.text}
                  marginTop={textGap(16, 16, 14)}
                />
                <CustomText
                  label={o.example}
                  fontSize={12}
                  color={p.t48}
                  marginTop={textGap(16, 14, 12)}
                />
              </View>
              <View style={styles.radio}>
                <SelectIcon
                  type="radio"
                  selected={on}
                  unselectedColor={
                    p.isDark ? "rgba(18, 18, 18, 0.32)" : p.t32
                  }
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

export default Addressing;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingTop: 15 - capTop(16),
    paddingBottom: 15 - belowBase(12),
  },
  texts: {
    flex: 1,
  },
  radio: {
    marginTop: 15 - (15 - capTop(16)),
  },
});
