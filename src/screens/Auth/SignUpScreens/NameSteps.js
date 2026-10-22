import { forwardRef } from "react";

import TextStep from "./molecules/TextStep";

// Latin letters incl. accents (À-ÿ); explicit ranges keep Hermes happy.
const PERSON_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'’-]{1,36}$/;
const ENTITY_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9][A-Za-zÀ-ÖØ-öø-ÿ0-9\s&.,'’()-]{1,36}$/;

const personName = (label) => (v) =>
  !v
    ? `Please enter your ${label}.`
    : PERSON_NAME.test(v)
    ? ""
    : `Please enter a valid ${label} (letters only, 2-37 characters).`;

const PROFILE_HINT = "This will appear on your profile.";
const NAMES_HINT = "Inappropriate names are forbidden.";

export const Firstname = forwardRef(({ state, next, setBtnDisabled }, ref) => (
  <TextStep
    ref={ref}
    title="What’s your firstname?"
    placeholder="E.g. James"
    initialValue={state?.firstName}
    hints={[{ text: PROFILE_HINT, counter: true }, { text: NAMES_HINT }]}
    validate={personName("firstname")}
    onSubmit={(v) => next({ firstName: v })}
    setBtnDisabled={setBtnDisabled}
  />
));

export const Surname = forwardRef(({ state, next, setBtnDisabled }, ref) => (
  <TextStep
    ref={ref}
    title="What’s your surname?"
    placeholder="E.g. Johnson"
    initialValue={state?.lastName}
    hints={[{ text: PROFILE_HINT }, { text: NAMES_HINT }]}
    validate={personName("surname")}
    onSubmit={(v) => next({ lastName: v })}
    setBtnDisabled={setBtnDisabled}
  />
));

export const EntityName = forwardRef(({ state, next, setBtnDisabled }, ref) => (
  <TextStep
    ref={ref}
    title="What’s your entity name?"
    placeholder="E.g. James"
    initialValue={state?.entityName}
    hints={[{ text: PROFILE_HINT, counter: true }, { text: NAMES_HINT }]}
    validate={(v) =>
      !v
        ? "Please enter your entity name."
        : ENTITY_NAME.test(v)
        ? ""
        : "Please enter a valid entity name (2-37 characters)."
    }
    onSubmit={(v) => next({ entityName: v })}
    setBtnDisabled={setBtnDisabled}
  />
));
