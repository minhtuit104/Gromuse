import { toast } from "react-toastify";

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

export const saveOrderMapping = (
  orderId: string,
  cartId: number,
  productId: number,
  cartItemId: number
) => {
  if (!orderId || !cartId || !productId || !cartItemId) {
    console.warn("[saveOrderMapping] Missing required data, skipping save:", {
      orderId,
      cartId,
      productId,
      cartItemId,
    });
    return;
  }
  const mappings: OrderMapping[] = JSON.parse(
    localStorage.getItem("orderMappings") || "[]"
  );
  const existIndex = mappings.findIndex((m) => m.orderId === orderId);
  const newMapping = { orderId, cartId, productId, cartItemId };
  if (existIndex >= 0) {
    // Cập nhật nếu đã tồn tại (quan trọng khi đồng bộ lại)
    mappings[existIndex] = newMapping;
  } else {
    mappings.push(newMapping);
  }
  localStorage.setItem("orderMappings", JSON.stringify(mappings));
  // console.log("[saveOrderMapping] Saved/Updated mapping:", newMapping);
};

export const getOrderDetails = (
  orderId: string
): { cartId?: number; productId?: number; cartItemId?: number } => {
  const mappings: OrderMapping[] = JSON.parse(
    localStorage.getItem("orderMappings") || "[]"
  );
  const foundMapping = mappings.find((m) => m.orderId === orderId);
  if (foundMapping) {
    // Đảm bảo trả về kiểu số
    return {
      cartId: Number(foundMapping.cartId),
      productId: Number(foundMapping.productId),
      cartItemId: Number(foundMapping.cartItemId),
    };
  }
  console.warn(
    `[getOrderDetails] Mapping not found for orderId: ${orderId}. Data might be out of sync. Consider reconstructing or syncing.`
  );
  return {};
};

export const reconstructOrderMappings = async () => {
  try {
    const pendingOrders = getOrdersFromLocalStorage();
    const historyOrders = getOrderHistoryFromLocalStorage();
    const allOrders = [...pendingOrders, ...historyOrders];
    const mappings: OrderMapping[] = [];

    allOrders.forEach((order) => {
      if (
        order.orderId &&
        order.cartId &&
        order.cartItemId && // Vẫn kiểm tra tồn tại
        order.product.id
      ) {
        const productId = Number(order.product.id);
        const cartItemId = Number(order.cartItemId); // Lấy cartItemId

        // --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY ---
        // Chỉ tạo mapping nếu các ID là số dương hợp lệ.
        // Bỏ qua các cartItemId âm (placeholders) mà không báo lỗi nghiêm trọng.
        if (
          !isNaN(productId) &&
          productId > 0 &&
          order.cartId > 0 &&
          !isNaN(cartItemId) && // Kiểm tra cartItemId là số
          cartItemId > 0 // *** Chỉ chấp nhận cartItemId dương ***
        ) {
          mappings.push({
            orderId: order.orderId,
            cartId: order.cartId,
            productId: productId,
            cartItemId: cartItemId, // Sử dụng cartItemId đã kiểm tra
          });
        } else if (cartItemId <= 0) {
          // Log nhẹ nhàng hơn nếu là placeholder, không cần báo lỗi lớn
          // console.log(
          //   `[reconstructOrderMappings] Skipping orderId ${order.orderId} with placeholder cartItemId: ${cartItemId}`
          // );
        } else {
          // Vẫn cảnh báo nếu các ID khác không hợp lệ
          console.warn(
            `[reconstructOrderMappings] Skipping orderId ${order.orderId} due to invalid IDs (excluding placeholder check): productId=${order.product.id}, cartId=${order.cartId}, cartItemId=${order.cartItemId}`
          );
        }
      } else {
        console.warn(
          `[reconstructOrderMappings] Skipping order due to missing required fields (orderId, cartId, cartItemId, productId):`,
          order
        );
      }
    });

    // Ghi đè mapping cũ bằng mapping đã tái tạo (chỉ chứa các ID hợp lệ)
    localStorage.setItem("orderMappings", JSON.stringify(mappings));
    console.log(
      "[reconstructOrderMappings] Reconstructed and saved valid mappings:",
      mappings.length
    );
    return mappings;
  } catch (error) {
    console.error(
      "[reconstructOrderMappings] Error reconstructing mappings:",
      error
    );
    return [];
  }
};

// export const fetchAndUpdateOrders = async (): Promise<boolean> => {
//   const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
//   const cartId = localStorage.getItem("currentCartId");

//   if (!cartId || isNaN(parseInt(cartId))) {
//     console.warn(
//       "[fetchAndUpdateOrders] No valid currentCartId found in localStorage. Cannot fetch cart data."
//     );
//     return true;
//   }

//   const numericCartId = parseInt(cartId);
//   console.log(
//     `[fetchAndUpdateOrders] Attempting to fetch orders for cartId: ${numericCartId}`
//   );

//   try {
//     const response = await fetch(`${apiURL}/cart-items/cart/${numericCartId}`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         // Authorization: `Bearer ${token}`,
//       },
//       credentials: "include",
//     });

//     if (!response.ok) {
//       const errorBody = await response.text();
//       console.error(
//         `[fetchAndUpdateOrders] API Error ${response.status} for cartId ${numericCartId}:`,
//         errorBody
//       );
//       if (response.status === 404) {
//         console.warn(
//           `[fetchAndUpdateOrders] Cart ${numericCartId} not found on backend. Clearing local data potentially related to this cart.`
//         );
//         const currentPending = getOrdersFromLocalStorage();
//         const filteredPending = currentPending.filter(
//           (o) => o.cartId !== numericCartId
//         );
//         saveOrderDataToLocalStorage(filteredPending);

//         const currentHistory = getOrderHistoryFromLocalStorage();
//         const filteredHistory = currentHistory.filter(
//           (h) => h.cartId !== numericCartId
//         );
//         saveOrderHistoryToLocalStorage(filteredHistory);

//         const currentMappings = JSON.parse(
//           localStorage.getItem("orderMappings") || "[]"
//         ) as OrderMapping[];
//         const filteredMappings = currentMappings.filter(
//           (m) => m.cartId !== numericCartId
//         );
//         localStorage.setItem("orderMappings", JSON.stringify(filteredMappings));
//       } else {
//         toast.error(`Lỗi ${response.status} khi tải dữ liệu giỏ hàng.`);
//       }
//       return false;
//     }

//     const cartData = await response.json();
//     console.log(
//       `[fetchAndUpdateOrders] Raw data received from API for cartId ${numericCartId}:`,
//       JSON.stringify(cartData, null, 2)
//     );

//     const newPendingOrders: OrderData[] = [];
//     const newHistoryOrders: OrderData[] = [];
//     const newMappingsForThisCart: OrderMapping[] = [];

//     const itemsArray = cartData;

//     if (itemsArray && Array.isArray(itemsArray)) {
//       if (itemsArray.length === 0) {
//         console.log(
//           `[fetchAndUpdateOrders] Cart ${numericCartId} is empty on backend. Clearing local pending data for this cart.`
//         );
//         const currentPending = getOrdersFromLocalStorage();
//         const filteredPending = currentPending.filter(
//           (o) => o.cartId !== numericCartId
//         );
//         saveOrderDataToLocalStorage(filteredPending);
//         const currentMappings = JSON.parse(
//           localStorage.getItem("orderMappings") || "[]"
//         ) as OrderMapping[];
//         const filteredMappings = currentMappings.filter(
//           (m) => m.cartId !== numericCartId
//         );
//         localStorage.setItem("orderMappings", JSON.stringify(filteredMappings));
//       } else {
//         itemsArray.forEach((item: any) => {
//           const backendCartItemId = item.id;
//           const backendProductId = item.product?.id;
//           const backendCartId = numericCartId;

//           if (
//             !backendCartItemId ||
//             !backendProductId ||
//             !backendCartId ||
//             backendCartId <= 0 ||
//             backendCartItemId <= 0 ||
//             backendProductId <= 0
//           ) {
//             console.warn(
//               "[fetchAndUpdateOrders] Skipping item due to missing or invalid IDs (cartItemId, productId, cartId):",
//               item
//             );
//             return;
//           }

//           const orderId = `FE_ORD-${backendCartId}-${backendCartItemId}`;

//           const orderData: OrderData = {
//             orderId: orderId,
//             cartItemId: backendCartItemId,
//             cartId: backendCartId,
//             product: {
//               id: backendProductId,
//               name: item.product?.name || "Sản phẩm không tên",
//               img: item.product?.img || "/placeholder.png",
//               price: item.product?.price || 0,
//               quantity: item.quantity || 1,
//               weight: item.product?.weight || 0,
//               title: item.product?.title,
//             },
//             customer: {
//               name: localStorage.getItem("customerName") || "Khách hàng",
//               address:
//                 localStorage.getItem("customerAddress") || "Chưa cung cấp",
//             },
//             orderStatus: item.status as OrderStatus,
//             cancelReason: item.cancelReason,
//           };

//           newMappingsForThisCart.push({
//             orderId: orderData.orderId,
//             cartId: orderData.cartId,
//             productId: Number(orderData.product.id),
//             cartItemId: orderData.cartItemId,
//           });

//           if (item.isPaid && item.status === OrderStatus.TO_RECEIVE) {
//             newPendingOrders.push(orderData);
//           } else if (
//             item.isPaid &&
//             (item.status === OrderStatus.COMPLETE ||
//               item.status === OrderStatus.CANCEL_BYSHOP ||
//               item.status === OrderStatus.CANCEL_BYUSER)
//           ) {
//             newHistoryOrders.push(orderData);
//           } else {
//             console.log(
//               `[fetchAndUpdateOrders] Skipping item for local storage (not paid or unexpected status):`,
//               item
//             );
//           }
//         });

//         const currentPending = getOrdersFromLocalStorage();
//         const currentHistory = getOrderHistoryFromLocalStorage();
//         const currentMappings = JSON.parse(
//           localStorage.getItem("orderMappings") || "[]"
//         ) as OrderMapping[];

//         const otherPending = currentPending.filter(
//           (o) => o.cartId !== numericCartId
//         );
//         const otherHistory = currentHistory.filter(
//           (h) => h.cartId !== numericCartId
//         );
//         const otherMappings = currentMappings.filter(
//           (m) => m.cartId !== numericCartId
//         );

//         const finalPending = [...otherPending, ...newPendingOrders];
//         const finalHistory = [...otherHistory, ...newHistoryOrders];
//         const finalMappings = [...otherMappings, ...newMappingsForThisCart];

//         const uniqueHistoryMap = new Map(
//           finalHistory.map((order) => [order.orderId, order])
//         );
//         const uniqueFinalHistory = Array.from(uniqueHistoryMap.values());

//         saveOrderDataToLocalStorage(finalPending);
//         saveOrderHistoryToLocalStorage(uniqueFinalHistory);
//         localStorage.setItem("orderMappings", JSON.stringify(finalMappings));

//         console.log(
//           `[fetchAndUpdateOrders] Updated local storage for cartId ${numericCartId}: ${newPendingOrders.length} pending, ${newHistoryOrders.length} history items added/updated.`
//         );
//         console.log(
//           `[fetchAndUpdateOrders] Updated mappings for cartId ${numericCartId}: ${newMappingsForThisCart.length} mappings.`
//         );
//       }
//     } else {
//       console.warn(
//         `[fetchAndUpdateOrders] Invalid or missing 'cartItems' array in API response for cartId ${numericCartId}. Clearing local data for this cart.`,
//         cartData
//       );
//       const currentPending = getOrdersFromLocalStorage();
//       const filteredPending = currentPending.filter(
//         (o) => o.cartId !== numericCartId
//       );
//       saveOrderDataToLocalStorage(filteredPending);

//       const currentHistory = getOrderHistoryFromLocalStorage();
//       const filteredHistory = currentHistory.filter(
//         (h) => h.cartId !== numericCartId
//       );
//       saveOrderHistoryToLocalStorage(filteredHistory);

//       const currentMappings = JSON.parse(
//         localStorage.getItem("orderMappings") || "[]"
//       ) as OrderMapping[];
//       const filteredMappings = currentMappings.filter(
//         (m) => m.cartId !== numericCartId
//       );
//       localStorage.setItem("orderMappings", JSON.stringify(filteredMappings));
//     }

//     return true;
//   } catch (error) {
//     console.error(
//       `[fetchAndUpdateOrders] Critical error during fetch/processing for cartId ${numericCartId}:`,
//       error
//     );
//     toast.error("Lỗi nghiêm trọng khi đồng bộ dữ liệu đơn hàng.");
//     return false;
//   }
// };

// export const synchronizeOrdersWithBackend = async (): Promise<boolean> => {
//   console.log("[synchronizeOrdersWithBackend] Starting synchronization...");
//   // const success = await fetchAndUpdateOrders();
//   // if (success) {
//   //   console.log(
//   //     "[synchronizeOrdersWithBackend] Synchronization finished successfully."
//   //   );
//   // } else {
//   //   console.error(
//   //     "[synchronizeOrdersWithBackend] Synchronization finished with errors."
//   //   );
//   // }
//   // return success;
// };

export async function updateOrderStatusOnBackend(
  orderId: string,
  status: OrderStatus,
  cancelReason?: string
): Promise<boolean> {
  console.log(
    `[updateOrderStatusOnBackend] Attempting to update orderId: ${orderId} to status: ${status}${
      cancelReason ? ` with reason: "${cancelReason}"` : ""
    }`
  );

  // console.log(
  //   `[updateOrderStatusOnBackend] Forcing synchronization before updating orderId: ${orderId}`
  // );
  // const syncSuccess = await synchronizeOrdersWithBackend();
  // if (!syncSuccess) {
  //   toast.error("Đồng bộ dữ liệu thất bại. Không thể cập nhật trạng thái.");
  //   console.error(
  //     "[updateOrderStatusOnBackend] Sync failed before update, stopping."
  //   );
  //   return false;
  // }
  // console.log(
  //   "[updateOrderStatusOnBackend] Sync complete. Proceeding to find order details."
  // );

  const orderDetails = getOrderDetails(orderId);
  const cartId = orderDetails.cartId;
  const productId = orderDetails.productId;

  console.log(
    `[updateOrderStatusOnBackend] Found details for orderId ${orderId} after sync:`,
    orderDetails
  );
  if (
    !cartId ||
    isNaN(cartId) ||
    cartId <= 0 ||
    !productId ||
    isNaN(productId) ||
    productId <= 0
  ) {
    console.error(
      `[updateOrderStatusOnBackend] Invalid or missing cartId (${cartId}) or productId (${productId}) found for orderId ${orderId} after sync. Cannot update.`
    );
    toast.error(
      `Lỗi: Không tìm thấy mã định danh hợp lệ (cartId/productId) cho đơn hàng ${orderId}. Dữ liệu có thể không đồng bộ.`
    );
    return false;
  }

  console.log(
    `[updateOrderStatusOnBackend] Using cartId: ${cartId}, productId: ${productId} to update orderId: ${orderId}`
  );

  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  // const token = localStorage.getItem("userToken") || ""; // Bỏ comment nếu dùng token

  const endpointUrl = `${apiURL}/cart-items/cart/${cartId}/product/${productId}/order-status`;

  const requestBody: { status: string; cancelReason?: string } = {
    status: status.toString(),
  };

  if (
    (status === OrderStatus.CANCEL_BYSHOP ||
      status === OrderStatus.CANCEL_BYUSER) &&
    cancelReason &&
    cancelReason.trim() !== ""
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
        // Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[updateOrderStatusOnBackend] API Error ${response.status} at ${endpointUrl}:`,
        errorText
      );
      if (response.status === 404) {
        toast.error(
          `Lỗi 404: Không tìm thấy mục đơn hàng (CartID: ${cartId}, ProductID: ${productId}) trên máy chủ. Dữ liệu có thể đã thay đổi.`
        );
      } else {
        toast.error(`Lỗi ${response.status} khi cập nhật trạng thái đơn hàng.`);
      }
      return false;
    }

    const result = await response.json();
    console.log(
      "[updateOrderStatusOnBackend] Backend update successful:",
      result
    );
    updateLocalOrder(orderId, status, cancelReason);

    return true;
  } catch (error) {
    console.error(
      "[updateOrderStatusOnBackend] Network or unexpected error during API call:",
      error
    );
    toast.error("Lỗi kết nối hoặc lỗi không xác định khi cập nhật trạng thái.");
    return false;
  }
}

function updateLocalOrder(
  orderId: string,
  newStatus: OrderStatus,
  cancelReason?: string
): void {
  console.log(
    `[updateLocalOrder] Updating local storage for orderId: ${orderId} to status: ${newStatus}`
  );

  const currentPending = getOrdersFromLocalStorage();
  const currentHistory = getOrderHistoryFromLocalStorage();

  let orderToUpdate: OrderData | undefined;
  let sourceList: "pending" | "history" | "none" = "none";

  // Tìm trong pending trước
  const pendingIndex = currentPending.findIndex((o) => o.orderId === orderId);
  if (pendingIndex !== -1) {
    orderToUpdate = currentPending[pendingIndex];
    sourceList = "pending";
  } else {
    // Nếu không thấy, tìm trong history
    const historyIndex = currentHistory.findIndex((o) => o.orderId === orderId);
    if (historyIndex !== -1) {
      orderToUpdate = currentHistory[historyIndex];
      sourceList = "history";
    }
  }

  if (!orderToUpdate) {
    console.error(
      `[updateLocalOrder] CRITICAL: OrderId ${orderId} not found in pending or history. Cannot update local storage.`
    );
    return;
  }

  console.log(`[updateLocalOrder] Found orderId ${orderId} in ${sourceList}.`);

  // Tạo bản sao và cập nhật
  const updatedOrderData: OrderData = {
    ...orderToUpdate,
    orderStatus: newStatus,
  };

  if (
    newStatus === OrderStatus.CANCEL_BYSHOP ||
    newStatus === OrderStatus.CANCEL_BYUSER
  ) {
    updatedOrderData.cancelReason = cancelReason || "Không có lý do cụ thể";
    updatedOrderData.cancelledBy =
      newStatus === OrderStatus.CANCEL_BYSHOP ? "shop" : "user";
    updatedOrderData.cancelDate = Date.now();
  } else {
    delete updatedOrderData.cancelReason;
    delete updatedOrderData.cancelledBy;
    delete updatedOrderData.cancelDate;
  }

  let finalPending: OrderData[] = [...currentPending];
  let finalHistory: OrderData[] = [...currentHistory];

  const isFinalStatus =
    newStatus === OrderStatus.COMPLETE ||
    newStatus === OrderStatus.CANCEL_BYSHOP ||
    newStatus === OrderStatus.CANCEL_BYUSER;

  if (sourceList === "pending") {
    if (isFinalStatus) {
      // Di chuyển từ pending sang history
      console.log(
        `[updateLocalOrder] Status is final (${newStatus}). Moving from pending to history.`
      );
      finalPending.splice(pendingIndex, 1); // Xóa khỏi pending
      // Thêm vào đầu history (hoặc cập nhật nếu đã có sẵn - trường hợp hiếm)
      const existingHistoryIndex = finalHistory.findIndex(
        (o) => o.orderId === orderId
      );
      if (existingHistoryIndex !== -1) {
        finalHistory[existingHistoryIndex] = updatedOrderData;
      } else {
        finalHistory.unshift(updatedOrderData);
      }
    } else {
      // Cập nhật tại chỗ trong pending (ví dụ: TO_RECEIVE -> TO_RECEIVE, ít xảy ra)
      console.log(
        `[updateLocalOrder] Status is still pending (${newStatus}). Updating in pending list.`
      );
      finalPending[pendingIndex] = updatedOrderData;
    }
  } else if (sourceList === "history") {
    // Cập nhật tại chỗ trong history
    console.log(
      `[updateLocalOrder] Order was already in history. Updating in place.`
    );
    const historyIndex = finalHistory.findIndex((o) => o.orderId === orderId);
    if (historyIndex !== -1) {
      // Nên luôn tìm thấy
      finalHistory[historyIndex] = updatedOrderData;
    }
    // Nếu trạng thái mới là TO_RECEIVE (ví dụ admin revert), cần xem xét chuyển về pending
    if (newStatus === OrderStatus.TO_RECEIVE) {
      console.warn(
        `[updateLocalOrder] Order ${orderId} moved back to TO_RECEIVE status while in history. Moving back to pending.`
      );
      finalHistory.splice(historyIndex, 1); // Xóa khỏi history
      // Thêm vào pending (hoặc cập nhật nếu đã có)
      const existingPendingIndex = finalPending.findIndex(
        (o) => o.orderId === orderId
      );
      if (existingPendingIndex !== -1) {
        finalPending[existingPendingIndex] = updatedOrderData;
      } else {
        finalPending.push(updatedOrderData); // Thêm vào cuối pending
      }
    }
  }

  saveOrderDataToLocalStorage(finalPending);
  saveOrderHistoryToLocalStorage(finalHistory);

  console.log(
    `[updateLocalOrder] Saved pending (${finalPending.length}) and history (${finalHistory.length}) lists.`
  );
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
  paidItems: { id: number; quantity: number }[] // Chứa productId và quantity
): Promise<boolean> => {
  const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  console.log(
    `[confirmPaymentAndUpdateBackend] Confirming payment for cartId: ${cartId}, items:`,
    paidItems
  );

  if (!cartId || cartId <= 0 || !paidItems || paidItems.length === 0) {
    console.error(
      "[confirmPaymentAndUpdateBackend] Invalid cartId or paidItems provided."
    );
    toast.error("Lỗi: Dữ liệu thanh toán không hợp lệ.");
    return false;
  }

  const endpointUrl = `${apiURL}/cart-items/cart/${cartId}/status`;
  const payload = {
    isPaid: true,
    products: paidItems.map((item) => ({ id: Number(item.id) })), // Chỉ gửi product ID
  };

  try {
    // 1. Gọi API backend để cập nhật isPaid, sold count, và status thành TO_RECEIVE
    const response = await fetch(endpointUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[confirmPaymentAndUpdateBackend] API Error ${response.status}:`,
        errorText
      );
      toast.error(`Lỗi ${response.status} khi cập nhật trạng thái thanh toán.`);
      return false; // Trả về false nếu API lỗi
    }

    const result = await response.json();
    console.log(
      "[confirmPaymentAndUpdateBackend] Backend update successful:",
      result
    );
    toast.success(
      result.message || "Đã cập nhật trạng thái thanh toán thành công!"
    );

    // 2. Cập nhật trực tiếp Local Storage
    console.log(
      "[confirmPaymentAndUpdateBackend] Updating local storage status to TO_RECEIVE..."
    );
    let updateCount = 0;
    // Lấy mapping hiện tại
    const mappings: OrderMapping[] = JSON.parse(
      localStorage.getItem("orderMappings") || "[]"
    );

    for (const paidItem of paidItems) {
      const productId = Number(paidItem.id);
      // Tìm mapping cho cartId và productId cụ thể này
      const mapping = mappings.find(
        (m) => m.cartId === cartId && m.productId === productId
      );

      if (mapping && mapping.orderId) {
        console.log(
          `[confirmPaymentAndUpdateBackend] Found mapping for productId ${productId}: orderId ${mapping.orderId}. Updating local status.`
        );
        // Gọi hàm có sẵn để cập nhật trạng thái trong localStorage
        updateLocalOrder(mapping.orderId, OrderStatus.TO_RECEIVE);
        updateCount++;
      } else {
        // Cảnh báo nếu không tìm thấy mapping (có thể xảy ra nếu mapping chưa được tạo đúng)
        console.warn(
          `[confirmPaymentAndUpdateBackend] Could not find mapping for cartId ${cartId} and productId ${productId}. Local status might not be updated immediately.`
        );
        // Bạn có thể thêm logic dự phòng ở đây nếu cần, ví dụ tìm trong pendingOrders dựa trên productId và cartId
      }
    }
    console.log(
      `[confirmPaymentAndUpdateBackend] Updated status for ${updateCount} items in local storage.`
    );

    return true;
  } catch (error) {
    console.error(
      "[confirmPaymentAndUpdateBackend] Network or unexpected error:",
      error
    );
    toast.error("Lỗi kết nối hoặc lỗi không xác định khi cập nhật thanh toán.");
    return false;
  }
};

export const createOrdersFromPaymentData = async (
  products: any[],
  customerName: string,
  customerAddress: string,
  cartIdFromPayment?: string
): Promise<OrderData[]> => {
  console.warn(
    "[createOrdersFromPaymentData] WARNING: This function only creates local order data. It does NOT interact with the backend '/orders' endpoint (which doesn't exist). Actual backend update happens via confirmPaymentAndUpdateBackend."
  );

  const currentCartIdBeforePayment = localStorage.getItem("currentCartId");
  let effectiveCartId: number | undefined;

  // Xác định cartId hiệu lực
  if (cartIdFromPayment && !isNaN(parseInt(cartIdFromPayment))) {
    effectiveCartId = parseInt(cartIdFromPayment);
    console.log(
      `[createOrdersFromPaymentData (Local)] Using cartId from payment context: ${effectiveCartId}`
    );
    // Cập nhật luôn currentCartId nếu có cartId mới từ thanh toán
    localStorage.setItem("currentCartId", effectiveCartId.toString());
  } else if (
    currentCartIdBeforePayment &&
    !isNaN(parseInt(currentCartIdBeforePayment))
  ) {
    effectiveCartId = parseInt(currentCartIdBeforePayment);
    console.log(
      `[createOrdersFromPaymentData (Local)] Using currentCartId from localStorage: ${effectiveCartId}`
    );
  } else {
    console.error(
      "[createOrdersFromPaymentData (Local)] Cannot determine a valid cartId. Cannot create local order data."
    );
    toast.error(
      "Lỗi: Không xác định được giỏ hàng để tạo dữ liệu đơn hàng cục bộ."
    );
    return [];
  }

  if (!products || products.length === 0) {
    console.error(
      "[createOrdersFromPaymentData (Local)] No products provided."
    );
    toast.error("Lỗi: Không có sản phẩm để tạo dữ liệu đơn hàng.");
    return [];
  }

  const newOrders: OrderData[] = [];

  try {
    products.forEach((product, index) => {
      const productId = Number(product.id);
      if (isNaN(productId) || productId <= 0) {
        console.warn(
          "[createOrdersFromPaymentData (Local)] Skipping product with invalid ID:",
          product
        );
        return;
      }
      const placeholderCartItemId = -(Date.now() + index);

      const orderId = `FE_ORD-${effectiveCartId}-${productId}-${placeholderCartItemId}`;

      const newOrder: OrderData = {
        orderId: orderId,
        cartItemId: placeholderCartItemId,
        cartId: effectiveCartId!,
        product: {
          id: productId,
          name: product.name || product.title || "Sản phẩm không tên",
          img: product.img || "/placeholder.png",
          price: Number(product.price) || 0,
          quantity: Number(product.quantity) || 1,
          weight: Number(product.weight) || 0,
          title: product.title,
        },
        customer: { name: customerName, address: customerAddress },
        orderStatus: OrderStatus.TO_RECEIVE,
      };
      newOrders.push(newOrder);

      saveOrderMapping(
        newOrder.orderId,
        newOrder.cartId,
        productId,
        newOrder.cartItemId
      );
    });

    if (newOrders.length > 0) {
      const existingOrders = getOrdersFromLocalStorage();
      const existingOrderIds = new Set(newOrders.map((o) => o.orderId));
      const filteredExistingOrders = existingOrders.filter(
        (o) => !existingOrderIds.has(o.orderId)
      );

      const combinedOrders = [...filteredExistingOrders, ...newOrders];
      saveOrderDataToLocalStorage(combinedOrders);
      console.log(
        `[createOrdersFromPaymentData (Local)] Successfully created ${newOrders.length} local orders and added/updated in pendingOrders.`
      );
    } else {
      console.warn(
        "[createOrdersFromPaymentData (Local)] No valid local orders were created."
      );
    }

    console.log(
      "[createOrdersFromPaymentData (Local)] Suggest calling synchronizeOrdersWithBackend() after this to get real cartItemIds."
    );

    return newOrders;
  } catch (error) {
    console.error(
      "[createOrdersFromPaymentData (Local)] Error during local order data creation:",
      error
    );
    toast.error(
      `Tạo dữ liệu đơn hàng cục bộ thất bại: ${
        error instanceof Error ? error.message : "Lỗi không xác định"
      }`
    );
    return [];
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
