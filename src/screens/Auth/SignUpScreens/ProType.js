import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { View } from "react-native";

import { AuthStepTitle } from "../../../components/Auth/AuthKit";
import TypeCard from "./molecules/TypeCard";

const OPTIONS = [
  {
    key: "individual",
    icon: "person",
    title: "Individual",
    description: "I am solo-entrepreneur or use it as a personal brand.",
  },
  {
    key: "company",
    icon: "domain",
    title: "Company",
    description: "We are an established company.",
  },
];

/** Pro users: "I am a" Individual or Company (entity). */
const ProType = forwardRef(({ state, next, setBtnDisabled }, ref) => {
  const [selected, setSelected] = useState(state?.proType || "");

  useEffect(() => {
    setBtnDisabled?.(!selected);
  }, [selected]);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (!selected) return;
      next({ proType: selected });
    },
  }));

  return (
    <View>
      <AuthStepTitle
        label="I am a"
        fontSize={32}
        letterSpacing={-4}
        marginBottom={24}
      />
      <View style={{ gap: 8 }}>
        {OPTIONS.map((o) => (
          <TypeCard
            key={o.key}
            icon={o.icon}
            title={o.title}
            description={o.description}
            selected={selected === o.key}
            onPress={() => setSelected(o.key)}
          />
        ))}
      </View>
    </View>
  );
});

export default ProType;
