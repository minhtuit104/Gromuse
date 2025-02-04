import axios from "axios";

const getToken = () => {
  return localStorage.getItem("token");
};

const instance = axios.create({
    baseURL: 'http://localhost:3000',
});

//hàm giúp để thêm token vào mọi request
instance.interceptors.request.use(
  function(config){
    const token = getToken();
    if (!config.headers) {
      config.headers = {};
    }
    if(token){
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }, function(error){
    return Promise.reject(error);
  }
);

//hàm để xử lý mọi reponse
instance.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data;
  }, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error

    let res: any = {}; 
    if (error.response) {
      res.data = error.response.data;
      res.status = error.response.status;
      res.headers = error.response.headers;
      console.error('Error Response:', res.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log("No Response",error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

    return res;
    // return Promise.reject(error);
  });

export default instance;