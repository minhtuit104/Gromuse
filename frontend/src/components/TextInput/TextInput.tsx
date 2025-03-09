import { Input } from "antd";
import React, { useMemo } from "react";
import "./TextInput.css";
interface TextInputProps {
  label?: string;
  labelStyle?: string;
  type?: string
  required?: boolean;
  placeholder?: string;
  wrapperStyle?: string;
  style?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  message?: string;
  messageStyle?: string;
  error?: string;
  disabled?: boolean;
  value?: string; // ✅ Nhận giá trị từ Formik
  onChange?: (value: string) => void; // ✅ Để Formik có thể kiểm soát input
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void; // ✅ Để Formik cập nhật trạng thái touched
}

const TextInput = ({
  label,
  type = "text",
  labelStyle,
  required = false,
  placeholder,
  onChange,
  wrapperStyle,
  style,
  prefix,
  suffix,
  message,
  messageStyle,
  error,
  value = "",
  onBlur,
  disabled,
}: TextInputProps) => {
  const renderMessage = useMemo(() => {
    if (!!error) {
      return <p className={`error`}>{error}</p>;
    }
    if (!!message) {
      return <p className={`message ${messageStyle}`}>{message}</p>;
    }
  }, [error, message]);
  return (
    <div className={`text-input ${wrapperStyle}`}>
      {label && (
        <label className={`label ${labelStyle}`}>
          {label}
          {required ? <span className="label_require"> *</span> : null}
        </label>
      )}
      <Input
        className={`input ${style} ${error ? "input_error" : ""} ${
          disabled ? "input_disabled" : ""
        }`}
        type={type}
        disabled={disabled}
        size="large"
        placeholder={placeholder}
        prefix={prefix}
        suffix={suffix}
        value={value} // ✅ Truyền giá trị từ Formik vào Input
        onChange={(e) => onChange?.(e.target.value)} // ✅ Truyền event từ Formik
        onBlur={onBlur} // ✅ Cập nhật trạng thái touched của Formik
      />
      {renderMessage}
    </div>
  );
};

export default TextInput;
