import axios from "axios";

const getToken = () => {
  return localStorage.getItem("token");
};

const instance = axios.create({
  baseURL: "http://localhost:3000",
});

//hàm giúp để thêm token vào mọi request
instance.interceptors.request.use(
  function (config) {
    const token = getToken();
    if (!config.headers) {
      config.headers = new axios.AxiosHeaders();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// // Xử lý response - chỉ giữ lại một interceptor
instance.interceptors.response.use(
  function (response) {
    // Trả về trực tiếp data từ response
    return response.data;
  },
  function (error) {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default instance;
