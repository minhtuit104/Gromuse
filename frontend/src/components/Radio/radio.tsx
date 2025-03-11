import React, { useState } from "react";
import "./radio.css";

interface RadioOption {
  label: string;
  value: any;
}

interface RadioGroupProps {
  options: RadioOption[];
  optionSelected?: number;
  onSelect?: (value: any) => void;
  labelStyle?: string;
}

const RadioGroup = ({ options, onSelect, labelStyle }: RadioGroupProps) => {
  const [selectedValue, setSelectedValue] = useState<any>(options[0]?.value);

  const handleSelect = (value: any) => {
    setSelectedValue(value);
    if (onSelect) {
      onSelect(value);
    }
  };

  return (
    <div className="payment-method">
      {options.map((option) => (
        <div key={option.value} className="radio-option">
          <input
            type="radio"
            id={option.value}
            name="radio-group"
            checked={selectedValue === option.value}
            onChange={() => handleSelect(option.value)}
            className="radio-input"
          />
          <label
            htmlFor={option.value}
            className={`radio-label ${labelStyle || ""}`}
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default RadioGroup;
