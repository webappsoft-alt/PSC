import { forwardRef } from "react";

import { ConfirmPasswordStep } from "./molecules/PasswordFields";

const ConfirmPassword = forwardRef(({ state, next, setBtnDisabled }, ref) => (
  <ConfirmPasswordStep
    ref={ref}
    password={state?.password}
    onSubmit={() => next({})}
    setBtnDisabled={setBtnDisabled}
  />
));

export default ConfirmPassword;
