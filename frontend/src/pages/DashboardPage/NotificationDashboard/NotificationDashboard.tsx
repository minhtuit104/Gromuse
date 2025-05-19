import { jwtDecode } from "jwt-decode";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import fetchNotificationsByIdUser from "../../../Service/NotificationService";
import IconNotifi from "../../../assets/images/icons/ic_notification.svg";
import Iconpolygon from "../../../assets/images/icons/ic_polygon.svg";
import ImgSP from "../../../assets/images/imagePNG/lays_4.png";
import { NotificationContentType } from "../../../pages/Notification/Notification";
import useNotification from "../../Notification/useNotification";
import "./NotificationDashboard.css";

interface DecodedToken {
  idUser: number;
  role?: number;
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
  relatedUser?: { name?: string; avarta?: string }; // Thông tin người dùng liên quan (khách hàng)
}

function NotificationDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationListRef = useRef<HTMLDivElement>(null);

  const { handleRedirectNotification } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.idUser);
      } catch (e) {
        console.error("Invalid token for notification dashboard:", e);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = (await fetchNotificationsByIdUser(userId, 1, 10)) as any;
      if (response && response.data && response.data.data) {
        setNotifications(response.data.data);
        const unread = response.data.data.filter(
          (n: NotificationData) => !n.isRead
        ).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
      if (notificationListRef.current) {
        notificationListRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error("Error refreshing notifications for dashboard:", err);
      setError("Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!userId) return;
      try {
        const response = (await fetchNotificationsByIdUser(
          userId,
          1,
          10 // Lấy 10 thông báo để tính unread count, có thể điều chỉnh
        )) as any;
        if (response && response.data && response.data.data) {
          const unread = response.data.data.filter(
            (n: NotificationData) => !n.isRead
          ).length;
          setUnreadCount(unread);
        } else {
          setUnreadCount(0);
        }
      } catch (err) {
        console.error(
          "Error fetching unread notification count for dashboard:",
          err
        );
        setUnreadCount(0);
      }
    };
    loadUnreadCount();
    const intervalId = setInterval(loadUnreadCount, 60000); // Cập nhật mỗi phút
    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    if (isOpen && notificationListRef.current) {
      notificationListRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Lắng nghe sự kiện tùy chỉnh từ WebSocket để làm mới thông báo
  useEffect(() => {
    const handleNewShopNotification = (event: Event) => {
      console.log(
        "Dashboard: newShopNotificationReceived event caught, refreshing data."
      );
      if (isOpen) {
        refreshNotifications(); // Làm mới nếu dropdown đang mở
      } else {
        // Nếu dropdown đóng, tăng số lượng chưa đọc
        setUnreadCount((prev) => prev + 1);
      }
    };
    window.addEventListener(
      "newShopNotificationReceived",
      handleNewShopNotification
    );
    return () =>
      window.removeEventListener(
        "newShopNotificationReceived",
        handleNewShopNotification
      );
  }, [isOpen, refreshNotifications]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && userId) {
      refreshNotifications(); // Làm mới thông báo khi mở dropdown
    }
  };

  // Làm mới thông báo khi dropdown được mở và có userId
  useEffect(() => {
    if (isOpen && userId) {
      refreshNotifications();
    }
  }, [isOpen, userId, refreshNotifications]);

  const getNotificationDisplayProps = (type: NotificationContentType) => {
    // Trả về class CSS dựa trên loại thông báo
    switch (type) {
      case NotificationContentType.TO_ORDER:
        return { styleClass: "new-order" };
      case NotificationContentType.CANCEL_BYUSER:
      case NotificationContentType.CANCEL_BYSHOP:
        return { styleClass: "canceled" };
      case NotificationContentType.PRODUCT_RATED:
        return { styleClass: "rated" };
      default:
        return { styleClass: "default" };
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    // Hiển thị HH:MM
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSeeAllClick = () => {
    navigate("/notification_Shop");
    setIsOpen(false);
  };

  return (
    <div className="notification-container-dashboard" ref={dropdownRef}>
      <div className="header_right_icon" onClick={toggleDropdown}>
        <img src={IconNotifi} alt="icon_notifi" className="ic_24 icon_notifi" />
        {unreadCount > 0 && (
          <span className="quantity_notifi">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <>
          <div className="notification-arrow-dashboard">
            <img
              src={Iconpolygon}
              alt="Iconpolygon"
              className="ic_24 arrow-dashboard"
            />
          </div>
          <div className="notification-dropdown-dashboard">
            <div className="notification-header-top-dashboard">
              <h3 className="notification-title-dashboard">Notifications</h3>
            </div>
            <div
              className={`notification-list-dashboard ${
                notifications.length <= 3 ? "few-items" : ""
              }`}
              ref={notificationListRef}
            >
              {isLoading && (
                <div className="notification-item-loadding-dashboard">
                  <div className="notification-icon-load-dashboard"></div>
                  <div className="list-loadding-dashboard">
                    <div className="loadding-item1-dashboard"></div>
                    <div className="loadding-item2-dashboard"></div>
                  </div>
                </div>
              )}
              {!isLoading && error && (
                <div className="notification-item-dashboard error-text-dashboard">
                  {error}
                </div>
              )}
              {!isLoading && !error && notifications.length === 0 && (
                <div className="notification-item-dashboard no-notifications-text-dashboard">
                  No new notifications.
                </div>
              )}
              {!isLoading &&
                !error &&
                notifications.map((notification) => {
                  const displayProps = getNotificationDisplayProps(
                    notification.type
                  );

                  return (
                    <div
                      key={notification.id}
                      className={`notification-item-dashboard ${
                        displayProps.styleClass
                      } ${
                        notification.isRead
                          ? "read-dashboard"
                          : "unread-dashboard"
                      }`}
                      onClick={() => handleRedirectNotification(notification)}
                    >
                      {!notification.isRead && (
                        <div className="unread-indicator-dashboard"></div>
                      )}
                      <div className="notification-icon-dashboard">
                        <img
                          src={notification.imageUrl || ImgSP}
                          alt="icon"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ImgSP;
                          }}
                        />
                      </div>
                      <div className="notification-content-dashboard">
                        <div className="notification-text-dashboard">
                          {/* Hiển thị nội dung hành động */}
                          {notification.message}
                        </div>
                        <span className="notification-time-dashboard">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="notification-header-cpn">
              <span className="see-all" onClick={handleSeeAllClick}>
                See all
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationDashboard;
