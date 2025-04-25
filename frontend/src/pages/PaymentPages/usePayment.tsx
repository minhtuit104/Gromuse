import { useState, useEffect, useCallback, useRef } from "react";
import { Shop } from "./paymentItem";
import { jwtDecode } from "jwt-decode";
import { fectchUserName } from "../../Service/UserService";
import { AddressDto } from "../../dtos/address.dto";
import DefaultAvatar from "../../assets/images/imagePNG/Avatar.png";
import Img1 from "../../assets/images/imagePNG/lays_1 1.png";
import { confirmPaymentAndUpdateBackend } from "../../Service/OrderService";

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}

export interface Voucher {
  id: string | number;
  type: string;
  code: string;
  description: string;
  remaining: number;
}

export interface Product {
  id: string;
  name: string;
  img: string;
  title: string;
  weight: number;
  price: number;
  quantity: number;
  created_at: string;
  isPaid: boolean;
}

const usePayment = () => {
  const [data, setData] = useState<Shop[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const [userAddress, setUserAddress] = useState<AddressDto | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  //HÀM LẤY idUser TỪ TOKEN ***
  const getUserIdFromToken = useCallback((): number | null => {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage
    if (!token) {
      console.error("[usePayment] Token not found in localStorage.");
      return null; // Trả về null nếu không có token
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token); // Giải mã token
      const currentTime = Date.now() / 1000; // Thời gian hiện tại (giây)

      // Kiểm tra token hết hạn
      if (decoded.exp < currentTime) {
        console.error("[usePayment] Token expired.");
        localStorage.removeItem("token");
        localStorage.removeItem("currentCartId");
        localStorage.removeItem("buyNowCartId");
        return null;
      }

      // Kiểm tra idUser hợp lệ
      if (typeof decoded.idUser !== "number") {
        console.error("[usePayment] Invalid idUser in token payload.");
        localStorage.removeItem("token"); // Xóa token lỗi
        return null;
      }
      return decoded.idUser; // Trả về idUser
    } catch (error) {
      console.error("[usePayment] Error decoding token:", error);
      localStorage.removeItem("token"); // Xóa token lỗi
      return null;
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      setUserError("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
      setUserLoading(false);
      setUserAddress(null);
      return;
    }

    setUserLoading(true);
    setUserError(null);
    try {
      const userDataResponse = await fectchUserName(userId);
      console.log("[usePayment] User data fetched:", userDataResponse);

      if (
        userDataResponse &&
        typeof userDataResponse === "object" &&
        userDataResponse.idUser
      ) {
        const user = userDataResponse;
        setUserAddress({
          name: user.name || "Chưa cập nhật",
          phone: user.phoneNumber || "Chưa cập nhật",
          address: user.address || "Chưa cập nhật",
        });
      } else {
        throw new Error(
          "Dữ liệu người dùng trả về không hợp lệ hoặc không tìm thấy."
        );
      }
    } catch (error) {
      console.error("[usePayment] Error fetching user data:", error);
      setUserError(
        error instanceof Error
          ? `Lỗi tải thông tin người dùng: ${error.message}`
          : "Lỗi không xác định khi tải thông tin người dùng."
      );
      setUserAddress(null);
    } finally {
      setUserLoading(false);
    }
  }, [getUserIdFromToken]);

  const fetchCartData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setData([]);

    const buyNowCartItemIdStr = localStorage.getItem("buyNowCartItemId");
    const buyNowCartItemId = buyNowCartItemIdStr
      ? parseInt(buyNowCartItemIdStr, 10)
      : null;
    // Xóa ngay sau khi đọc
    if (buyNowCartItemIdStr) {
      localStorage.removeItem("buyNowCartItemId");
      console.log(
        `[usePayment] Detected Buy Now flow for cartItemId: ${buyNowCartItemId}`
      );
    }

    // Luôn lấy cartId hiện tại của user
    const cartIdToFetch = localStorage.getItem("currentCartId");

    console.log(`[usePayment] Fetching cart data for cartId: ${cartIdToFetch}`);

    if (!cartIdToFetch) {
      console.log("[usePayment] No valid currentCartId found.");
      setData([]);
      setLoading(false);
      return;
    }

    // Lưu lại cartId đang dùng cho thanh toán
    localStorage.setItem("cartId", cartIdToFetch);

    try {
      const response = await fetch(
        `http://localhost:3000/cart-items/cart/${cartIdToFetch}`
      );
      if (!response.ok) {
        if (response.status === 404) setError("Không tìm thấy giỏ hàng.");
        else setError(`Lỗi API lấy giỏ hàng: ${response.status}`);
        throw new Error(`API thất bại: ${response.status}`);
      }

      const cartData = await response.json();

      if (!Array.isArray(cartData) || cartData.length === 0) {
        setData([]);
        console.log("[usePayment] Cart is empty or has no items.");
      } else {
        let itemsToDisplay = cartData;

        if (buyNowCartItemId !== null) {
          itemsToDisplay = cartData.filter(
            (item) => item?.id === buyNowCartItemId
          ); // Lọc theo CartItem ID
          if (itemsToDisplay.length === 0) {
            console.warn(
              `[usePayment] Buy Now item (cartItemId: ${buyNowCartItemId}) not found in fetched cart data. Displaying empty.`
            );
          } else {
            console.log(
              `[usePayment] Filtering cart data for Buy Now item: cartItemId ${buyNowCartItemId}`
            );
          }
        }

        // Xử lý itemsToDisplay (đã được lọc hoặc là toàn bộ giỏ hàng)
        const shopsMap: Record<string, Shop> = {};
        itemsToDisplay.forEach((item: any) => {
          if (!item || !item.product || !item.product.id) {
            console.warn("[usePayment] Skipping invalid CartItem:", item);
            return;
          }
          const shopInfo = item.product.shop || {};
          const shopId = shopInfo.id?.toString() || "1";
          const shopName = shopInfo.name || "Lay's Viet Nam";
          const shopAvatar = shopInfo.avatar || DefaultAvatar;

          if (!shopsMap[shopId]) {
            shopsMap[shopId] = {
              id: shopId,
              avatar: shopAvatar,
              name: shopName,
              deliveryInfo: "Fast Delivery",
              productIcons: true,
              products: [],
            };
          }

          const productData = item.product;
          shopsMap[shopId].products.push({
            id: item.id.toString(), // <<< SỬA: Sử dụng CartItem ID làm ID duy nhất trong list thanh toán
            name: productData.name || "Sản phẩm",
            img: productData.img || Img1,
            title: productData.name || "Sản phẩm",
            weight: Number(productData.weight) || 0,
            price: Number(productData.price) || 0,
            quantity: Number(item.quantity) || 1,
            isPaid: !!item.isPaid,
            created_at: productData.createdAt || new Date().toISOString(),
          });
        });

        const shopsArray = Object.values(shopsMap);
        setData(shopsArray);
        setError(null);
      }
    } catch (error: any) {
      console.error("[usePayment] Error in fetchCartData:", error);
      if (!error.message?.includes("API thất bại")) {
        setError(
          error instanceof Error
            ? error.message
            : "Không thể lấy dữ liệu giỏ hàng."
        );
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartData();
    fetchUserData();

    const fetchVouchers = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/payment/vouchers/available"
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedVouchers: Voucher[] = data.map((voucher: any) => ({
          id: voucher.id,
          type: voucher.type,
          code: voucher.code,
          description: voucher.description,
          remaining: voucher.remaining,
        }));
        setVouchers(formattedVouchers);
      } catch (error) {
        console.error("[usePayment] Detailed error fetching vouchers:", error);
      }
    };
    fetchVouchers();

    // Logic kiểm tra cartUpdated (giữ nguyên)
    const cartUpdated = localStorage.getItem("cartUpdated");
    if (cartUpdated === "true") {
      console.log(
        "[usePayment] Cart updated detected, refreshing cart data..."
      );
      localStorage.removeItem("cartUpdated");
      fetchCartData(); // Gọi lại fetchCartData
    }
  }, [fetchCartData, fetchUserData]);

  const updateProductQuantity = useCallback(
    async (cartItemId: string, newQuantity: number) => {
      cancelOngoingRequest();
      if (!navigator.onLine) {
        console.error("[usePayment] No network connection.");
        return false;
      }

      fetchControllerRef.current = new AbortController();
      const controller = fetchControllerRef.current;
      const timeoutId = setTimeout(() => {
        console.warn("[usePayment] Update quantity request timed out.");
        controller.abort();
      }, 5000);

      try {
        const endpoint = `http://localhost:3000/cart-items/${cartItemId}`;
        const response = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[usePayment] API error updating quantity (${response.status}):`,
            errorText
          );
          return false;
        }
        const result = await response.json();
        console.log(
          `[usePayment] Quantity updated successfully for cartItemId ${cartItemId}. Response:`,
          result
        );
        if (result && result.message === "Item removed successfully") {
          console.log(`[usePayment] CartItem ${cartItemId} removed.`);
        }
        fetchCartData(); // Fetch lại để cập nhật UI
        return true;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError")
          console.log("[usePayment] Update quantity request was aborted.");
        else
          console.error("[usePayment] Fetch error updating quantity:", error);
        return false;
      } finally {
        if (fetchControllerRef.current === controller)
          fetchControllerRef.current = null;
      }
    },
    [fetchCartData]
  );

  const cancelOngoingRequest = () => {
    if (fetchControllerRef.current) {
      console.log("[usePayment] Cancelling ongoing request...");
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }
  };

  // Cleanup effect để hủy request khi component unmount
  useEffect(() => {
    return () => {
      cancelOngoingRequest();
    };
  }, []);

  const handleSuccessfulPayment = async (
    cartId: number,
    paidCartItemIds: number[]
  ): Promise<boolean> => {
    // Gọi hàm confirmPaymentAndUpdateBackend từ OrderService
    const success = await confirmPaymentAndUpdateBackend(
      cartId,
      paidCartItemIds
    );
    // Không cần gọi synchronizeOrdersWithBackend ở đây nữa, có thể gọi ở component cha nếu cần
    return success; // Trả về true/false
  };
  return {
    data,
    setData,
    vouchers,
    error,
    loading,
    userAddress,
    userLoading,
    userError,
    handleUpdatePrice: updateProductQuantity,
    refetchCart: fetchCartData,
    refetchUser: fetchUserData,
    handleSuccessfulPayment,
  };
};

export default usePayment;
