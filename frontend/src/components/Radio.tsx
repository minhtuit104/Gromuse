
interface RadioOption{
    label: string;
    value: any;
}

interface RadioGroupProps {
    options: RadioOption[];
    optionSelected: number;
    onSelect?: () => void;
    labelStyle: string;
    
}

const RadioGroup = (props: RadioGroupProps) => {
  return <div></div>;
};

export default RadioGroup;


