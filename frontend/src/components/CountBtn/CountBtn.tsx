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
  const isFirstRender = useRef(true);
  const prevInitialCountRef = useRef(initialCount);

  // Cập nhật count khi initialCount từ props thay đổi
  useEffect(() => {
    if (prevInitialCountRef.current !== initialCount) {
      setCount(initialCount);
      prevInitialCountRef.current = initialCount;
    }
  }, [initialCount]);

  // Thông báo thay đổi chỉ khi count thay đổi và không phải lần render đầu tiên
  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Chỉ gọi onChange khi cần thiết
    if (onChange) {
      onChange(count);
    }
  }, [count, onChange]);

  const handleDecrement = () => {
    if (allowZero) {
      setCount((prevCount) => Math.max(0, prevCount - 1));
    } else {
      if (count > 1) {
        setCount((prevCount) => prevCount - 1);
      }
    }
  };

  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
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
