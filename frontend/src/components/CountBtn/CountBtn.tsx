import React, { useState, useEffect } from "react";
import "./CountBtn.css";
import IcMinus from "../../assets/images/icons/ic_ minus.svg";
import IcAdd from "../../assets/images/icons/ic_add.svg";

export interface CounterProps {
  initialCount?: number;
  specialDisplay?: string;
  onChange?: (newCount: number) => void;
  className?: string;
  allowZero?: boolean;
}

const Counter: React.FC<CounterProps> = ({
  initialCount = 1,
  onChange,
  allowZero = false,
}) => {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (onChange) {
      onChange(count);
    }
  }, [count, onChange]);

  const handleDecrement = () => {
    if (allowZero) {
      setCount((prevCount) => Math.max(0, prevCount - 1));
    } else {
      if (count > 1) {
        setCount(count - 1);
      }
    }
  };

  const handleIncrement = () => {
    setCount(count + 1);
  };

  return (
    <div className="counter-container">
      <button className="counter-button" onClick={handleDecrement}>
        <img src={IcMinus} alt="IcMinus" className="ic_40" />
      </button>
      <span className="counter-value">{count}</span>
      <button className="counter-button" onClick={handleIncrement}>
        <img src={IcAdd} alt="IcAdd" className="ic_28" />
      </button>
    </div>
  );
};

export default Counter;
