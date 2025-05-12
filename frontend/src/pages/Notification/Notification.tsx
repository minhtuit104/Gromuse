import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import "./Notification.css";
import Header from "../../layouts/Header/Header";
import ImgSP from "../../assets/images/imagePNG/lays_4.png";

import fetchNotificationsByIdUser, {
  markNotificationAsRead,
} from "../../Service/NotificationService";

// Enum for notification content types (synced with backend)
export enum NotificationContentType {
  ORDER_ACCEPTED = "ORDER_ACCEPTED",
  ORDER_SHIPPED = "ORDER_SHIPPED",
  ORDER_COMPLETED = "ORDER_COMPLETED",
  ORDER_CANCELLED_BY_USER = "ORDER_CANCELLED_BY_USER",
  ORDER_CANCELLED_BY_SHOP = "ORDER_CANCELLED_BY_SHOP",
  NEW_ORDER_FOR_SHOP = "NEW_ORDER_FOR_SHOP",
  PRODUCT_RATED = "PRODUCT_RATED",
  NEW_MESSAGE = "NEW_MESSAGE",
  PROMOTION = "PROMOTION",
}

type TabType = "toOrder" | "toReceive" | "completed" | "cancelled";

interface DecodedToken {
  idUser: number;
  // Other fields if any
}

interface NotificationData {
  id: number;
  type: NotificationContentType;
  message: string;
  title?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  redirectUrl?: string | null;
  relatedProductId?: number | null;
  relatedShopId?: number | null;
  relatedCartItemId?: number | null;
  sender?: { name?: string; avarta?: string };
  relatedProduct?: { name?: string; img?: string };
  relatedShop?: { name?: string };
}

const NotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [notificationsPerPage] = useState<number>(5);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.scrollTo(0, 0);
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.idUser);
      } catch (e) {
        console.error("Invalid token:", e);
        toast.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        navigate("/login");
      }
    } else {
      toast.error("Vui lòng đăng nhập để xem thông báo.");
      navigate("/login");
    }
  }, [navigate]);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = (await fetchNotificationsByIdUser(
        userId,
        1,
        100
      )) as any;
      if (response && response.data) {
        setNotifications(response.data.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching Notifications:", err);
      setError("Không thể tải thông báo. Vui lòng thử lại.");
      toast.error("Lỗi tải thông báo.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      setCurrentPage(1);
    }
  }, [userId, loadNotifications]);

  const getNotificationDisplayProps = (type: NotificationContentType) => {
    switch (type) {
      case NotificationContentType.ORDER_ACCEPTED:
        return {
          styleClass: "success",
          defaultTitle: "Đơn hàng được chấp nhận",
        };
      case NotificationContentType.ORDER_SHIPPED:
        return {
          styleClass: "info",
          defaultTitle: "Đơn hàng đang giao",
        };
      case NotificationContentType.ORDER_COMPLETED:
        return {
          styleClass: "success",
          defaultTitle: "Đơn hàng hoàn thành",
        };
      case NotificationContentType.ORDER_CANCELLED_BY_USER:
      case NotificationContentType.ORDER_CANCELLED_BY_SHOP:
        return {
          styleClass: "error",
          defaultTitle: "Đơn hàng đã hủy",
        };
      case NotificationContentType.NEW_ORDER_FOR_SHOP:
        return {
          styleClass: "new-order",
          defaultTitle: "Đơn hàng mới",
        };
      case NotificationContentType.PRODUCT_RATED:
        return {
          styleClass: "info",
          defaultTitle: "Đánh giá sản phẩm",
        };
      case NotificationContentType.NEW_MESSAGE:
        return {
          styleClass: "message",
          defaultTitle: "Tin nhắn mới",
        };
      case NotificationContentType.PROMOTION:
        return {
          styleClass: "promotion",
          defaultTitle: "Khuyến mãi",
        };
      default:
        return {
          styleClass: "default",
          defaultTitle: "Thông báo",
        };
    }
  };

  const handleMarkAsReadAndUpdateState = async (notificationId: number) => {
    if (!userId || isMarkingAsRead) return;
    setIsMarkingAsRead(true);
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read on page:", error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    let targetTab: TabType = "toOrder"; // Default value
    const userRole = localStorage.getItem("userRole");
    let orderIdToFocus = notification.relatedCartItemId || 0;

    if (notification.redirectUrl && notification.redirectUrl.includes("/")) {
      const potentialId = parseInt(
        notification.redirectUrl.split("/").pop() || "0"
      );
      if (potentialId > 0) {
        orderIdToFocus = potentialId;
      }
    }

    if (!notification.isRead) {
      await handleMarkAsReadAndUpdateState(notification.id);
    }

    switch (notification.type) {
      case NotificationContentType.ORDER_ACCEPTED:
      case NotificationContentType.ORDER_SHIPPED:
        targetTab = "toReceive";
        break;
      case NotificationContentType.ORDER_COMPLETED:
        targetTab = "completed";
        break;
      case NotificationContentType.ORDER_CANCELLED_BY_USER:
      case NotificationContentType.ORDER_CANCELLED_BY_SHOP:
        targetTab = "cancelled";
        break;
      case NotificationContentType.NEW_ORDER_FOR_SHOP:
        targetTab = "toOrder"; // For shop page
        break;
      case NotificationContentType.PRODUCT_RATED:
        if (notification.relatedProductId) {
          navigate(`/product/${notification.relatedProductId}`);
          return;
        }
        break;
      case NotificationContentType.NEW_MESSAGE:
        if (userRole === "user") {
          navigate(notification.redirectUrl || "/messager_user");
          return;
        }
        break;
      case NotificationContentType.PROMOTION:
        if (notification.redirectUrl) {
          navigate(notification.redirectUrl);
          return;
        }
        break;
      default:
        console.warn("Notification has unhandled type:", notification);
        return;
    }

    // Handle order-related notifications by navigating to OrderStatus page
    if (
      notification.type.startsWith("ORDER_") ||
      notification.type === NotificationContentType.NEW_ORDER_FOR_SHOP
    ) {
      console.log(
        `[Notification] Navigating to ${targetTab} tab for order ${orderIdToFocus}`
      );

      if (userRole === "user") {
        // Use the navigate function with state to pass data to OrderStatus component
        navigate("/order_status", {
          state: {
            targetTab: targetTab,
            orderIdToFocus: orderIdToFocus,
          },
        });
      }
    } else {
      console.warn(
        "Notification has unhandled type or missing redirectUrl:",
        notification
      );
    }
  };

  const formatNotificationMessage = (notification: NotificationData) => {
    const message = notification.message || "";
    // Remove "Đơn hàng #XX " pattern, also handling cases where there might be no space after #XX
    // Example: "Đơn hàng #123 được chấp nhận" -> "được chấp nhận"
    // Example: "Đơn hàng #123được chấp nhận" -> "được chấp nhận"
    let formatted = message.replace(/Đơn hàng\s*#\d+\s*/gi, "");
    // Capitalize the first letter of the remaining message
    if (formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return formatted;
  };
  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification =
    indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="notification-container">
      <Header />
      <div className="notifications">
        <div className="notifications-header">Notifications</div>
        {isLoading && (
          <div className="loading-indicator">Đang tải thông báo...</div>
        )}
        {!isLoading && error && <div className="error-indicator">{error}</div>}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="no-notifications">Bạn chưa có thông báo nào.</div>
        )}
        {!isLoading &&
          !error &&
          currentNotifications.map((notification) => {
            const displayProps = getNotificationDisplayProps(notification.type);
            const itemImage =
              notification.imageUrl || // Ưu tiên imageUrl từ notification
              notification.relatedProduct?.img ||
              ImgSP;
            let itemTitle =
              notification.relatedProduct?.name ||
              notification.relatedShop?.name ||
              displayProps.defaultTitle;

            return (
              <div
                key={notification.id}
                className={`notification-item ${displayProps.styleClass} ${
                  notification.isRead ? "read" : "unread"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {!notification.isRead && (
                  <div className="unread-indicator"></div>
                )}
                <div className="notification-logo">
                  <img
                    src={itemImage}
                    alt="Notification Icon"
                    onError={(e) => {
                      // Nếu ảnh lỗi, thử dùng icon mặc định của loại thông báo, rồi đến ImgSP
                      (e.target as HTMLImageElement).src = ImgSP;
                    }}
                  />
                </div>
                <div className="notification-text">
                  {itemTitle && (
                    <span className="store-name-product">{itemTitle}</span>
                  )}
                  <span className="product-status">
                    {formatNotificationMessage(notification)}
                  </span>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        {!isLoading && !error && notifications.length > 0 && totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={paginate}
            prevPage={prevPage}
            nextPage={nextPage}
          />
        )}
      </div>
    </div>
  );
};
interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  prevPage: () => void;
  nextPage: () => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  paginate,
  prevPage,
  nextPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-notification">
      <button
        onClick={prevPage}
        disabled={currentPage === 1}
        className={`pagination-button ${currentPage === 1 ? "disabled" : ""}`}
      >
        &laquo;
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`pagination-button ${
            currentPage === number ? "active" : ""
          }`}
        >
          {number}
        </button>
      ))}
      <button
        onClick={nextPage}
        disabled={currentPage === totalPages}
        className={`pagination-button ${
          currentPage === totalPages ? "disabled" : ""
        }`}
      >
        &raquo;
      </button>
    </div>
  );
};
export default NotificationPage;
