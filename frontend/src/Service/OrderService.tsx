import { toast } from "react-toastify";
import { CartItem as BackendCartItem } from "../../../backend/src/typeorm/entities/CartItem"; // **QUAN TRỌNG**: Import kiểu từ backend (điều chỉnh đường dẫn)
import { User as BackendUser } from "../../../backend/src/typeorm/entities/User"; // Import kiểu User nếu cần
import { Product as BackendProduct } from "../../../backend/src/typeorm/entities/Product"; // Import kiểu Product nếu cần

export enum OrderStatus {
  TO_RECEIVE = "TO_RECEIVE",
  COMPLETE = "COMPLETE",
  CANCEL_BYSHOP = "CANCEL_BYSHOP",
  CANCEL_BYUSER = "CANCEL_BYUSER",
}

export interface OrderData {
  orderId: string;
  cartItemId: number;
  cartId: number;
  product: {
    id: string | number;
    name: string;
    img: string;
    title?: string;
    weight: number;
    price: number;
    quantity: number;
  };
  customer: {
    name: string;
    address: string;
  };
  orderStatus: OrderStatus;
  cancelReason?: string;
  isRated?: boolean;
  cancelledBy?: "shop" | "user";
  cancelDate?: number;
}

export interface OrderMapping {
  orderId: string;
  cartId: number;
  productId: number;
  cartItemId: number;
}

export const fetchOrdersByStatus = async (
  statuses: OrderStatus[]
): Promise<OrderData[]> => {
  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("token");
  const statusQuery = statuses.join(",");

  console.log(
    `[fetchOrdersByStatus] Fetching orders with statuses: ${statusQuery}`
  );

  if (!token) {
    console.error(
      "[fetchOrdersByStatus] No token found. User might not be logged in."
    );
    toast.error("Vui lòng đăng nhập để xem đơn hàng.");
    return [];
  }

  try {
    // Gọi endpoint mới
    const response = await fetch(
      `${apiURL}/cart-items/paid/by-status?statuses=${statusQuery}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[fetchOrdersByStatus] API Error ${response.status}:`,
        errorBody
      );
      if (response.status === 401 || response.status === 403) {
        toast.error("Lỗi xác thực hoặc không có quyền truy cập đơn hàng.");
        // Có thể xử lý logout hoặc chuyển hướng đăng nhập ở đây
      } else {
        toast.error(`Lỗi ${response.status} khi tải danh sách đơn hàng.`);
      }
      return []; // Trả về mảng rỗng nếu lỗi
    }

    // Parse dữ liệu trả về từ backend (dạng BackendCartItem[])
    const backendItems: (BackendCartItem & {
      cart?: { user?: BackendUser };
      product?: BackendProduct;
    })[] = await response.json();
    console.log(`[fetchOrdersByStatus] Raw data received:`, backendItems);

    // Map dữ liệu backend sang cấu trúc OrderData của frontend
    const frontendOrders: OrderData[] = backendItems
      .map((item) => {
        // Tạo orderId duy nhất phía frontend dựa trên cartItemId
        const orderId = `ORD-${item.id}`; // Dùng cartItemId làm định danh chính

        return {
          orderId: orderId,
          cartItemId: item.id, // **QUAN TRỌNG**: Lấy cartItemId thật
          cartId: item.cart?.id || 0, // Lấy cartId (cần đảm bảo backend trả về)
          product: {
            id: item.product?.id || 0, // Lấy productId
            name: item.product?.name || "N/A",
            img: item.product?.img || "/placeholder.png",
            price: Number(item.product?.price) || 0,
            quantity: Number(item.quantity) || 1,
            weight: Number(item.product?.weight) || 0,
            title: item.product?.name, // Hoặc trường title nếu có
          },
          customer: {
            // Lấy thông tin customer từ cart.user (cần backend trả về)
            name: item.cart?.user?.name || "Khách hàng",
            address: item.cart?.user?.address || "Chưa cung cấp",
          },
          orderStatus: item.status || OrderStatus.TO_RECEIVE,
          cancelReason: item.cancelReason || undefined,
          isRated: !!item.rating,
        };
      })
      .filter((order) => order.cartItemId > 0 && order.product.id > 0);

    console.log(
      `[fetchOrdersByStatus] Mapped to frontend orders:`,
      frontendOrders
    );
    return frontendOrders;
  } catch (error) {
    console.error(`[fetchOrdersByStatus] Critical error:`, error);
    toast.error("Lỗi nghiêm trọng khi tải dữ liệu đơn hàng.");
    return [];
  }
};

// export const fetchShopOrdersByStatus = async (
//   statuses: OrderStatus[]
// ): Promise<OrderData[]> => {
//   const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
//   const token = localStorage.getItem("token"); // Shop user must be logged in
//   const statusQuery = statuses.join(",");

//   console.log(
//     `[fetchShopOrdersByStatus] Fetching SHOP orders with statuses: ${statusQuery}`
//   );

//   if (!token) {
//     console.error(
//       "[fetchShopOrdersByStatus] No token found. Shop user might not be logged in."
//     );
//     toast.error("Vui lòng đăng nhập tài khoản cửa hàng để xem đơn hàng.");
//     return [];
//   }

//   try {
//     // Call the NEW shop-specific endpoint
//     const response = await fetch(
//       `${apiURL}/cart-items/shop/paid/by-status?statuses=${statusQuery}`, // <<< NEW ENDPOINT
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`, // Send token for auth
//         },
//         credentials: "include",
//       }
//     );

//     if (!response.ok) {
//       const errorBody = await response.text();
//       console.error(
//         `[fetchShopOrdersByStatus] API Error ${response.status}:`,
//         errorBody
//       );
//       if (response.status === 401 || response.status === 403) {
//         toast.error(
//           "Lỗi xác thực hoặc bạn không có quyền truy cập (cần tài khoản shop)."
//         );
//       } else {
//         toast.error(
//           `Lỗi ${response.status} khi tải danh sách đơn hàng cho shop.`
//         );
//       }
//       return [];
//     }

//     // Backend response structure is the same (BackendCartItem[])
//     const backendItems: (BackendCartItem & {
//       cart?: { user?: BackendUser };
//       product?: BackendProduct;
//     })[] = await response.json();
//     console.log(`[fetchShopOrdersByStatus] Raw data received:`, backendItems);

//     // Mapping logic remains the same as fetchOrdersByStatus
//     const frontendOrders = mapBackendItemsToOrderData(backendItems); // Use a helper function

//     console.log(
//       `[fetchShopOrdersByStatus] Mapped to frontend orders:`,
//       frontendOrders
//     );
//     return frontendOrders;
//   } catch (error) {
//     console.error(`[fetchShopOrdersByStatus] Critical error:`, error);
//     toast.error("Lỗi nghiêm trọng khi tải dữ liệu đơn hàng cho shop.");
//     return [];
//   }
// };

// Helper function to map backend items (used by both fetch functions)
// const mapBackendItemsToOrderData = (
//   backendItems: (BackendCartItem & {
//     cart?: { user?: BackendUser };
//     product?: BackendProduct;
//   })[]
// ): OrderData[] => {
//   return backendItems
//     .map((item) => {
//       const orderId = `ORD-${item.id}`;
//       return {
//         orderId: orderId,
//         cartItemId: item.id,
//         cartId: item.cart?.id || 0,
//         product: {
//           id: item.product?.id || 0,
//           name: item.product?.name || "N/A",
//           img: item.product?.img || "/placeholder.png",
//           price: Number(item.product?.price) || 0,
//           quantity: Number(item.quantity) || 1,
//           weight: Number(item.product?.weight) || 0,
//           title: item.product?.name,
//         },
//         customer: {
//           name: item.cart?.user?.name || "Khách hàng",
//           address: item.cart?.user?.address || "Chưa cung cấp",
//         },
//         orderStatus: item.status || OrderStatus.TO_RECEIVE,
//         cancelReason: item.cancelReason || undefined,
//         isRated: !!item.rating,
//       };
//     })
//     .filter((order) => order.cartItemId > 0 && order.product.id > 0);
// };

export const getOrdersFromLocalStorage = (): OrderData[] => {
  const orders = localStorage.getItem("pendingOrders");
  return orders ? JSON.parse(orders) : [];
};

export const saveOrderDataToLocalStorage = (orderData: OrderData[]) => {
  localStorage.setItem("pendingOrders", JSON.stringify(orderData));
};

export const getOrderHistoryFromLocalStorage = (): OrderData[] => {
  const history = localStorage.getItem("orderHistory");
  return history ? JSON.parse(history) : [];
};

export const saveOrderHistoryToLocalStorage = (history: OrderData[]) => {
  localStorage.setItem("orderHistory", JSON.stringify(history));
};

export const fetchAndUpdateOrders = async (): Promise<boolean> => {
  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // Fetch based on the *last paid* cart ID if available, otherwise currentCartId
  const cartIdToFetch =
    localStorage.getItem("lastPaidCartId") ||
    localStorage.getItem("currentCartId");

  if (!cartIdToFetch || isNaN(parseInt(cartIdToFetch))) {
    console.warn(
      "[fetchAndUpdateOrders] No valid cartId (lastPaidCartId or currentCartId) found. Cannot fetch cart data."
    );
    // It's not necessarily an error if there's no cart to fetch, return true to indicate sync process finished without critical failure.
    return true;
  }

  const numericCartId = parseInt(cartIdToFetch);
  console.log(
    `[fetchAndUpdateOrders] Attempting to fetch orders for cartId: ${numericCartId}`
  );

  try {
    // API endpoint should return ALL items for the cart, regardless of isPaid status initially
    // Backend needs to be adjusted if /cart/:cartId only returns unpaid items
    const response = await fetch(`${apiURL}/cart-items/cart/${numericCartId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if needed
      },
      credentials: "include", // If using cookies/sessions
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[fetchAndUpdateOrders] API Error ${response.status} for cartId ${numericCartId}:`,
        errorBody
      );
      if (response.status === 404) {
        console.warn(
          `[fetchAndUpdateOrders] Cart ${numericCartId} not found on backend. Consider clearing local data if needed.`
        );
        // Optionally clear local data related to this cartId
      } else {
        toast.error(`Lỗi ${response.status} khi tải dữ liệu giỏ hàng.`);
      }
      return false; // Indicate sync failure
    }

    const cartItemsFromApi = await response.json(); // Expecting an array of CartItem entities
    console.log(
      `[fetchAndUpdateOrders] Raw data received from API for cartId ${numericCartId}:`,
      JSON.stringify(cartItemsFromApi, null, 2)
    );

    if (!Array.isArray(cartItemsFromApi)) {
      console.error(
        `[fetchAndUpdateOrders] API response for cartId ${numericCartId} is not an array.`,
        cartItemsFromApi
      );
      toast.error("Dữ liệu đơn hàng trả về không hợp lệ.");
      return false; // Indicate sync failure
    }

    const newPendingOrders: OrderData[] = [];
    const newHistoryOrders: OrderData[] = [];
    const newMappingsForThisCart: OrderMapping[] = [];

    // Process items received from the API
    cartItemsFromApi.forEach((item: any) => {
      const backendCartItemId = item.id;
      const backendProductId = item.product?.id;
      const backendCartId = numericCartId; // Use the cartId we fetched for

      // Validate essential IDs
      if (
        !backendCartItemId ||
        !backendProductId ||
        !backendCartId ||
        backendCartId <= 0 ||
        backendCartItemId <= 0 ||
        backendProductId <= 0
      ) {
        console.warn(
          "[fetchAndUpdateOrders] Skipping item due to missing or invalid IDs (cartItemId, productId, cartId):",
          item
        );
        return; // Skip this item
      }

      // Generate consistent frontend orderId
      const orderId = `FE_ORD-${backendCartId}-${backendCartItemId}`;

      // Create the OrderData object
      const orderData: OrderData = {
        orderId: orderId,
        cartItemId: backendCartItemId, // Use the REAL cartItemId from backend
        cartId: backendCartId,
        product: {
          id: backendProductId,
          name: item.product?.name || "Sản phẩm không tên",
          img: item.product?.img || "/placeholder.png",
          price: Number(item.product?.price) || 0,
          quantity: Number(item.quantity) || 1,
          weight: Number(item.product?.weight) || 0,
          title: item.product?.title,
        },
        customer: {
          // Fetch or use stored customer info
          name: localStorage.getItem("customerName") || "Khách hàng",
          address: localStorage.getItem("customerAddress") || "Chưa cung cấp",
        },
        orderStatus: item.status as OrderStatus, // Use status from backend
        cancelReason: item.cancelReason, // Use cancelReason from backend
        // cancelledBy and cancelDate can be derived if needed, or added to backend entity
      };

      // Add mapping for this item
      newMappingsForThisCart.push({
        orderId: orderData.orderId,
        cartId: orderData.cartId,
        productId: Number(orderData.product.id),
        cartItemId: orderData.cartItemId,
      });

      // Categorize into pending or history based on backend status
      if (item.isPaid && item.status === OrderStatus.TO_RECEIVE) {
        newPendingOrders.push(orderData);
      } else if (
        item.isPaid &&
        (item.status === OrderStatus.COMPLETE ||
          item.status === OrderStatus.CANCEL_BYSHOP ||
          item.status === OrderStatus.CANCEL_BYUSER)
      ) {
        newHistoryOrders.push(orderData);
      } else {
        // Log items that are not paid or have unexpected statuses
        console.log(
          `[fetchAndUpdateOrders] Skipping item for local storage (not paid or unexpected status): cartItemId=${backendCartItemId}, isPaid=${item.isPaid}, status=${item.status}`
        );
      }
    });

    // --- Update Local Storage ---
    // Get current local data, excluding the cart being updated
    const currentPending = getOrdersFromLocalStorage().filter(
      (o) => o.cartId !== numericCartId
    );
    const currentHistory = getOrderHistoryFromLocalStorage().filter(
      (h) => h.cartId !== numericCartId
    );
    const currentMappings = (
      JSON.parse(
        localStorage.getItem("orderMappings") || "[]"
      ) as OrderMapping[]
    ).filter((m) => m.cartId !== numericCartId);

    // Combine old data (for other carts) with new data (for the current cart)
    const finalPending = [...currentPending, ...newPendingOrders];
    const finalHistory = [...currentHistory, ...newHistoryOrders];
    const finalMappings = [...currentMappings, ...newMappingsForThisCart];

    // Ensure uniqueness in history (optional but good practice)
    const uniqueHistoryMap = new Map(
      finalHistory.map((order) => [order.orderId, order])
    );
    const uniqueFinalHistory = Array.from(uniqueHistoryMap.values());

    // Save updated lists back to localStorage
    saveOrderDataToLocalStorage(finalPending);
    saveOrderHistoryToLocalStorage(uniqueFinalHistory);
    localStorage.setItem("orderMappings", JSON.stringify(finalMappings));

    console.log(
      `[fetchAndUpdateOrders] Updated local storage for cartId ${numericCartId}: ${newPendingOrders.length} pending, ${newHistoryOrders.length} history items added/updated.`
    );
    console.log(
      `[fetchAndUpdateOrders] Updated mappings for cartId ${numericCartId}: ${newMappingsForThisCart.length} mappings.`
    );

    return true; // Indicate successful sync
  } catch (error) {
    console.error(
      `[fetchAndUpdateOrders] Critical error during fetch/processing for cartId ${numericCartId}:`,
      error
    );
    toast.error("Lỗi nghiêm trọng khi đồng bộ dữ liệu đơn hàng.");
    return false; // Indicate sync failure
  }
};

export const synchronizeOrdersWithBackend = async (): Promise<boolean> => {
  console.log("[synchronizeOrdersWithBackend] Starting synchronization...");
  const success = await fetchAndUpdateOrders(); // Call the refined function
  if (success) {
    console.log(
      "[synchronizeOrdersWithBackend] Synchronization finished successfully."
    );
  } else {
    console.error(
      "[synchronizeOrdersWithBackend] Synchronization finished with errors."
    );
  }
  return success; // Return the success status
};

export async function updateOrderStatusOnBackend(
  cartItemId: number,
  status: OrderStatus,
  cancelReason?: string
): Promise<boolean> {
  console.log(
    `[updateOrderStatusOnBackend] Attempting to update cartItemId: ${cartItemId} to status: ${status}${
      cancelReason ? ` with reason: "${cancelReason}"` : ""
    }`
  );

  // Validate cartItemId
  if (!cartItemId || isNaN(cartItemId) || cartItemId <= 0) {
    console.error(
      `[updateOrderStatusOnBackend] Invalid cartItemId: ${cartItemId}. Cannot update.`
    );
    toast.error(`Lỗi: Mã định danh mục đơn hàng không hợp lệ (${cartItemId}).`);
    return false;
  }

  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // Dùng endpoint mới với cartItemId
  const endpointUrl = `${apiURL}/cart-items/${cartItemId}/order-status`; // *** ENDPOINT MỚI ***

  const requestBody: { status: string; cancelReason?: string } = {
    status: status.toString(),
  };
  if (
    (status === OrderStatus.CANCEL_BYSHOP ||
      status === OrderStatus.CANCEL_BYUSER) &&
    cancelReason?.trim()
  ) {
    requestBody.cancelReason = cancelReason.trim();
  }

  console.log(
    `[updateOrderStatusOnBackend] Calling PUT ${endpointUrl} with body:`,
    JSON.stringify(requestBody)
  );

  try {
    const response = await fetch(endpointUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${token}`, // Add if needed
      },
      body: JSON.stringify(requestBody),
      credentials: "include", // If needed
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[updateOrderStatusOnBackend] API Error ${response.status} at ${endpointUrl}:`,
        errorText
      );
      // Xử lý lỗi cụ thể (404, 400, 401/403)
      if (response.status === 404) {
        toast.error(
          `Lỗi 404: Không tìm thấy mục đơn hàng với ID: ${cartItemId} trên máy chủ.`
        );
      } else if (response.status === 400) {
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(
            `Lỗi cập nhật trạng thái: ${
              errorJson.message || "Dữ liệu không hợp lệ."
            }`
          );
        } catch {
          toast.error(`Lỗi 400: Yêu cầu cập nhật trạng thái không hợp lệ.`);
        }
      } else if (response.status === 401 || response.status === 403) {
        toast.error(
          "Lỗi xác thực hoặc không có quyền cập nhật trạng thái đơn hàng này."
        );
      } else {
        toast.error(`Lỗi ${response.status} khi cập nhật trạng thái đơn hàng.`);
      }
      return false; // Indicate failure
    }

    const result = await response.json();
    console.log(
      "[updateOrderStatusOnBackend] Backend update successful:",
      result
    );

    return true; // Indicate success
  } catch (error) {
    console.error(
      "[updateOrderStatusOnBackend] Network or unexpected error:",
      error
    );
    toast.error("Lỗi kết nối hoặc lỗi không xác định khi cập nhật trạng thái.");
    return false; // Indicate failure
  }
}

export const getCancelledByShopOrdersFromLocalStorage = (): OrderData[] => {
  try {
    const orderHistory = getOrderHistoryFromLocalStorage();
    return orderHistory.filter(
      (order) => order.orderStatus === OrderStatus.CANCEL_BYSHOP
    );
  } catch (error) {
    console.error("Error getting cancelled by shop orders:", error);
    return [];
  }
};

export const confirmPaymentAndUpdateBackend = async (
  cartId: number,
  paidCartItemIds: number[]
): Promise<boolean> => {
  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  console.log(
    `[confirmPaymentAndUpdateBackend] Sending backend update for cartId: ${cartId}, paidCartItemIds:`,
    paidCartItemIds
  );

  if (
    !cartId ||
    cartId <= 0 ||
    !paidCartItemIds ||
    paidCartItemIds.length === 0
  ) {
    console.error(
      "[confirmPaymentAndUpdateBackend] Invalid cartId or paidCartItemIds provided."
    );
    toast.error("Lỗi: Dữ liệu thanh toán không hợp lệ để cập nhật backend.");
    return false;
  }

  // Sử dụng endpoint cũ nhưng gửi payload mới
  const endpointUrl = `${apiURL}/cart-items/cart/${cartId}/status`;
  const payload = {
    isPaid: true,
    cartItemIds: paidCartItemIds, // <<< Gửi mảng cartItemIds
  };
  const method = "PUT";

  try {
    const response = await fetch(endpointUrl, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include", // If needed
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[confirmPaymentAndUpdateBackend] Backend API Error ${response.status}:`,
        errorText
      );
      toast.error(
        `Lỗi ${response.status} khi cập nhật trạng thái thanh toán trên backend.`
      );
      return false; // Indicate failure
    }

    const result = await response.json();
    console.log(
      "[confirmPaymentAndUpdateBackend] Backend update successful:",
      result
    );

    // Xóa cartId hiện tại sau khi thanh toán thành công
    localStorage.removeItem("currentCartId");
    localStorage.removeItem("cartId"); // Xóa cả cartId lưu tạm
    localStorage.removeItem("cartUpdated"); // Xóa cờ cập nhật

    return true; // Indicate backend update success
  } catch (error) {
    console.error(
      "[confirmPaymentAndUpdateBackend] Network or unexpected error:",
      error
    );
    toast.error("Lỗi kết nối hoặc lỗi không xác định khi cập nhật backend.");
    return false; // Indicate failure
  }
};

export const saveBuyAgainProduct = (product: any): void => {
  try {
    localStorage.setItem("buyAgainProduct", JSON.stringify(product));
    localStorage.setItem("isBuyNow", "true"); // Indicate buy now mode
    console.log("Saved buy again product info:", product);
  } catch (error) {
    console.error("Error saving buy again product:", error);
    toast.error("Không thể lưu thông tin sản phẩm.");
  }
};

export const getBuyAgainProduct = (): any | null => {
  try {
    const productJSON = localStorage.getItem("buyAgainProduct");
    return productJSON ? JSON.parse(productJSON) : null;
  } catch (error) {
    console.error("Error getting buy again product:", error);
    return null;
  }
};

export const clearBuyAgainProduct = () => {
  try {
    localStorage.removeItem("buyAgainProduct");
    localStorage.removeItem("isBuyNow");
    console.log("Cleared buy again product info.");
    return true;
  } catch (error) {
    console.error("Error clearing buy again product:", error);
    return false;
  }
};
