import { Formik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import * as yup from "yup";
import IconEmail from "../../assets/images/icons/ic_email.svg";
import IconEye from "../../assets/images/icons/ic_eye.svg";
import IconAddress from "../../assets/images/icons/ic_location.svg";
import IconLockEye from "../../assets/images/icons/ic_lock_eye.svg";
import IconPass from "../../assets/images/icons/ic_lockpass.svg";
import IconPhone from "../../assets/images/icons/ic_phone.svg";
import IconUser from "../../assets/images/icons/ic_user.svg";
import TextInput from "../../components/TextInput/TextInput";
import { loginApi, registerApiShop } from "../../Service/UserService";
import "./loginShop.css";

interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  password: string;
  role: number;
}

const LoginShop = () => {
  const navigate = useNavigate();
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [action, setAction] = useState("");
  const registerLink = () => {
    setAction(" show_register");
  };
  const loginLink = () => {
    setAction("");
  };
  const loginSchema = yup.object().shape({
    email: yup.string().email("Invalid email").required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const registerSchema = yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: yup.string().required("Phone number is required"),
    address: yup.string().required("Address is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleShowPass = () => {
    setIsShowPassword((prev) => !prev);
  };

  // // Hàm xử lý login
  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      let res = await loginApi(values.email, values.password);
      console.log("API login: ", res);
      if (res && res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("userRole", "shop");
        setTimeout(() => {
          setIsLoading(false);
          window.location.href = "/dashboard";
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

  // Hàm xử lý đăng kí tài khoản
  const handleRegister = async (
    values: RegisterFormValues,
    { resetForm }: any
  ) => {
    try {
      console.log("Values before API call:", values);
      let res = await registerApiShop(values);
      console.log("API sign up: ", res);
      if (res && res.status === 400) {
        toast.error(res.data.message.message);
      } else {
        toast.success("Register successful!");
        resetForm();
        loginLink();
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Register failed!!!");
    }
  };

  return (
    <div className="main-container">
      <div className={`wrapper${action}`}>
        {/* Form đăng nhập */}
        <div className="form-boxx login">
          <h2>Login</h2>
          <Formik<LoginFormValues>
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={handleLogin}
          >
            {({
              values,
              handleSubmit,
              handleChange,
              handleBlur,
              touched,
              errors,
            }) => (
              <form onSubmit={handleSubmit} className="form-login">
                <TextInput
                  label="Email"
                  required
                  labelStyle="lable-input"
                  placeholder="Enter your email"
                  suffix={<img src={IconUser} alt="" className="ic_24" />}
                  value={values.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={touched.email ? errors.email ?? "" : ""}
                />

                <TextInput
                  label="Password"
                  labelStyle="lable-input"
                  required
                  type={isShowPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  suffix={
                    <img
                      src={isShowPassword ? IconEye : IconLockEye}
                      alt=""
                      onClick={handleShowPass}
                      className="ic_24"
                      style={{ cursor: "pointer" }}
                    />
                  }
                  value={values.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password ? errors.password ?? "" : ""}
                />

                <div className="registerLink">
                  <p>
                    You don't have account?{" "}
                    <a
                      href="#register"
                      className="register"
                      onClick={registerLink}
                    >
                      Sign up
                    </a>
                  </p>
                </div>

                <button
                  type="submit"
                  className={values.email && values.password ? "showlogin" : ""}
                  disabled={!values.email || !values.password}
                >
                  {isLoading ? "Loading..." : "Login"}
                </button>
              </form>
            )}
          </Formik>
        </div>

        {/* Form đăng kí */}
        <div className="form-boxx register">
          <h2>Sing up</h2>
          <Formik<RegisterFormValues>
            initialValues={{
              name: "",
              phoneNumber: "",
              email: "",
              address: "",
              password: "",
              role: 2,
            }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
          >
            {({
              values,
              handleSubmit,
              handleChange,
              handleBlur,
              touched,
              errors,
            }) => (
              <form onSubmit={handleSubmit} className="form-register">
                <TextInput
                  label="Name"
                  required
                  labelStyle="lable-input"
                  placeholder="Enter your name"
                  suffix={<img src={IconUser} alt="" className="ic_24" />}
                  value={values.name}
                  onChange={handleChange("name")}
                  onBlur={handleBlur("name")}
                  error={touched.name ? errors.name ?? "" : ""}
                />

                <TextInput
                  label="Phone number"
                  labelStyle="lable-input"
                  required
                  placeholder="Enter your phone number"
                  suffix={<img src={IconPhone} alt="" className="ic_24" />}
                  value={values.phoneNumber}
                  onChange={handleChange("phoneNumber")}
                  onBlur={handleBlur("phoneNumber")}
                  error={touched.phoneNumber ? errors.phoneNumber ?? "" : ""}
                />

                <TextInput
                  label="Email"
                  labelStyle="lable-input"
                  required
                  placeholder="Enter your email"
                  suffix={<img src={IconEmail} alt="" className="ic_24" />}
                  value={values.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  error={touched.email ? errors.email ?? "" : ""}
                />

                <TextInput
                  label="Address"
                  labelStyle="lable-input"
                  required
                  placeholder="Enter your address"
                  suffix={<img src={IconAddress} alt="" className="ic_24" />}
                  value={values.address}
                  onChange={handleChange("address")}
                  onBlur={handleBlur("address")}
                  error={touched.address ? errors.address ?? "" : ""}
                />

                <TextInput
                  label="Password"
                  labelStyle="lable-input"
                  required
                  type="password"
                  placeholder="Enter your phone number"
                  suffix={<img src={IconPass} alt="" className="ic_24" />}
                  value={values.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  error={touched.password ? errors.password ?? "" : ""}
                />

                <div className="registerLink">
                  <p>
                    You have account?{" "}
                    <a href="#" className="register" onClick={loginLink}>
                      Login
                    </a>
                  </p>
                </div>

                <button type="submit" className="login">
                  Sign up
                </button>
              </form>
            )}
          </Formik>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default LoginShop;
