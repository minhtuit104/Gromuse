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
// const updateUserProfile = async (updateData: {
//   name?: string;
//   email?: string;
//   birthday?: string;
//   phoneNumber?: string;
//   address?: string;
// }) => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       throw new Error("Token is missing");
//     }
//     console.log("Sending update profile request with data:", updateData);
//     const response = await axios.put(
//       "/api/v1/users/update-profile",
//       updateData,
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );
//     console.log("API response ===", response);
//     return response.data;
//   } catch (error) {
//     console.error("Error updating user profile:", error);
//     throw error;
//   }
// };

export {
  loginApi,
  registerApi,
  registerApiShop,
  fectchUserName,
  fetchAllUser,
  updateAvatar,
  updateUserProfile,
};
