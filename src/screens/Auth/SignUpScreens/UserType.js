import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { View } from "react-native";

import { AuthStepTitle } from "../../../components/Auth/AuthKit";
import TypeCard from "./molecules/TypeCard";

const OPTIONS = [
  {
    key: "regular",
    icon: "person",
    title: "Regular",
    description:
      "I want to use PSC to get the latest news and build my network in no time.",
  },
  {
    key: "pro",
    icon: "domain",
    title: "Pro",
    description:
      "I want to use PSC to get the latest trends and build an online presence for my company/brand.",
  },
];

/** "I want to use PSC as a" — Regular or Pro. */
const UserType = forwardRef(({ state, next, setBtnDisabled }, ref) => {
  const [selected, setSelected] = useState(state?.userType || "");

  useEffect(() => {
    setBtnDisabled?.(!selected);
  }, [selected]);

  useImperativeHandle(ref, () => ({
    submit: () => {
      if (!selected) return;
      next(
        selected === "pro"
          ? { userType: "pro" }
          : { userType: "regular", proType: "" },
      );
    },
  }));

  return (
    <View>
      <AuthStepTitle label="I want to use PSC as a" marginBottom={24} />
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

export default UserType;
