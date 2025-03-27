import React, { useState } from "react";
import IconUser from "../../assets/images/icons/ic_user.svg";
import IconEye from "../../assets/images/icons/ic_eye.svg";
import IconLockEye from "../../assets/images/icons/ic_lock_eye.svg";
import IconError from "../../assets/images/icons/ic_error.svg";
import IconEmail from "../../assets/images/icons/ic_email.svg";
import IconPhone from "../../assets/images/icons/ic_phone.svg";
import IconLockpass from "../../assets/images/icons/ic_lockpass.svg";
import "./SignUpLogInForm.css";
import { loginApi, registerApi } from "../../Service/UserService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SignUpLogInForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    name: "",
    phoneNumber: "",
  });

  // Hàm xử lý validate email
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEmail(value);

    // Validate email realtime
    const newErrors = { ...errors };
    if (!value.trim()) {
      newErrors.email = "Email or phone number is required";
    } else if (
      !/^[a-zA-Z0-9._-]+@gmail\.com$/.test(value) &&
      !/^\d{9,15}$/.test(value)
    ) {
      newErrors.email = "Invalid email or phone number format";
    } else {
      newErrors.email = "";
    }
    setErrors(newErrors);
  };

  // Hàm xử lý validate password
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPassword(value);

    // Validate password realtime
    const newErrors = { ...errors };
    if (!value) {
      newErrors.password = "Password is required";
    } else if (value.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    } else {
      newErrors.password = ""; // Xóa lỗi nếu hợp lệ
    }
    setErrors(newErrors);
  };

  // Hàm xử lý login
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Kiểm tra dữ liệu đăng nhập

    setIsLoading(true);
    try {
      let res = await loginApi(email, password);
      console.log("API:======", res);
      if (res && res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        setTimeout(() => {
          setIsLoading(false);
          window.location.href = "/";
        }, 500);
        toast.success("Login successful!");
      } else {
        if (res && res.status === 400) {
          toast.error(res.data.message.message);
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  // Hàm xử lý validate đăng kí
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    const newErrors = { ...errors };
    switch (name) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Name is required";
        } else if (value.length < 2) {
          newErrors.name = "Name must be at least 2 characters long";
        } else {
          newErrors.name = "";
        }
        break;
      case "email":
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!/^[a-zA-Z0-9._-]+@gmail\.com$/.test(value)) {
          newErrors.email = "Invalid email format";
        } else {
          newErrors.email = "";
        }
        break;
      case "phoneNumber":
        if (!value.trim()) {
          newErrors.phoneNumber = "Phone number is required";
        } else if (!/^\d{9,15}$/.test(value)) {
          newErrors.phoneNumber = "Invalid phone number format";
        } else {
          newErrors.phoneNumber = "";
        }
        break;
      case "password":
        if (!value.trim()) {
          newErrors.password = "Password is required";
        } else if (value.length < 6) {
          newErrors.password = "Password must be at least 6 characters long";
        } else {
          newErrors.password = "";
        }
        break;
    }
    setErrors(newErrors);
  };

  // Hàm xử lý đăng kí tài khoản
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let res = await registerApi(
        formData.name,
        formData.email,
        formData.phoneNumber,
        formData.password
      );
      console.log("Registration successful:", res);
      if (res && res.status === 400) {
        toast.error(res.data.message.message);
      } else {
        toast.success("Register successful!");
        setFormData({
          name: "",
          email: "",
          phoneNumber: "",
          password: "",
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Register failed!!!");
    }
  };

  return (
    <div className="main-container">
      <div className={`container ${isRegistering ? "active" : ""}`}>
        {/* Login Form --------------------------------------------- */}
        <div className="form-box login">
          <form action="#" onSubmit={handleLogin}>
            <h1>Login</h1>
            <div className="input-box">
              <input
                type="text"
                placeholder="Enter email or phone number"
                value={email}
                onChange={handleEmailChange}
              />
              <img src={IconUser} alt="user" className="ic_20 icon-user-pass" />
              {errors.email && (
                <div className="error-message">
                  <img src={IconError} alt="error" className="ic-error" />
                  {errors.email}
                </div>
              )}
            </div>
            <div className="input-box">
              <input
                type={isShowPassword === true ? "text" : "password"}
                id="input-pass"
                placeholder="Enter password"
                value={password}
                onChange={handlePasswordChange}
              />
              <img
                src={isShowPassword ? IconEye : IconLockEye}
                alt="password"
                className="ic_20 icon-user-pass"
                onClick={() => setIsShowPassword(!isShowPassword)}
              />
              {errors.password && (
                <div className="error-message">
                  <img src={IconError} alt="error" className="ic-error" />
                  {errors.password}
                </div>
              )}
            </div>
            <div className="forgot-link">
              <a href="#">Forgot Password?</a>
            </div>
            <button
              type="submit"
              className={email && password ? "btn" : ""}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? "Loading..." : "Login"}
            </button>
          </form>
        </div>

        {/* Register Form ---------------------------------------------*/}
        <div className="form-box register">
          <form action="##" onSubmit={handleRegister}>
            <h1>Registration</h1>
            <div className="input-box">
              <input
                type="text"
                name="name"
                placeholder="Username"
                value={formData.name}
                onChange={handleRegisterChange}
              />
              <img src={IconUser} alt="user" className="ic_20 icon-user-pass" />
              {errors.name && (
                <div className="error-message">
                  <img src={IconError} alt="error" className="ic-error" />
                  {errors.name}
                </div>
              )}
            </div>
            <div className="input-box">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleRegisterChange}
              />
              <img
                src={IconEmail}
                alt="user"
                className="ic_20 icon-user-pass"
              />
              {errors.email && (
                <div className="error-message">
                  <img src={IconError} alt="error" className="ic-error" />
                  {errors.email}
                </div>
              )}
            </div>
            <div className="input-box">
              <input
                type="phonenumber"
                name="phoneNumber"
                placeholder="Phone number"
                value={formData.phoneNumber}
                onChange={handleRegisterChange}
              />
              <img
                src={IconPhone}
                alt="user"
                className="ic_20 icon-user-pass"
              />
              {errors.phoneNumber && (
                <div className="error-message">
                  <img src={IconError} alt="error" className="ic-error" />
                  {errors.phoneNumber}
                </div>
              )}
            </div>
            <div className="input-box">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleRegisterChange}
              />
              <img
                src={IconLockpass}
                alt="user"
                className="ic_20 icon-user-pass"
              />
              {errors.password && (
                <div className="error-message">
                  <img src={IconError} alt="error" className="ic-error" />
                  {errors.password}
                </div>
              )}
            </div>
            <button type="submit" className="btn">
              Register
            </button>
          </form>
        </div>

        {/* Toggle Panel */}
        <div className="toggle-box">
          <div className="toggle-panel toggle-left">
            <h1>Welcome to Gromuse!</h1>
            <p>Don't have an account?</p>
            <button
              className="btn register-btn"
              onClick={() => setIsRegistering(true)}
            >
              Register
            </button>
          </div>

          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Already have an account?</p>
            <button
              className="btn login-btn"
              onClick={() => setIsRegistering(false)}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpLogInForm;
