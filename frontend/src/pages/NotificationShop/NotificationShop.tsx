import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ImgSP from "../../assets/images/imagePNG/lays_4.png";
import "./NotificationShop.css";
import fetchNotificationsByIdUser from "../../Service/NotificationService";
import { OrderStatus } from "../../Service/OrderService";
import useShopNotificationHandler from "./shopNotification";
import HeaderDashboard from "../DashboardPage/Header/HeaderDashboard";

export enum NotificationContentType {
  PRODUCT_RATED = "PRODUCT_RATED",
  TO_ORDER = OrderStatus.TO_ORDER,
  TO_RECEIVE = OrderStatus.TO_RECEIVE,
  COMPLETE = OrderStatus.COMPLETE,
  CANCEL_BYSHOP = OrderStatus.CANCEL_BYSHOP,
  CANCEL_BYUSER = OrderStatus.CANCEL_BYUSER,
}

interface DecodedToken {
  idUser: number;
  // Other fields if any
}

export interface NotificationData {
  id: number;
  type: NotificationContentType;
  message: string;
  title?: string | null;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  relatedProductId?: number | null;
  relatedShopId?: number | null;
  relatedCartItemId?: number | null;
  sender?: { name?: string; avarta?: string };
  relatedProduct?: { name?: string; img?: string };
  relatedShop?: { name?: string };
}

const NotificationShopPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notificationsPerPage] = useState<number>(5);

  const { handleRedirectNotification } = useShopNotificationHandler();

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
    console.log("type: ", type);
    switch (type) {
      case NotificationContentType.COMPLETE:
        return {
          styleClass: "success",
        };
      case NotificationContentType.TO_ORDER:
        return {
          styleClass: "info",
        };
      case NotificationContentType.CANCEL_BYSHOP:
      case NotificationContentType.CANCEL_BYUSER:
        return {
          styleClass: "error",
        };
      case NotificationContentType.PRODUCT_RATED:
        return {
          styleClass: "info",
        };
      case NotificationContentType.TO_RECEIVE:
        return {
          styleClass: "info",
        };
      default:
        return {
          styleClass: "info",
        };
    }
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
    <div className="notification-container-shop">
      <HeaderDashboard />
      <div className="notifications-shop">
        <div className="notifications-header-shop">Notifications</div>
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
              notification.relatedShop?.name;

            return (
              <div
                key={notification.id}
                className={`notification-item-shop ${displayProps.styleClass} ${
                  notification.isRead ? "read" : "unread"
                }`}
                onClick={() => handleRedirectNotification(notification)}
              >
                {!notification.isRead && (
                  <div className="unread-indicator-shop"></div>
                )}
                <div className="notification-logo-shop">
                  <img
                    src={itemImage}
                    alt="Notification Icon"
                    onError={(e) => {
                      // Nếu ảnh lỗi, thử dùng icon mặc định của loại thông báo, rồi đến ImgSP
                      (e.target as HTMLImageElement).src = ImgSP;
                    }}
                  />
                </div>
                <div className="notification-text-shop">
                  <span className="product-status-shop">
                    {notification.message}
                  </span>
                  <span className="notification-time-shop">
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
export default NotificationShopPage;
