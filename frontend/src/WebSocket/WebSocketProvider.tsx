import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useState,
} from "react";
import io, { Socket } from "socket.io-client";

// Thêm interface để định nghĩa kiểu dữ liệu cho context
interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// Cập nhật kiểu dữ liệu cho context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode; // Định nghĩa kiểu cho prop children
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:3000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    // Lắng nghe sự kiện kết nối thành công
    newSocket.on("connect", () => {
      console.log("Socket connected in provider ~!!!");
      setIsConnected(true);
    });

    // Lắng nghe sự kiện mất kết nối
    newSocket.on("disconnect", (error: any) => {
      console.log("Socket disconnected in provider ~!!!", error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup khi component bị unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected }}>
      {children} {/* Render children */}
    </WebSocketContext.Provider>
  );
};

// Hook để sử dụng WebSocket trong các component con
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
