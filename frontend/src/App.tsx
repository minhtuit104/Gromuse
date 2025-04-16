import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import SignUpLogInForm from "./pages/LoginPage/singUpLoginForm";
// import LoginShop from "./pages/LoginShop/loginShop";
// import DashboardPage from "./pages/DashboardPage/DashboardPage";
import { AuthRoute, PrivateRoute } from "./router/protectRouter";
import HomePage from "./pages/HomePage/HomePage";
import { PaymentPage } from "./pages/PaymentPages/index";
import AddProduct from "./pages/AddProducts/addProduct";
import DetailPage from "./pages/DetailPage/detailPage";
import ErrorBoundary from "./components/ErrorBoundary";
import OrderShop from "./pages/OrderShop/Order/OrderShop";
import OrderHistory from "./pages/OrderShop/OrderHistory/OrderHistory";
import OrderCancel from "./pages/OrderShop/OrderCancel/OrderCancel";
import RatingProduct from "./pages/OrderStatus/RatingProduct/RatingProduct";
import ListProduct from "./pages/ListProduct/ListProduct";
import OrderStatuss from "./pages/OrderStatus/OrderStatus";

function App() {
  return (
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
        {/* <Route
          path="/loginShop"
          element={
            <AuthRoute>
              <LoginShop />
            </AuthRoute>
          }
        /> */}
        {/* Chỉ có thể vào trang home nếu đã đăng nhập */}
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
        {/* Thêm tuyến đường cho trang DetailPage */}
        <Route
          path="/detail_page/:id"
          element={
            <PrivateRoute>
              <ErrorBoundary>
                <DetailPage />
              </ErrorBoundary>
            </PrivateRoute>
          }
        />
        <Route
          path="/product/:id"
          element={
            <PrivateRoute>
              <DetailPage />
            </PrivateRoute>
          }
        />
        {/* Thêm tuyến đường cho trang OrderShop */}
        <Route
          path="/order_shop"
          element={
            <PrivateRoute>
              <OrderShop />
            </PrivateRoute>
          }
        />
        {/* Thêm tuyến đường cho trang OrderHistory */}
        <Route
          path="/order_history"
          element={
            <PrivateRoute>
              <OrderHistory />
            </PrivateRoute>
          }
        />
        {/* Thêm tuyến đường cho trang OrderCancel */}
        <Route
          path="/order_cancel"
          element={
            <PrivateRoute>
              <OrderCancel />
            </PrivateRoute>
          }
        />
        {/* Thêm tuyến đường cho trang OrderStatus */}
        <Route
          path="/order_status"
          element={
            <PrivateRoute>
              <OrderStatuss />
            </PrivateRoute>
          }
        />
        {/* Thêm tuyến đường cho trang RatingProduct */}
        <Route
          path="/rating_product"
          element={
            <PrivateRoute>
              <RatingProduct />
            </PrivateRoute>
          }
        />
        {/* Thêm tuyến đường cho trang ListProduct */}
        <Route
          path="/list_product"
          element={
            <PrivateRoute>
              <ListProduct />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
