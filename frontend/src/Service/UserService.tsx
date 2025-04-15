import axios from "./axios";

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
  password: string
) => {
  return axios.post("/api/v1/auth/register", {
    name,
    email,
    phoneNumber,
    password,
  });
};

const registerApiShop = async (
  name: string,
  email: string,
  phoneNumber: string,
  password: string,
  address: string
) => {
  const requestData = {
    name,
    email,
    phoneNumber,
    password,
    address,
    role: 2,
  };

  console.log("Sending request data:", requestData);

  try {
    const response = await axios.post("/api/v1/auth/register", requestData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Response from server:", response);
    return response;
  } catch (error:any) {
    console.error("Registration error:", error.response?.data || error);
    throw error;
  }
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
    console.log("API response update profile ===", response);
    return response;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
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
