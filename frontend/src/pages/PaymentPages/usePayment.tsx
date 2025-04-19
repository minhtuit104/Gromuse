import { useState, useEffect, useCallback, useRef } from "react";
import { Shop } from "./paymentItem";
import { jwtDecode } from "jwt-decode";
import { fectchUserName } from "../../Service/UserService";
import { AddressDto } from "../../dtos/address.dto";
import DefaultAvatar from "../../assets/images/imagePNG/Avatar.png";
import Img1 from "../../assets/images/imagePNG/lays_1 1.png";

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}
// ------------------------------------------------------

export interface Voucher {
  id: string | number;
  type: string;
  code: string;
  description: string;
  remaining: number;
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
        localStorage.removeItem("token"); // Xóa token hết hạn
        // Xóa các thông tin liên quan khác
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
    const userId = getUserIdFromToken(); // Lấy userId
    if (!userId) {
      setUserError("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
      setUserLoading(false);
      setUserAddress(null); // Đặt địa chỉ về null
      return;
    }

    setUserLoading(true); // Bắt đầu loading user data
    setUserError(null); // Reset lỗi user data
    try {
      const userDataResponse = await fectchUserName(userId);
      console.log("[usePayment] User data fetched:", userDataResponse);

      if (
        userDataResponse &&
        typeof userDataResponse === "object" &&
        userDataResponse.idUser
      ) {
        // Gán trực tiếp userDataResponse vào biến user
        const user = userDataResponse;
        // Cập nhật state userAddress
        setUserAddress({
          name: user.name || "Chưa cập nhật",
          // Sử dụng user.phoneNumber vì đó là tên trường trong entity User và token payload
          phone: user.phoneNumber || "Chưa cập nhật",
          // user.address có thể là null, sẽ được xử lý thành "Chưa cập nhật"
          address: user.address,
        });
      } else {
        // Nếu userDataResponse không tồn tại hoặc không có idUser
        throw new Error(
          "Dữ liệu người dùng trả về không hợp lệ hoặc không tìm thấy."
        );
      }
    } catch (error) {
      // Xử lý lỗi khi fetch user data
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

    // Lấy cartId từ localStorage (ưu tiên buyNow)
    const buyNowCartId = localStorage.getItem("buyNowCartId");
    const currentCartId = localStorage.getItem("currentCartId");
    const cartIdToFetch = buyNowCartId || currentCartId;

    console.log(`[usePayment] Fetching cart data for cartId: ${cartIdToFetch}`);

    if (!cartIdToFetch) {
      // Không cần báo lỗi nếu không có cartId, có thể là trạng thái bình thường
      console.log("[usePayment] No valid cartId found to fetch cart data.");
      setData([]); // Đảm bảo data là mảng rỗng
      setLoading(false); // Kết thúc loading
      return; // Dừng thực thi
    }

    localStorage.setItem("cartId", cartIdToFetch);
    localStorage.setItem("currentCartId", cartIdToFetch);

    try {
      console.log(
        `[usePayment] Chuẩn bị tải giỏ hàng với ID: ${cartIdToFetch}`
      );
      // Gọi API lấy chi tiết giỏ hàng
      const response = await fetch(
        `http://localhost:3000/cart-items/cart/${cartIdToFetch}`
      );

      console.log(
        `[usePayment] Trạng thái phản hồi API giỏ hàng: ${response.status}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          setError("Không tìm thấy giỏ hàng.");
        } else {
          setError(`Lỗi API lấy giỏ hàng: ${response.status}`);
        }
        throw new Error(`API thất bại: ${response.status}`);
      }

      const cartData = await response.json();

      if (!Array.isArray(cartData) || cartData.length === 0) {
        setData([]);
        console.log("[usePayment] Cart is empty or has no items.");
      } else {
        const shopsMap: Record<string, Shop> = {};
        cartData.forEach((item: any) => {
          // Kiểm tra dữ liệu item và product
          if (!item || !item.product || !item.product.id) {
            console.warn("[usePayment] Skipping invalid CartItem:", item);
            return; // Bỏ qua item không hợp lệ
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
            id: productData.id.toString(), // Đảm bảo ID là string
            name: productData.name || "Sản phẩm",
            img: productData.img || Img1, // Ảnh mặc định
            title: productData.name || "Sản phẩm", // title có thể giống name
            weight: Number(productData.weight) || 0,
            price: Number(productData.price) || 0,
            quantity: Number(item.quantity) || 1,
            isPaid: !!item.isPaid, // Chuyển đổi sang boolean
            created_at: productData.createdAt || new Date().toISOString(), // Ngày mặc định
          });
        });

        const shopsArray = Object.values(shopsMap); // Chuyển map thành mảng
        setData(shopsArray); // Cập nhật state data
        setError(null); // Xóa lỗi nếu thành công
      }
    } catch (error: any) {
      // Xử lý lỗi khi fetch cart data
      console.error("[usePayment] Error in fetchCartData:", error);
      // Tránh ghi đè lỗi API cụ thể (404) bằng lỗi chung
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
    async (productId: string, newQuantity: number) => {
      cancelOngoingRequest();
      if (!navigator.onLine) {
        console.error("[usePayment] No network connection.");
        return false;
      }

      const buyNowCartId = localStorage.getItem("buyNowCartId");
      const currentCartId = localStorage.getItem("currentCartId");
      const cartIdToUpdate = buyNowCartId || currentCartId;

      if (!cartIdToUpdate) {
        console.error(
          "[usePayment] Cannot update quantity: No valid cartId found."
        );
        return false;
      }

      // Bỏ logic buyAgain nếu không dùng

      fetchControllerRef.current = new AbortController();
      const controller = fetchControllerRef.current;
      const timeoutId = setTimeout(() => {
        console.warn("[usePayment] Update quantity request timed out.");
        controller.abort();
      }, 5000); // 5 giây timeout

      try {
        const response = await fetch(
          `http://localhost:3000/cart-items/cart/${cartIdToUpdate}/product/${productId}`, // Đổi URL
          {
            method: "PATCH", // Giữ nguyên PATCH
            headers: { "Content-Type": "application/json" },
            // *** ĐẢM BẢO BODY ĐÚNG ***
            body: JSON.stringify({ quantity: newQuantity }), // Gửi đúng DTO { quantity: number }
            signal: controller.signal,
            // credentials: "include",
          }
        );
        console.log("response", response);

        clearTimeout(timeoutId); // Xóa timeout nếu request hoàn thành
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[usePayment] API error updating quantity (${response.status}):`,
            errorText
          );
          return false;
        }
        // Xử lý response thành công (có thể trả về item đã cập nhật hoặc chỉ message)
        const result = await response.json();
        console.log(
          `[usePayment] Quantity updated successfully for product ${productId} in cart ${cartIdToUpdate}. Response:`,
          result
        );

        // Nếu backend trả về message "Item removed successfully"
        if (result && result.message === "Item removed successfully") {
          console.log(
            `[usePayment] Product ${productId} removed from cart ${cartIdToUpdate}.`
          );
          // Không cần toast ở đây, UI sẽ tự cập nhật khi fetch lại
        }

        // Trigger fetch lại cart data để cập nhật UI
        fetchCartData();
        return true; // Trả về true nếu thành công
      } catch (error: any) {
        clearTimeout(timeoutId); // Đảm bảo timeout được xóa nếu có lỗi khác
        if (error.name === "AbortError") {
          console.log("[usePayment] Update quantity request was aborted.");
          // Không cần toast lỗi nếu là do người dùng hủy hoặc timeout
        } else {
          console.error("[usePayment] Fetch error updating quantity:", error);
        }
        return false; // Trả về false nếu có lỗi
      } finally {
        // Đảm bảo controller được reset sau khi request kết thúc (thành công, lỗi, hoặc hủy)
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
        }
      }
    },
    [fetchCartData] // Dependencies rỗng vì logic lấy cartId đã ở trong hàm
  );

  // Hàm hủy request đang chạy
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
  };
};

export default usePayment;
