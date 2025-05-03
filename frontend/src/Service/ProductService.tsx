import axios from "./axios";

const API_URL = "/api";

export const getTopSellingProducts = async (limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/products/most-sold/${limit}`);
    console.log("Raw API response:", response);
    return response;
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    throw error;
  }
};

export const getAllProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`);
    console.log("All products data:", response);
    return response;
  } catch (error) {
    console.error("Error fetching all products:", error);
    throw error;
  }
};

export const getAllCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/categories`);
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const addToCart = async (
  productId: number,
  quantity: number,
  userId?: number,
  cartId?: number
) => {
  try {
    // Create the appropriate request body based on the backend's expected structure
    const addToCartDto = {
      productId,
      quantity,
      // Only include userId if it exists and is valid
      ...(userId ? { userId } : {}),
      // Only include cartId if it exists (might be stored in localStorage)
      ...(cartId ? { cartId } : {}),
    };

    console.log("Sending to cart API:", addToCartDto);

    // Make sure to use the full API path
    const response = await axios.post(`/api/cart-items`, addToCartDto);

    console.log("Cart updated successfully:", response);
    return response.data;
  } catch (error) {
    console.error("Error updating cart:", error);
    throw error;
  }
};

export const getCartItems = async (cartId: number) => {
  try {
    const response = await axios.get(`${API_URL}/cart-items/cart/${cartId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    throw error;
  }
};

export const addProduct = async (data: any) => {
  try {
    const response = await axios.post(`${API_URL}/products`, data);
    return response;
  } catch (error) {
    console.error("Error add product:", error);
    throw error;
  }
};

export const editProduct = async (data: any, id: any) => {
  try {
    const response = await axios.put(`${API_URL}/products/${id}`, data);
    return response;
  } catch (error) {
    console.error("Error add product:", error);
    throw error;
  }
};
