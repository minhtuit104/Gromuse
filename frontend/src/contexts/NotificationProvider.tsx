import React from "react";
import { ToastContainer } from "react-toastify";
import { useWebSocket } from "./WebSocketContext";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  // Sử dụng WebSocket context để theo dõi trạng thái kết nối
  const { isConnected } = useWebSocket();

  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};
