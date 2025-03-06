import axios from "./axios";

// Fetch danh sách sản phẩm
const fetchProducts = async () => {
  try {
    const products = await axios.get("/api/products");
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (productId: string, quantity: number = 1) => {
  try {
    const response = await axios.post("/api/cart/add", { productId, quantity });
    return response;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

const loginApi = (identifier: string, password: string) => {
  return axios.post("/api/v1/auth/login", { identifier, password });
};

const registerApi = (
  name: string,
  email: string,
  phoneNumber: string,
  password: string
) => {
  return axios.post("/api/v1/auth/register", {
    name,
    email,
    phoneNumber,
    password,
  });
};

const fectchUserName = async (idUser: number) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token is missing");
    return;
  }
  try {
    const response = await axios.get(`/api/v1/users/${idUser}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

const fetchAllUser = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token is missing");
    return;
  }
  try {
    return await axios.get("/api/v1/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

const updateAvatar = async (imageUrl: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Token is missing");
  }
  try {
    const response = await axios.put(
      `/api/v1/users/update-avatar`,
      { imageUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
};

const updateUserProfile = async (updateData: {
  name: string;
  email: string;
  birthday: string;
}) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token is missing");
    }
    const response = await axios.put(
      "/api/v1/users/update-profile",
      updateData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("API response ===", response);
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export {
  loginApi,
  registerApi,
  fectchUserName,
  fetchAllUser,
  updateAvatar,
  updateUserProfile,
  fetchProducts,
  addToCart,
};
