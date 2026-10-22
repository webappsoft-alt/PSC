/**
 * Registration (Figma "NEW on-boarding"): three flows sharing the steps.
 *  - Regular:          type → DOB → names → addressing → gender → contact …
 *  - Pro / Individual: type → individual → DOB → names → …
 *  - Pro / Entity:     type → company → founding date → entity name → contact …
 * The account is created on the Username step; industry, working-at and job
 * title follow as profile steps (ProfileDetails), counted in the same total.
 */
export const FLOWS = {
  regular: [
    "UserType",
    "DOB",
    "Firstname",
    "Surname",
    "Addressing",
    "Gender",
    "Email",
    "EmailCode",
    "Phone",
    "PhoneCode",
    "Password",
    "ConfirmPassword",
    "Username",
  ],
  individual: [
    "UserType",
    "ProType",
    "DOB",
    "Firstname",
    "Surname",
    "Addressing",
    "Gender",
    "Email",
    "EmailCode",
    "Phone",
    "PhoneCode",
    "Password",
    "ConfirmPassword",
    "Username",
  ],
  company: [
    "UserType",
    "ProType",
    "FoundingDate",
    "EntityName",
    "Email",
    "EmailCode",
    "Phone",
    "PhoneCode",
    "Password",
    "ConfirmPassword",
    "Username",
  ],
};

/** Industry, Working at, Job title — asked after the account exists. */
export const PROFILE_STEPS = 3;

export const flowOf = (state) =>
  state?.userType === "pro"
    ? state?.proType === "company"
      ? "company"
      : "individual"
    : "regular";

