import { RegisterFormValues } from "../pages/LoginShop/loginShop";
import axios from "./axios";
import { AxiosError } from "axios";

const loginApi = async (identifier: string, password: string) => {
  const res = await axios.post("/api/v1/auth/login", {
    identifier,
    password,
  });
  console.log("resspon API:===", res);
  return res;
};

const registerApi = (
  name: string,
  email: string,
  phoneNumber: string,
  password: string,
  address: string
) => {
  return axios.post("/api/v1/auth/register", {
    name,
    email,
    phoneNumber,
    password,
    address,
    role: 1,
  });
};

const registerApiShop = async (data: RegisterFormValues) => {
  console.log("Data being sent to API:", data);
  const res = await axios.post("/api/v1/auth/register", data);
  console.log("API dang ki: ", res);
  return res;
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
  name?: string;
  email?: string;
  birthday?: string;
  phoneNumber?: string;
  address?: string;
}): Promise<any> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication required. Please log in.");
  }

  try {
    console.log("Sending update profile request with data:", updateData);
    const response = await axios.put(
      "/api/v1/users/update-profile",
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Update profile response========:", response.data);
    if (response.data?.status === "success") {
      const cachedUserData = localStorage.getItem("userData");
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          const updatedUserData = { ...userData, ...updateData };
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
        } catch (e) {
          console.warn("Failed to update cached user data", e);
        }
      }
    }

    return response;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Error updating user profile:", error);
      console.error("Error response data:", error.response?.data);
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

export const fetchAllCustomers = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("[fetchAllCustomers] Token is missing");
    return { status: "error", message: "Token is missing", data: [] };
  }
  try {
    const response = await axios.get(`/api/v1/users/customers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response || !response.data) {
      console.error("[fetchAllCustomers] Invalid response format:", response);
      return { status: "error", message: "Invalid response format", data: [] };
    }

    if (
      response.data.status === "success" &&
      Array.isArray(response.data.data)
    ) {
      console.log(
        "[fetchAllCustomers] Successfully fetched customers using standard format"
      );
      return response.data;
    } else if (Array.isArray(response.data)) {
      console.log("[fetchAllCustomers] API returned direct array of customers");
      return {
        status: "success",
        message: "customers retrieved successfully",
        data: response.data,
      };
    } else if (response.data.data && Array.isArray(response.data.data)) {
      console.log(
        "[fetchAllCustomers] API returned data array without status field"
      );
      return {
        status: "success",
        message: "customers retrieved successfully",
        data: response.data.data,
      };
    } else {
      console.error(
        "[fetchAllCustomers] Unexpected API response format:",
        response.data
      );
      return {
        status: "success",
        message: "No customers found or format mismatch",
        data: [],
      };
    }
  } catch (error: any) {
    console.error("[fetchAllCustomers] Error fetching customers:", error);

    if (error.response) {
      console.error("[fetchAllCustomers] Server responded with error:", {
        status: error.response.status,
        data: error.response.data,
      });
      return {
        status: "error",
        message: `Server error: ${error.response.status}`,
        data: [],
      };
    } else if (error.request) {
      console.error("[fetchAllCustomers] No response received from server");
      return {
        status: "error",
        message: "No response received from server",
        data: [],
      };
    } else {
      console.error(
        "[fetchAllCustomers] Request configuration error:",
        error.message
      );
      return {
        status: "error",
        message: `Request failed: ${error.message}`,
        data: [],
      };
    }
  }
};

export const fetchAllShops = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("[fetchAllShops] Token is missing");
    return { status: "error", message: "Token is missing", data: [] };
  }
  try {
    const response = await axios.get(`/api/v1/users/shops`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response || !response.data) {
      console.error("[fetchAllShops] Invalid response format:", response);
      return { status: "error", message: "Invalid response format", data: [] };
    }

    if (
      response.data.status === "success" &&
      Array.isArray(response.data.data)
    ) {
      console.log(
        "[fetchAllShops] Successfully fetched shops using standard format"
      );
      return response.data;
    } else if (Array.isArray(response.data)) {
      console.log("[fetchAllShops] API returned direct array of shops");
      return {
        status: "success",
        message: "Shops retrieved successfully",
        data: response.data,
      };
    } else if (response.data.data && Array.isArray(response.data.data)) {
      console.log(
        "[fetchAllShops] API returned data array without status field"
      );
      return {
        status: "success",
        message: "Shops retrieved successfully",
        data: response.data.data,
      };
    } else {
      console.error(
        "[fetchAllShops] Unexpected API response format:",
        response.data
      );
      return {
        status: "success",
        message: "No shops found or format mismatch",
        data: [],
      };
    }
  } catch (error: any) {
    console.error("[fetchAllShops] Error fetching shops:", error);

    if (error.response) {
      console.error("[fetchAllShops] Server responded with error:", {
        status: error.response.status,
        data: error.response.data,
      });
      return {
        status: "error",
        message: `Server error: ${error.response.status}`,
        data: [],
      };
    } else if (error.request) {
      console.error("[fetchAllShops] No response received from server");
      return {
        status: "error",
        message: "No response received from server",
        data: [],
      };
    } else {
      console.error(
        "[fetchAllShops] Request configuration error:",
        error.message
      );
      return {
        status: "error",
        message: `Request failed: ${error.message}`,
        data: [],
      };
    }
  }
};

export {
  loginApi,
  registerApi,
  registerApiShop,
  fectchUserName,
  fetchAllUser,
  updateAvatar,
  updateUserProfile,
};
