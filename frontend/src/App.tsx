// import HomePage from "./pages/HomePage/HomePage";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import SignUpLogInForm from "./pages/LoginPage/singUpLoginForm";
import LoginShop from "./pages/LoginShop/loginShop";
import { AuthRoute, PrivateRoute } from "./router/protectRouter";
import HomePage from "./pages/HomePage/HomePage";
import { ToastContainer } from "react-toastify";
import { PaymentPage } from "./pages/PaymentPages/index";
import DashboardPage from "./pages/DashboardPage/DashboardPage";

function App() {
  return (
    <>
      <div className="App">
        <Routes>
          {/* khi đã đăng nhập thì không đueọc vào trang Login */}
          <Route
            path="/login"
            element={
              <AuthRoute>
                <DashboardPage />
              </AuthRoute>
            }
          />
          {/* Chỉ có thể vào trang home nếu đã đăng nhập */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          {/* Thêm tuyến đường cho trang PaymentPage */}
          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <PaymentPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
