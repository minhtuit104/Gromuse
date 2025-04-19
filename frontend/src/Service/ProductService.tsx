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
