import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import SignUpLogInForm from "./pages/LoginPage/singUpLoginForm";
import { AuthRoute, PrivateRoute } from "./router/protectRouter";
import HomePage from "./pages/HomePage/HomePage";
import { ToastContainer } from "react-toastify";
import { PaymentPage } from "./pages/PaymentPages/index";
import AddProduct from "./pages/AddProducts/addProduct";

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
                <SignUpLogInForm />
              </AuthRoute>
            }
          />
          {/* Chỉ có thể vào trang feed nếu đã đăng nhập */}
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
          {/* Thêm tuyến đường cho trang AddProduct và EditProduct */}
          <Route
            path="/add_product"
            element={
              <PrivateRoute>
                <AddProduct />
              </PrivateRoute>
            }
          />
          <Route
            path="/add_product/:id"
            element={
              <PrivateRoute>
                <AddProduct />
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
