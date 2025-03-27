import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: ReactNode;
}
interface AuthRouteProps {
  children: ReactNode;
}

// Bảo vệ các trang chỉ cho phép truy cập khi có token
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const token = localStorage.getItem("token"); // Lấy token từ localStorage
  return token ? <>{children}</> : <Navigate to="/login" />;
};

// Bảo vệ trang login: nếu đã đăng nhập (có token) thì không cho phép vào
const AuthRoute = ({ children }: AuthRouteProps) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" /> : <>{children}</>;
};

export { PrivateRoute, AuthRoute };
