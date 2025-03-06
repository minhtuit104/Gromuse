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

instance.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    let res: any = {};
    if (error.response) {
      res.data = error.response.data;
      res.status = error.response.status;
      res.headers = error.response.headers;
      console.error("Error Response:", res.data);
    } else if (error.request) {
      console.log("No Response", error.request);
    } else {
      console.log("Error", error.message);
    }

    return res;
  }
);

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error.response || error);
  }
);

export default instance;
