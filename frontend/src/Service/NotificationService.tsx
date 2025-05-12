import axios from "./axios";

const fetchNotificationsByIdUser = async (
  idUser: number,
  page: number = 1,
  pageSize: number = 10
) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token is missing");
    return;
  }

  try {
    // Gọi API với token trong header Authorization
    const response = await axios.get(
      `/api/v1/notifications/${idUser}?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    return await axios.patch(
      `/api/v1/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Thêm hàm để đánh dấu tất cả thông báo đã đọc
export const markAllNotificationsAsRead = async (userId: number) => {
  try {
    return await axios.put(
      `/api/v1/notifications/mark-all-as-read/${userId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

export default fetchNotificationsByIdUser;
