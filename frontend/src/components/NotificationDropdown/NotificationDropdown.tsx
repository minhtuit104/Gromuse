import { useState, useRef, useEffect } from "react";
import "./NotificationDropdown.css";
import ImgSP from "../../assets/images/imagePNG/lays_4.png";
import IconNotification from "../../assets/images/icons/ic_notification.svg";
import Iconpolygon from "../../assets/images/icons/ic_polygon.svg";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import fetchNotificationsByIdUser, {
  markNotificationAsRead,
} from "../../Service/NotificationService";
import { NotificationContentType } from "../../pages/Notification/Notification";
import useNotification from "../../pages/Notification/useNotification";

interface DecodedToken {
  idUser: number;
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

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const notificationListRef = useRef<HTMLDivElement>(null);

  const { handleRedirectNotification } = useNotification();

  // Get user ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserId(decoded.idUser);
      } catch (e) {
        console.error("Invalid token for notification dropdown:", e);
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

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!userId) {
        return;
      }
      try {
        const response = (await fetchNotificationsByIdUser(
          userId,
          1,
          5
        )) as any;
        if (response && response.data && response.data.data) {
          // Calculate unread count
          const unread = response.data.data.filter(
            (n: NotificationData) => !n.isRead
          ).length;
          setUnreadCount(unread);
          // Set notifications for later use when dropdown opens
          setNotifications(response.data.data);
        } else {
          setUnreadCount(0);
          setNotifications([]);
        }
      } catch (err) {
        console.error("Error fetching unread notification count:", err);
        setUnreadCount(0);
      }
    };

    loadUnreadCount();

    // Optional: Set up a polling interval to check for new notifications
    const intervalId = setInterval(loadUnreadCount, 60000); // Check every minute

    return () => {
      clearInterval(intervalId);
    };
  }, [userId]);

  useEffect(() => {
    // Khi dropdown mở, cuộn lên đầu danh sách
    if (isOpen && notificationListRef.current) {
      notificationListRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);

    // Refresh notifications when opening the dropdown
    if (!isOpen && userId) {
      refreshNotifications();
    }
  };

  // Separate function to refresh notifications
  const refreshNotifications = async () => {
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
      // Scroll to top when new notifications load
      if (notificationListRef.current) {
        notificationListRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error("Error refreshing notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeeAllClick = () => {
    navigate("/notification");
    setIsOpen(false);
  };

  // Notification type display properties
  const getNotificationDisplayProps = (type: NotificationContentType) => {
    switch (type) {
      case NotificationContentType.COMPLETE:
        return { styleClass: "accepted", defaultTitle: "Order Accepted" };
      case NotificationContentType.TO_RECEIVE:
        return { styleClass: "shipped", defaultTitle: "Order Shipped" };
      case NotificationContentType.CANCEL_BYUSER:
      case NotificationContentType.CANCEL_BYSHOP:
        return { styleClass: "canceled", defaultTitle: "Order Cancelled" };
      case NotificationContentType.PRODUCT_RATED:
        return { styleClass: "rated", defaultTitle: "Product Rated" };
      default:
        return { styleClass: "default", defaultTitle: "Notification" };
    }
  };

  // Mark notification as read and update state
  const handleMarkAsRead = async (notificationId: number) => {
    if (!userId || isMarkingAsRead) return;

    try {
      setIsMarkingAsRead(true);
      // Call the API to mark notification as read
      await markNotificationAsRead(notificationId);

      // Update local state to reflect the read status
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  // Format notification time display
  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    // If notification is from today, show only time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If notification is from yesterday, show "Yesterday" and time
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show date and time
    return (
      date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  // Function to format notification message (without the "Đơn hàng #..." text)
  const formatNotificationMessage = (notification: NotificationData) => {
    // Remove any "Đơn hàng #XX" text from the message
    const message = notification.message || "";
    return message.replace(/Đơn hàng\s+#\d+\s+/gi, "");
  };

  return (
    <div className="notification-container-cpn" ref={dropdownRef}>
      <div className="header-right-notification" onClick={toggleDropdown}>
        <img src={IconNotification} alt="icon-notification" className="ic_16" />
        {unreadCount > 0 && (
          <span className="quantity">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <>
          <div className="notification-arrow">
            <img src={Iconpolygon} alt="Iconpolygon" className="ic_24 arrow" />
          </div>
          <div className="notification-dropdown">
            <div className="notification-header-top">
              <h3 className="notification-title">Notifications</h3>
            </div>
            <div
              className={`notification-list-cpn ${
                notifications.length <= 3 ? "few-items" : ""
              }`}
              ref={notificationListRef}
            >
              {isLoading && (
                <div className="notification-item-loadding">
                  <div className="notification-icon-load"></div>
                  <div className="list-loadding">
                    <div className="loadding-item1"></div>
                    <div className="loadding-item2"></div>
                  </div>
                </div>
              )}
              {!isLoading && error && (
                <div className="notification-item-cpn error-text">{error}</div>
              )}
              {!isLoading && !error && notifications.length === 0 && (
                <div className="notification-item-cpn no-notifications-dropdown">
                  No new notifications.
                </div>
              )}
              {!isLoading &&
                !error &&
                notifications.map((notification) => {
                  const displayProps = getNotificationDisplayProps(
                    notification.type
                  );
                  const itemImage =
                    notification.imageUrl ||
                    notification.relatedProduct?.img ||
                    ImgSP;
                  const itemTitle =
                    notification.relatedProduct?.name ||
                    notification.relatedShop?.name ||
                    displayProps.defaultTitle;
                  const formattedMessage =
                    formatNotificationMessage(notification);
                  return (
                    <div
                      key={notification.id}
                      className={`notification-item-cpn ${
                        displayProps.styleClass
                      } ${
                        notification.isRead
                          ? "read-dropdown"
                          : "unread-dropdown"
                      }`}
                      onClick={() => handleRedirectNotification(notification)}
                    >
                      {!notification.isRead && (
                        <div className="unread-indicator"></div>
                      )}
                      <div className="notification-icon">
                        <img
                          src={itemImage}
                          alt="icon"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ImgSP;
                          }}
                        />
                      </div>
                      <div className="notification-content">
                        <div className="notification-text-cpn">
                          {itemTitle && (
                            <span className="store-name-cpn">{itemTitle}</span>
                          )}{" "}
                          {formattedMessage}
                        </div>
                        <span className="notification-time-dropdown">
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

export default NotificationDropdown;
