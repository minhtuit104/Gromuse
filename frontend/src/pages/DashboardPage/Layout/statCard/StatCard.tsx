import React from "react";
import "./statCard.css";
import IconIncrease from "../../../../assets/images/icons/Icon_upto.svg";
import IconDecrease from "../../../../assets/images/icons/Icon_downto.svg";

interface StatCardProps {
  icon: any;
  title: string;
  value: string | number;
  trend: {
    value: number;
    label: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  trend,
}) => {
  const isPositive = trend.value > 0;

  return (
    <div className="card_container">
      <div className="card_container_left">
        <h3 className="card_container_left_value">{value}</h3>
        <p className="card_container_left_title">{title}</p>
        <p
          className={`${
            isPositive
              ? "card_left_paramete_reduce"
              : "card_left_paramete_increase"
          }`}
        >
          <div
            className={`background_percent ${
              isPositive ? "increase" : "decrease"
            }`}
          >
            <img
              src={isPositive ? IconIncrease : IconDecrease}
              alt="iconchange"
              className="ic_20"
            />
          </div>
          {Math.abs(trend.value)}% {trend.label}
        </p>
      </div>
      <div className="card_container_right">
        <img src={icon} alt="icon" />
      </div>
    </div>
  );
};
