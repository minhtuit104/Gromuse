import { useNavigate } from "react-router-dom";
import { NotificationContentType, NotificationData } from "./Notification";
import { markNotificationAsRead } from "../../Service/NotificationService";

const useNotification = () => {
  const navigate = useNavigate();
  const handleRedirectNotification = (notification: NotificationData) => {
    const userRole = localStorage.getItem("userRole");
    markNotificationAsRead(notification.id);
    if (userRole === "shop") {
      switch (notification.type) {
        case NotificationContentType.TO_ORDER:
          return navigate("/order_shop");
        case NotificationContentType.COMPLETE:
          return navigate("/order_history");
        case NotificationContentType.CANCEL_BYSHOP:
        case NotificationContentType.CANCEL_BYUSER:
          return navigate("/order_cancel");
        case NotificationContentType.PRODUCT_RATED:
          return navigate("/product/" + notification.relatedProductId);
      }
    } else {
      switch (notification.type) {
        case NotificationContentType.TO_ORDER:
          return navigate("/order_status", {
            state: {
              targetTab: "toOrder",
              orderIdToFocus: notification.relatedCartItemId,
            },
          });
        case NotificationContentType.COMPLETE:
          return navigate("/order_status", {
            state: {
              targetTab: "completed",
              orderIdToFocus: notification.relatedCartItemId,
            },
          });
        case NotificationContentType.TO_RECEIVE:
          return navigate("/order_status", {
            state: {
              targetTab: "toReceive",
              orderIdToFocus: notification.relatedCartItemId,
            },
          });
        case NotificationContentType.CANCEL_BYSHOP:
        case NotificationContentType.CANCEL_BYUSER:
          return navigate("/order_status", {
            state: {
              targetTab: "cancelled",
              orderIdToFocus: notification.relatedCartItemId,
            },
          });
      }
    }
  };
  return { handleRedirectNotification };
};

export default useNotification;
