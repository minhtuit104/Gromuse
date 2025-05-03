import axios from "./axios";

const API_URL = "/api";

export const addPayment = async (paymentData: any) => {
  try {
    // Đảm bảo paymentData có đúng định dạng cần thiết
    const paymentRequest = {
      paymentMethod: paymentData.paymentMethod,
      subtotal: paymentData.subtotal,
      deliveryFeeOriginal: paymentData.deliveryFeeOriginal,
      deliveryFeeDiscounted: paymentData.deliveryFeeDiscounted,
      couponDiscount: paymentData.couponDiscount,
      total: paymentData.total,
      phone: paymentData.phone,
      address: paymentData.address || "N/A",
      name: paymentData.name,
      voucherCodes: paymentData.voucherCodes || [],
    };

    // Gửi POST request thay vì GET
    const response = await axios.post(`/payment/create`, paymentRequest);
    return response;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};
