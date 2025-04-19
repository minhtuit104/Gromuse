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
  const statusQuery = statuses.join(","); // Tạo chuỗi query param 'TO_RECEIVE,COMPLETE'

  console.log(
    `[fetchOrdersByStatus] Fetching orders with statuses: ${statusQuery}`
  );

  try {
    // Gọi endpoint mới
    const response = await fetch(
      `${apiURL}/cart-items/paid/by-status?statuses=${statusQuery}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${token}`, // Thêm nếu API yêu cầu xác thực
        },
        credentials: "include", // Nếu dùng cookie/session
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
          orderStatus: item.status || OrderStatus.TO_RECEIVE, // Lấy status từ backend
          cancelReason: item.cancelReason || undefined,
          // Các trường khác nếu cần
        };
      })
      .filter((order) => order.cartItemId > 0 && order.product.id > 0); // Lọc bỏ các item lỗi nếu cần

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

// export const saveOrderMapping = (
//   orderId: string,
//   cartId: number,
//   productId: number,
//   cartItemId: number
// ) => {
//   if (!orderId || !cartId || !productId || !cartItemId) {
//     console.warn("[saveOrderMapping] Missing required data, skipping save:", {
//       orderId,
//       cartId,
//       productId,
//       cartItemId,
//     });
//     return;
//   }
//   const mappings: OrderMapping[] = JSON.parse(
//     localStorage.getItem("orderMappings") || "[]"
//   );
//   const existIndex = mappings.findIndex((m) => m.orderId === orderId);
//   const newMapping = { orderId, cartId, productId, cartItemId };
//   if (existIndex >= 0) {
//     // Cập nhật nếu đã tồn tại (quan trọng khi đồng bộ lại)
//     mappings[existIndex] = newMapping;
//   } else {
//     mappings.push(newMapping);
//   }
//   localStorage.setItem("orderMappings", JSON.stringify(mappings));
//   // console.log("[saveOrderMapping] Saved/Updated mapping:", newMapping);
// };

// export const getOrderDetails = (
//   orderId: string
// ): { cartId?: number; productId?: number; cartItemId?: number } => {
//   const mappings: OrderMapping[] = JSON.parse(
//     localStorage.getItem("orderMappings") || "[]"
//   );
//   const foundMapping = mappings.find((m) => m.orderId === orderId);
//   if (foundMapping) {
//     // Đảm bảo trả về kiểu số
//     return {
//       cartId: Number(foundMapping.cartId),
//       productId: Number(foundMapping.productId),
//       cartItemId: Number(foundMapping.cartItemId),
//     };
//   }
//   console.warn(
//     `[getOrderDetails] Mapping not found for orderId: ${orderId}. Data might be out of sync. Consider reconstructing or syncing.`
//   );
//   return {};
// };

// export const reconstructOrderMappings = async () => {
//   try {
//     const pendingOrders = getOrdersFromLocalStorage();
//     const historyOrders = getOrderHistoryFromLocalStorage();
//     const allOrders = [...pendingOrders, ...historyOrders];
//     const mappings: OrderMapping[] = [];

//     allOrders.forEach((order) => {
//       if (
//         order.orderId &&
//         order.cartId &&
//         order.cartItemId && // Vẫn kiểm tra tồn tại
//         order.product.id
//       ) {
//         const productId = Number(order.product.id);
//         const cartItemId = Number(order.cartItemId); // Lấy cartItemId

//         // --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY ---
//         // Chỉ tạo mapping nếu các ID là số dương hợp lệ.
//         // Bỏ qua các cartItemId âm (placeholders) mà không báo lỗi nghiêm trọng.
//         if (
//           !isNaN(productId) &&
//           productId > 0 &&
//           order.cartId > 0 &&
//           !isNaN(cartItemId) && // Kiểm tra cartItemId là số
//           cartItemId > 0 // *** Chỉ chấp nhận cartItemId dương ***
//         ) {
//           mappings.push({
//             orderId: order.orderId,
//             cartId: order.cartId,
//             productId: productId,
//             cartItemId: cartItemId, // Sử dụng cartItemId đã kiểm tra
//           });
//         } else if (cartItemId <= 0) {
//           // Log nhẹ nhàng hơn nếu là placeholder, không cần báo lỗi lớn
//           // console.log(
//           //   `[reconstructOrderMappings] Skipping orderId ${order.orderId} with placeholder cartItemId: ${cartItemId}`
//           // );
//         } else {
//           // Vẫn cảnh báo nếu các ID khác không hợp lệ
//           console.warn(
//             `[reconstructOrderMappings] Skipping orderId ${order.orderId} due to invalid IDs (excluding placeholder check): productId=${order.product.id}, cartId=${order.cartId}, cartItemId=${order.cartItemId}`
//           );
//         }
//       } else {
//         console.warn(
//           `[reconstructOrderMappings] Skipping order due to missing required fields (orderId, cartId, cartItemId, productId):`,
//           order
//         );
//       }
//     });

//     // Ghi đè mapping cũ bằng mapping đã tái tạo (chỉ chứa các ID hợp lệ)
//     localStorage.setItem("orderMappings", JSON.stringify(mappings));
//     console.log(
//       "[reconstructOrderMappings] Reconstructed and saved valid mappings:",
//       mappings.length
//     );
//     return mappings;
//   } catch (error) {
//     console.error(
//       "[reconstructOrderMappings] Error reconstructing mappings:",
//       error
//     );
//     return [];
//   }
// };

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
    // --- End Update Local Storage ---

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
  cartItemId: number, // *** THAY ĐỔI: Nhận cartItemId ***
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

    // **KHÔNG** gọi updateLocalOrder nữa. Component sẽ fetch lại.

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

// function updateLocalOrder(
//   orderId: string,
//   newStatus: OrderStatus,
//   cancelReason?: string
// ): void {
//   console.log(
//     `[updateLocalOrder] Updating local storage for orderId: ${orderId} to status: ${newStatus}`
//   );

//   const currentPending = getOrdersFromLocalStorage();
//   const currentHistory = getOrderHistoryFromLocalStorage();

//   let orderToUpdate: OrderData | undefined;
//   let sourceList: "pending" | "history" | "none" = "none";
//   let indexInList = -1;

//   // Find in pending
//   indexInList = currentPending.findIndex((o) => o.orderId === orderId);
//   if (indexInList !== -1) {
//     orderToUpdate = currentPending[indexInList];
//     sourceList = "pending";
//   } else {
//     // Find in history
//     indexInList = currentHistory.findIndex((o) => o.orderId === orderId);
//     if (indexInList !== -1) {
//       orderToUpdate = currentHistory[indexInList];
//       sourceList = "history";
//     }
//   }

//   if (!orderToUpdate) {
//     console.error(
//       `[updateLocalOrder] CRITICAL: OrderId ${orderId} not found in pending or history. Cannot update local storage.`
//     );
//     // Maybe trigger a full sync here if data is missing?
//     // synchronizeOrdersWithBackend();
//     return;
//   }

//   console.log(`[updateLocalOrder] Found orderId ${orderId} in ${sourceList}.`);

//   const updatedOrderData: OrderData = {
//     ...orderToUpdate,
//     orderStatus: newStatus,
//   };

//   if (
//     newStatus === OrderStatus.CANCEL_BYSHOP ||
//     newStatus === OrderStatus.CANCEL_BYUSER
//   ) {
//     updatedOrderData.cancelReason = cancelReason || "Không có lý do cụ thể";
//     updatedOrderData.cancelledBy =
//       newStatus === OrderStatus.CANCEL_BYSHOP ? "shop" : "user";
//     updatedOrderData.cancelDate = Date.now();
//   } else {
//     // Clear cancellation details if status is not cancelled
//     delete updatedOrderData.cancelReason;
//     delete updatedOrderData.cancelledBy;
//     delete updatedOrderData.cancelDate;
//   }

//   let finalPending: OrderData[] = [...currentPending];
//   let finalHistory: OrderData[] = [...currentHistory];

//   const isFinalStatus =
//     newStatus === OrderStatus.COMPLETE ||
//     newStatus === OrderStatus.CANCEL_BYSHOP ||
//     newStatus === OrderStatus.CANCEL_BYUSER;

//   if (sourceList === "pending") {
//     if (isFinalStatus) {
//       console.log(
//         `[updateLocalOrder] Status is final (${newStatus}). Moving from pending to history.`
//       );
//       finalPending.splice(indexInList, 1); // Remove from pending
//       // Add/Update in history
//       const existingHistoryIndex = finalHistory.findIndex(
//         (o) => o.orderId === orderId
//       );
//       if (existingHistoryIndex !== -1) {
//         finalHistory[existingHistoryIndex] = updatedOrderData;
//       } else {
//         finalHistory.unshift(updatedOrderData); // Add to beginning of history
//       }
//     } else {
//       // Update in place in pending
//       console.log(
//         `[updateLocalOrder] Status is still pending (${newStatus}). Updating in pending list.`
//       );
//       finalPending[indexInList] = updatedOrderData;
//     }
//   } else if (sourceList === "history") {
//     // Update in place in history
//     console.log(
//       `[updateLocalOrder] Order was already in history. Updating in place.`
//     );
//     finalHistory[indexInList] = updatedOrderData;

//     // Handle case where an order in history is moved back to pending (e.g., admin revert)
//     if (newStatus === OrderStatus.TO_RECEIVE) {
//       console.warn(
//         `[updateLocalOrder] Order ${orderId} moved back to TO_RECEIVE status while in history. Moving back to pending.`
//       );
//       finalHistory.splice(indexInList, 1); // Remove from history
//       // Add/Update in pending
//       const existingPendingIndex = finalPending.findIndex(
//         (o) => o.orderId === orderId
//       );
//       if (existingPendingIndex !== -1) {
//         finalPending[existingPendingIndex] = updatedOrderData;
//       } else {
//         finalPending.push(updatedOrderData); // Add to end of pending
//       }
//     }
//   }

//   saveOrderDataToLocalStorage(finalPending);
//   saveOrderHistoryToLocalStorage(finalHistory);

//   console.log(
//     `[updateLocalOrder] Saved pending (${finalPending.length}) and history (${finalHistory.length}) lists.`
//   );
// }

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
  paidItems: { id: number; quantity: number }[] // Contains productId and quantity
): Promise<boolean> => {
  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  console.log(
    `[confirmPaymentAndUpdateBackend] Sending backend update for cartId: ${cartId}, items:`,
    paidItems
  );

  if (!cartId || cartId <= 0 || !paidItems || paidItems.length === 0) {
    console.error(
      "[confirmPaymentAndUpdateBackend] Invalid cartId or paidItems provided."
    );
    toast.error("Lỗi: Dữ liệu thanh toán không hợp lệ để cập nhật backend.");
    return false;
  }

  const endpointUrl = `${apiURL}/cart-items/cart/${cartId}/status`;
  const payload = {
    isPaid: true,
    // Backend's /status endpoint expects an array of product IDs
    products: paidItems.map((item) => ({ id: Number(item.id) })),
  };

  try {
    const response = await fetch(endpointUrl, {
      method: "PUT",
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
    // Don't toast success here, let the calling function handle overall success message
    // Don't call updateLocalOrder here.

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

// export const createOrdersFromPaymentData = async (
//   products: any[],
//   customerName: string,
//   customerAddress: string,
//   cartIdFromPayment?: string
// ): Promise<OrderData[]> => {
//   console.warn(
//     "[createOrdersFromPaymentData] WARNING: This function only creates local order data. It does NOT interact with the backend '/orders' endpoint (which doesn't exist). Actual backend update happens via confirmPaymentAndUpdateBackend."
//   );

//   const currentCartIdBeforePayment = localStorage.getItem("currentCartId");
//   let effectiveCartId: number | undefined;

//   // Xác định cartId hiệu lực
//   if (cartIdFromPayment && !isNaN(parseInt(cartIdFromPayment))) {
//     effectiveCartId = parseInt(cartIdFromPayment);
//     console.log(
//       `[createOrdersFromPaymentData (Local)] Using cartId from payment context: ${effectiveCartId}`
//     );
//     // Cập nhật luôn currentCartId nếu có cartId mới từ thanh toán
//     localStorage.setItem("currentCartId", effectiveCartId.toString());
//   } else if (
//     currentCartIdBeforePayment &&
//     !isNaN(parseInt(currentCartIdBeforePayment))
//   ) {
//     effectiveCartId = parseInt(currentCartIdBeforePayment);
//     console.log(
//       `[createOrdersFromPaymentData (Local)] Using currentCartId from localStorage: ${effectiveCartId}`
//     );
//   } else {
//     console.error(
//       "[createOrdersFromPaymentData (Local)] Cannot determine a valid cartId. Cannot create local order data."
//     );
//     toast.error(
//       "Lỗi: Không xác định được giỏ hàng để tạo dữ liệu đơn hàng cục bộ."
//     );
//     return [];
//   }

//   if (!products || products.length === 0) {
//     console.error(
//       "[createOrdersFromPaymentData (Local)] No products provided."
//     );
//     toast.error("Lỗi: Không có sản phẩm để tạo dữ liệu đơn hàng.");
//     return [];
//   }

//   const newOrders: OrderData[] = [];

//   try {
//     products.forEach((product, index) => {
//       const productId = Number(product.id);
//       if (isNaN(productId) || productId <= 0) {
//         console.warn(
//           "[createOrdersFromPaymentData (Local)] Skipping product with invalid ID:",
//           product
//         );
//         return;
//       }
//       const placeholderCartItemId = -(Date.now() + index);

//       const orderId = `FE_ORD-${effectiveCartId}-${productId}-${placeholderCartItemId}`;

//       const newOrder: OrderData = {
//         orderId: orderId,
//         cartItemId: placeholderCartItemId,
//         cartId: effectiveCartId!,
//         product: {
//           id: productId,
//           name: product.name || product.title || "Sản phẩm không tên",
//           img: product.img || "/placeholder.png",
//           price: Number(product.price) || 0,
//           quantity: Number(product.quantity) || 1,
//           weight: Number(product.weight) || 0,
//           title: product.title,
//         },
//         customer: { name: customerName, address: customerAddress },
//         orderStatus: OrderStatus.TO_RECEIVE,
//       };
//       newOrders.push(newOrder);

//       saveOrderMapping(
//         newOrder.orderId,
//         newOrder.cartId,
//         productId,
//         newOrder.cartItemId
//       );
//     });

//     if (newOrders.length > 0) {
//       const existingOrders = getOrdersFromLocalStorage();
//       const existingOrderIds = new Set(newOrders.map((o) => o.orderId));
//       const filteredExistingOrders = existingOrders.filter(
//         (o) => !existingOrderIds.has(o.orderId)
//       );

//       const combinedOrders = [...filteredExistingOrders, ...newOrders];
//       saveOrderDataToLocalStorage(combinedOrders);
//       console.log(
//         `[createOrdersFromPaymentData (Local)] Successfully created ${newOrders.length} local orders and added/updated in pendingOrders.`
//       );
//     } else {
//       console.warn(
//         "[createOrdersFromPaymentData (Local)] No valid local orders were created."
//       );
//     }

//     console.log(
//       "[createOrdersFromPaymentData (Local)] Suggest calling synchronizeOrdersWithBackend() after this to get real cartItemIds."
//     );

//     return newOrders;
//   } catch (error) {
//     console.error(
//       "[createOrdersFromPaymentData (Local)] Error during local order data creation:",
//       error
//     );
//     toast.error(
//       `Tạo dữ liệu đơn hàng cục bộ thất bại: ${
//         error instanceof Error ? error.message : "Lỗi không xác định"
//       }`
//     );
//     return [];
//   }
// };

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
