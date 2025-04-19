import React, { useState, useEffect, useRef } from "react";
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
  const prevInitialCountRef = useRef(initialCount);

  // Cập nhật count khi initialCount từ props thay đổi
  useEffect(() => {
    if (prevInitialCountRef.current !== initialCount) {
      setCount(initialCount);
      prevInitialCountRef.current = initialCount;
    }
  }, [initialCount]);

  const handleDecrement = () => {
    if (allowZero) {
      setCount((prevCount) => {
        onChange && onChange(prevCount - 1); // Call onChange callback if provided
        return Math.max(0, prevCount - 1);
      });
    } else {
      if (count > 1) {
        setCount((prevCount) => {
          onChange && onChange(prevCount - 1); // Call onChange callback if provided
          return prevCount - 1;
        });
      }
    }
  };

  const handleIncrement = () => {
    setCount((prevCount) => {
      onChange && onChange(prevCount + 1); // Call onChange callback if provided
      return prevCount + 1;
    });
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
