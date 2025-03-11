import React from "react";
import Switch from "react-switch";

interface SwitchButtonProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onColor?: string;
  offColor?: string;
  height?: number;
  width?: number;
}

const SwitchButton: React.FC<SwitchButtonProps> = ({
  label,
  checked,
  onChange,
  onColor = "#4CAF50",
  offColor = "#D9534F",
  height = 20,
  width = 48,
}) => {
  return (
    <div className="checkbox-container">
      <label className="checkbox-label">{label}</label>
      <Switch
        onChange={onChange}
        checked={checked}
        onColor={onColor}
        offColor={offColor}
        uncheckedIcon={false}
        checkedIcon={false}
        height={height}
        width={width}
      />
    </div>
  );
};

export default SwitchButton;
