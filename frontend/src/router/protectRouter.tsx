import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: ReactNode;
}
interface AuthRouteProps {
  children: ReactNode;
}

// Bảo vệ các trang chỉ cho phép truy cập cho user thông thường (role khác shop)
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem("token"); // Lấy token từ localStorage
  const userRole = localStorage.getItem("userRole");

  // Nếu không có token, chuyển đến trang đăng nhập
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Nếu là shop (role = shop), chuyển đến dashboard
  if (userRole === "shop") {
    return <Navigate to="/dashboard" />;
  }

  // Nếu là user thông thường, cho phép truy cập
  return <>{children}</>;
};

// Bảo vệ trang login: nếu đã đăng nhập (có token) thì điều hướng tùy theo role
const AuthRoute = ({ children }: AuthRouteProps) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (token) {
    // Nếu userRole là "shop" (shop), chuyển hướng đến /dashboard
    // Ngược lại, chuyển hướng đến trang chủ
    return userRole === "shop" ? (
      <Navigate to="/dashboard" />
    ) : (
      <Navigate to="/" />
    );
  }

  return <>{children}</>;
};

// Có thể thêm một route bảo vệ cho trang Dashboard, chỉ cho phép shop truy cập
const ShopRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (!token) {
    return <Navigate to="/loginShop" />;
  }

  // Nếu không phải role shop (shop), chuyển về trang chủ
  if (userRole !== "shop") {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export { PrivateRoute, AuthRoute, ShopRoute };
