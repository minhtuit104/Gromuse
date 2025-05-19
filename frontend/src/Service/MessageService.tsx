import axios from "./axios";

const API_URL = "/api";

const getMessageWithUser = async (
  userId1: number,
  userId2: number,
  page: number = 1,
  pageSize: number = 10
) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token is missing");
  }
  try {
    const response = await axios.get(
      `/api/v1/messagers/${userId1}/${userId2}?page=${page}&pageSize=${pageSize} `,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.log("Error fetching messages:", error);
    throw error;
  }
};

export const getAllMessages = async () => {
  try {
    const response = await axios.get(`${API_URL}/v1/messagers/conversations`);
    console.log("All messages data:", response);
    return response;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
};

export const fetchUserConversationsCount = async (): Promise<number> => {
  try {
    // apiResponse sẽ có dạng: { statusCode: number, message: string, data: number (count) }
    // do interceptor của axios đã trả về response.data
    const responseData = (await axios.get(
      `/api/v1/messagers/conversations/count`
    )) as { statusCode: number; message: string; data: any };
    console.log(
      "[MessageService] Response from /conversations/count:",
      responseData
    );

    if (
      responseData &&
      responseData.statusCode === 200 &&
      typeof responseData.data === "number"
    ) {
      console.log(
        "[MessageService] Successfully fetched conversation count:",
        responseData.data
      );
      return responseData.data; // Trả về số lượng cuộc trò chuyện
    }
    // Log chi tiết hơn nếu phản hồi không như mong đợi
    console.warn(
      "[MessageService] Unexpected response format or status for conversation count. Status:",
      responseData?.statusCode,
      "Data type:",
      typeof responseData?.data,
      "Response:",
      responseData
    );
    return 0; // Trả về 0 nếu định dạng không đúng hoặc status không phải 200
  } catch (error: any) {
    // Log lỗi chi tiết hơn, bao gồm cả status và data từ error.response nếu có
    console.error(
      "[MessageService] Error fetching user conversations count. Full error object:",
      error
    );
    if (error.response) {
      console.error(
        "[MessageService] Error response data:",
        error.response.data
      );
      console.error(
        "[MessageService] Error response status:",
        error.response.status
      );
    }
    return 0; // Trả về 0 khi có lỗi để tránh NaN
  }
};

export { getMessageWithUser };
