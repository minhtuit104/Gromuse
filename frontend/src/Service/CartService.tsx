import axios from "./axios";

const API_URL = "/api";

export const getAllCartItemInCart = async () => {
  try {
    const response = await axios.get(`${API_URL}/cart-items/cart`);
    console.log("All products data:", response);
    return response;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
};

export const getCartCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/cart-items/count`);
    console.log("All products data:", response);
    return response;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
};


