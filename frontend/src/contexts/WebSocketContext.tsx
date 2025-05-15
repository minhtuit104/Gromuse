import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
});

const useWebSocket = () => useContext(WebSocketContext);
export { useWebSocket };

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      const token = localStorage.getItem("token");
      if (!token || !mounted) return;

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          console.log("Token hết hạn, không thể kết nối WebSocket");
          localStorage.removeItem("token");
          return;
        }

        // Khởi tạo kết nối socket với server
        socketInstance = io("http://localhost:3000", {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        // Xử lý các sự kiện socket
        socketInstance.on("connect", () => {
          if (mounted) {
            console.log("[WebSocket] Kết nối thành công");
            console.log("[WebSocket] Socket ID:", socketInstance?.id);
            setIsConnected(true);
            // Chỉ hiển thị toast khi component đã mount
            setTimeout(() => {
              if (mounted) {
                // toast.success("Đã kết nối tới server!");
              }
            }, 100);
          }
        });

        socketInstance.on("connect_error", (error) => {
          if (mounted) {
            console.error("[WebSocket] Lỗi kết nối:", error.message);
            setIsConnected(false);
            // toast.error("Không thể kết nối tới server!");
          }
        });

        socketInstance.on("disconnect", (reason) => {
          if (mounted) {
            console.log("[WebSocket] Ngắt kết nối, lý do:", reason);
            setIsConnected(false);
            // toast.warning("Mất kết nối tới server!");
          }
        });

        // Lắng nghe sự kiện thông báo từ server
        socketInstance.on("orderNotification", (data) => {
          if (!mounted) {
            console.log(
              "[WebSocket] Component không còn mounted, bỏ qua thông báo"
            );
            return;
          }

          console.log(
            "[WebSocket] Nhận thông báo mới:",
            JSON.stringify(data, null, 2)
          );
          const { type, message, orderId } = data;

          if (!type || !message) {
            console.error(
              "[WebSocket] Thông báo không hợp lệ:",
              JSON.stringify(data, null, 2)
            );
            return;
          }

          console.log(
            `[WebSocket] Xử lý thông báo - Loại: ${type}, OrderId: ${
              orderId || "N/A"
            }`
          );
          // Đảm bảo component vẫn mounted trước khi hiển thị toast
          setTimeout(() => {
            if (!mounted) {
              console.log(
                "[WebSocket] Component unmounted trong quá trình xử lý, bỏ qua toast"
              );
              return;
            }

            const toastConfig = {
              position: "top-right" as const,
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              onOpen: () =>
                console.log(
                  `[Toast] Hiển thị thông báo ${type} - OrderId: ${
                    orderId || "N/A"
                  }`
                ),
              onClose: () =>
                console.log(
                  `[Toast] Đóng thông báo ${type} - OrderId: ${
                    orderId || "N/A"
                  }`
                ),
            };

            try {
              switch (type) {
                case "order_status":
                  toast.info(message, toastConfig);
                  break;
                case "new_order":
                  toast.success(message, toastConfig);
                  break;
                case "order_cancel":
                  toast.warning(message, toastConfig);
                  break;
                default:
                  toast.info(message, toastConfig);
              }
              console.log(`[WebSocket] Đã xử lý thành công thông báo ${type}`);
            } catch (error) {
              console.error(`[WebSocket] Lỗi khi hiển thị toast:`, error);
            }
          }, 100);
        });

        if (mounted) {
          setSocket(socketInstance);
        }
      } catch (error) {
        console.error("Lỗi khi thiết lập WebSocket:", error);
      }
    };

    // Khởi tạo socket sau khi component mount
    setTimeout(initializeSocket, 100);

    // Cleanup khi component unmount
    return () => {
      mounted = false;
      if (socketInstance) {
        socketInstance.close();
      }
    };
  }, []); // Chỉ chạy một lần khi component mount

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
