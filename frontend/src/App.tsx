import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import AddProduct from "./pages/AddProducts/addProduct";
import DashboardPage from "./pages/DashboardPage/DashboardPage";
import DetailPage from "./pages/DetailPage/detailPage";
import HomePage from "./pages/HomePage/HomePage";
import ListProduct from "./pages/ListProduct/ListProduct";
import ListProductUser from "./pages/ListProductUser/ListProductUser";
import SignUpLogInForm from "./pages/LoginPage/singUpLoginForm";
import LoginShop from "./pages/LoginShop/loginShop";
import MessagerShop from "./pages/MessagerShop/MessagerShop";
import Messager from "./pages/MessagerUser/Messager";
import NotificationPage from "./pages/Notification/Notification";
import OrderShop from "./pages/OrderShop/Order/OrderShop";
import OrderCancel from "./pages/OrderShop/OrderCancel/OrderCancel";
import OrderHistory from "./pages/OrderShop/OrderHistory/OrderHistory";
import OrderStatuss from "./pages/OrderStatus/OrderStatus";
import RatingProduct from "./pages/OrderStatus/RatingProduct/RatingProduct";
import { PaymentPage } from "./pages/PaymentPages/index";
import { AuthRoute, PrivateRoute, ShopRoute } from "./router/protectRouter";

function App() {
  return (
    <>
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
      <WebSocketProvider>
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
            {/* Chỉ có thể vào trang DashboardPage nếu đã đăng nhập */}
            <Route
              path="/dashboard"
              element={
                <ShopRoute>
                  <DashboardPage />
                </ShopRoute>
              }
            />
            <Route
              path="/loginShop"
              element={
                <AuthRoute>
                  <LoginShop />
                </AuthRoute>
              }
            />
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
            {/* Thêm tuyến đường cho trang Messager User */}
            <Route
              path="/messager_user"
              element={
                <PrivateRoute>
                  <Messager />
                </PrivateRoute>
              }
            />
            {/* Thêm tuyến đường cho trang Messager Shop */}
            <Route
              path="/messager_shop"
              element={
                <ShopRoute>
                  <MessagerShop />
                </ShopRoute>
              }
            />
            {/* Thêm tuyến đường cho trang AddProduct và EditProduct */}
            <Route
              path="/add_product"
              element={
                <ShopRoute>
                  <AddProduct />
                </ShopRoute>
              }
            />
            <Route
              path="/add_product/:id"
              element={
                <ShopRoute>
                  <AddProduct />
                </ShopRoute>
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
            <Route path="/product/:id" element={<DetailPage />} />
            {/* Thêm tuyến đường cho trang OrderShop */}
            <Route
              path="/order_shop"
              element={
                <ShopRoute>
                  <OrderShop />
                </ShopRoute>
              }
            />
            {/* Thêm tuyến đường cho trang OrderHistory */}
            <Route
              path="/order_history"
              element={
                <ShopRoute>
                  <OrderHistory />
                </ShopRoute>
              }
            />
            {/* Thêm tuyến đường cho trang OrderCancel */}
            <Route
              path="/order_cancel"
              element={
                <ShopRoute>
                  <OrderCancel />
                </ShopRoute>
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
              path="/list_product_Shop"
              element={
                <ShopRoute>
                  <ListProduct />
                </ShopRoute>
              }
            />
            {/* Thêm tuyến đường cho trang ListProductUser */}
            <Route
              path="/list_product_User"
              element={
                <PrivateRoute>
                  <ListProductUser />
                </PrivateRoute>
              }
            />
            {/* Thêm tuyến đường cho trang Notification */}
            <Route
              path="/notification"
              element={
                <PrivateRoute>
                  <NotificationPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </WebSocketProvider>
    </>
  );
}

export default App;
