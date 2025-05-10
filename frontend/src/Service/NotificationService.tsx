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
    // return response.data.map((notification: any) => ({
    //     id: notification.id,
    //     message: notification.message,
    //     updatedAt: notification.updatedAt,
    //     sender: {
    //         avarta: notification.sender.avarta,
    //         name: notification.sender.name
    //     },
    //     post: notification.post ? {
    //         idPost: notification.post.idPost,
    //         title: notification.post.title,
    //         privacy: notification.post.privacy,
    //         createAt: notification.post.createAt || new Date().toISOString(),
    //         image: notification.post.image
    //     } : null
    // }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error; // Ném lỗi để xử lý sau này
  }
};

export default fetchNotificationsByIdUser;
