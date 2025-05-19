import { useNavigate } from "react-router-dom";
import { NotificationContentType, NotificationData } from "./NotificationShop";
import { markNotificationAsRead } from "../../Service/NotificationService";

const useShopNotificationHandler = () => {
  const navigate = useNavigate();

  const handleRedirectNotification = (notification: NotificationData) => {
    markNotificationAsRead(notification.id).catch((err) => {
      console.error(
        `Failed to mark notification ${notification.id} as read:`,
        err
      );
    });
    const userRole = localStorage.getItem("userRole");
    if (userRole === "shop") {
      switch (notification.type) {
        case NotificationContentType.TO_ORDER:
          navigate("/order_shop");
          break;
        case NotificationContentType.COMPLETE:
          navigate("/order_history");
          break;
        case NotificationContentType.CANCEL_BYSHOP:
        case NotificationContentType.CANCEL_BYUSER:
          navigate("/order_cancel");
          break;
        case NotificationContentType.PRODUCT_RATED:
          if (notification.relatedProductId) {
            navigate(`/product/${notification.relatedProductId}`);
          } else {
            console.warn(
              `PRODUCT_RATED notification (id: ${notification.id}) is missing relatedProductId. Navigating to shop dashboard.`
            );
            navigate("/dashboard_shop");
          }
          break;
        default:
          console.warn(
            `Unhandled notification type for shop: ${notification.type} (id: ${notification.id}). Navigating to shop notifications page.`
          );
          navigate("/notification_shop");
      }
    } else {
      console.error(
        `useShopNotificationHandler invoked for non-shop role or missing role. Role: '${userRole}', Notification ID: ${notification.id}. Redirecting to login.`
      );
      navigate("/login");
    }
  };

  return { handleRedirectNotification };
};

export default useShopNotificationHandler;
