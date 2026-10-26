import CustomSwitch from "./CustomSwitch";

/**
 * Old PSC toggle — now the same Figma "Toggle - Switch" as CustomSwitch so the
 * app has one toggle everywhere. Props kept for existing callers
 * (activeColor → on tint; inactiveColor is ignored: the kit's off track is fixed).
 */
const CustomToggle = ({ value = false, setValue, activeColor, disabled }) => (
  <CustomSwitch
    value={value}
    setValue={setValue}
    bgColor={activeColor}
    disabled={disabled}
  />
);

export default CustomToggle;
