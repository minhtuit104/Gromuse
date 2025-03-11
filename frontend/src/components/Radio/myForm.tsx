import React, { useState } from "react";
import RadioGroup from "./radio";

const MyForm = () => {
  const options = [
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
    { label: "Option 3", value: "option3" },
  ];

  const [selectedOption, setSelectedOption] = useState<string>("option1");

  const handleSelect = (value: string) => {
    setSelectedOption(value);
  };

  return (
    <div>
      <h2>Select an Option</h2>
      <RadioGroup
        options={options}
        onSelect={handleSelect}
        labelStyle="label-primary"
      />
      <p>Selected Option: {selectedOption}</p>
    </div>
  );
};

export default MyForm;
