import { useState, useRef, useEffect, useCallback } from "react";
import "./NotificationDashboard.css";
import ImgSP from "../../../assets/images/imagePNG/lays_4.png";
import Iconpolygon from "../../../assets/images/icons/ic_polygon.svg";
import IconNotifi from "../../../assets/images/icons/ic_notification.svg";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import fetchNotificationsByIdUser, {
  markNotificationAsRead,
} from "../../../Service/NotificationService"; // Import service
import { NotificationContentType } from "../../../pages/Notification/Notification"; // Import enum

interface DecodedToken {
  idUser: number;
  role?: number; // Giả sử role có trong token để xác định ngữ cảnh shop
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
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const notificationListRef = useRef<HTMLDivElement>(null);

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
      case NotificationContentType.NEW_ORDER_FOR_SHOP:
        return { styleClass: "new-order" };
      case NotificationContentType.ORDER_CANCELLED_BY_USER:
        return { styleClass: "canceled" };
      case NotificationContentType.PRODUCT_RATED:
        return { styleClass: "rated" };
      case NotificationContentType.NEW_MESSAGE:
        return { styleClass: "message" };
      default:
        return { styleClass: "default" };
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    if (!userId || isMarkingAsRead) return;
    setIsMarkingAsRead(true);
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark dashboard notification as read:", error);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const handleNotificationItemClick = async (
    notification: NotificationData
  ) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    let targetTab = "";
    // Ưu tiên relatedCartItemId, sau đó mới parse từ redirectUrl nếu cần
    const orderIdToFocus =
      notification.relatedCartItemId ||
      (notification.redirectUrl
        ? parseInt(notification.redirectUrl.split("/").pop() || "0", 10)
        : 0);

    switch (notification.type) {
      case NotificationContentType.NEW_ORDER_FOR_SHOP:
        targetTab = "toOrder"; // Tab "Chờ xác nhận" hoặc tương tự trong trang quản lý đơn hàng của shop
        navigate("/order_shop", { state: { targetTab, orderIdToFocus } }); // Điều hướng đến trang quản lý đơn hàng của shop
        break;
      case NotificationContentType.ORDER_CANCELLED_BY_USER:
        targetTab = "cancelled"; // Tab "Đã hủy" trong trang quản lý đơn hàng của shop
        navigate("/order_shop", { state: { targetTab, orderIdToFocus } });
        break;
      case NotificationContentType.PRODUCT_RATED:
        // Điều hướng đến trang chi tiết sản phẩm hoặc trang quản lý đánh giá
        if (notification.relatedProductId) {
          navigate(`/product/${notification.relatedProductId}`);
        } else {
          navigate("/dashboard"); // Hoặc một trang mặc định khác
        }
        break;
      case NotificationContentType.NEW_MESSAGE:
        navigate(notification.redirectUrl || "/messager_shop"); // Điều hướng đến trang tin nhắn của shop
        break;
      default:
        if (notification.redirectUrl) {
          navigate(notification.redirectUrl);
        } else {
          navigate("/dashboard"); // Trang mặc định
        }
        break;
    }
    setIsOpen(false); // Đóng dropdown sau khi click
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    // Hiển thị HH:MM
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Hàm này có thể không cần thiết nếu backend message đã đủ rõ ràng
  const formatNotificationMessage = (notification: NotificationData) => {
    const message = notification.message || "";
    // Loại bỏ "Đơn hàng #..." nếu có, vì thông tin này có thể đã được xử lý ở actionText
    return message.replace(/Đơn hàng\s*#\d+\s*/gi, "").trim();
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

                  // Xác định tên người thực hiện và hình ảnh
                  let actorName: string | undefined = "Một người dùng"; // Mặc định
                  let actorImage: string | undefined = ImgSP; // Ảnh mặc định
                  let actionText: string =
                    notification.message || "Thông báo mới"; // Nội dung hành động

                  // Xử lý dựa trên loại thông báo
                  if (
                    notification.type ===
                      NotificationContentType.NEW_ORDER_FOR_SHOP ||
                    notification.type ===
                      NotificationContentType.ORDER_CANCELLED_BY_USER ||
                    notification.type === NotificationContentType.PRODUCT_RATED
                  ) {
                    // Các thông báo này liên quan đến khách hàng (relatedUser)
                    actorName = notification.relatedUser?.name || actorName;
                    actorImage =
                      notification.relatedUser?.avarta || // Ảnh đại diện của khách hàng
                      notification.imageUrl || // Ảnh từ thông báo (có thể là ảnh sản phẩm)
                      notification.relatedProduct?.img || // Ảnh sản phẩm liên quan
                      ImgSP;

                    // Tạo actionText cụ thể hơn
                    if (
                      notification.type ===
                      NotificationContentType.NEW_ORDER_FOR_SHOP
                    ) {
                      // Backend message nên là: "đã đặt một đơn hàng mới với X sản phẩm."
                      // Nếu backend message đã có tên user, thì actionText chỉ cần phần còn lại.
                      // Ví dụ: nếu message là "Dương Văn Tuyến đã đặt một đơn hàng mới."
                      // thì actorName là "Dương Văn Tuyến", actionText là "đã đặt một đơn hàng mới."
                      actionText =
                        notification.message || "đã đặt một đơn hàng mới.";
                    } else if (
                      notification.type ===
                      NotificationContentType.ORDER_CANCELLED_BY_USER
                    ) {
                      actionText = `đã hủy đơn hàng #${
                        notification.relatedCartItemId || "N/A"
                      }. ${notification.message || ""}`; // Thêm lý do hủy nếu có
                    } else if (
                      notification.type ===
                      NotificationContentType.PRODUCT_RATED
                    ) {
                      actionText = `đã đánh giá sản phẩm ${
                        notification.relatedProduct?.name || "của bạn"
                      }. ${notification.message || ""}`; // Thêm bình luận nếu có
                    }
                  } else if (
                    notification.type === NotificationContentType.NEW_MESSAGE
                  ) {
                    // Thông báo tin nhắn mới từ người gửi (sender)
                    actorName = notification.sender?.name || "Ai đó";
                    actorImage = notification.sender?.avarta || ImgSP;
                    actionText = notification.message; // Nội dung tin nhắn
                  } else {
                    // Các loại thông báo khác (ví dụ: từ hệ thống, hoặc liên quan đến shop/sản phẩm chung)
                    actorName =
                      notification.relatedShop?.name || // Tên shop nếu có
                      notification.relatedProduct?.name || // Tên sản phẩm nếu có
                      actorName; // Giữ mặc định nếu không có
                    actorImage =
                      notification.imageUrl ||
                      notification.relatedProduct?.img ||
                      ImgSP;
                    actionText = formatNotificationMessage(notification); // Dùng hàm format chung
                  }

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
                      onClick={() => handleNotificationItemClick(notification)}
                    >
                      {!notification.isRead && (
                        <div className="unread-indicator-dashboard"></div>
                      )}
                      <div className="notification-icon-dashboard">
                        <img
                          src={actorImage}
                          alt="icon"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ImgSP; // Fallback nếu ảnh lỗi
                          }}
                        />
                      </div>
                      <div className="notification-content-dashboard">
                        <div className="notification-text-dashboard">
                          {/* Hiển thị tên người thực hiện */}
                          {actorName && (
                            <span className="store-name-dashboard">
                              {actorName}
                            </span>
                          )}{" "}
                          {/* Hiển thị nội dung hành động */}
                          {actionText}
                        </div>
                        <span className="notification-time-dashboard">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationDashboard;
