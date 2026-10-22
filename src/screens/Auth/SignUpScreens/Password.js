import { forwardRef } from "react";

import { CreatePasswordStep } from "./molecules/PasswordFields";

const Password = forwardRef(({ state, next, setBtnDisabled }, ref) => (
  <CreatePasswordStep
    ref={ref}
    initialValue={state?.password}
    onSubmit={(password) => next({ password })}
    setBtnDisabled={setBtnDisabled}
  />
));

export default Password;
