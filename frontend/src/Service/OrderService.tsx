import axios from "./axios";
import { toast } from "react-toastify";

const API_URL = "/api";

export enum OrderStatus {
  TO_ORDER = "TO_ORDER",
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
  shop: {
    // <<< THÊM TRƯỜNG SHOP
    id: number;
    name: string;
  };
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
  const statusQuery = statuses.join(",");
  console.log(
    `[fetchOrdersByStatus] Fetching orders with statuses: ${statusQuery}`
  );

  if (!localStorage.getItem("token")) {
    console.error(
      "[fetchOrdersByStatus] No token found. User might not be logged in."
    );
    toast.error("Vui lòng đăng nhập để xem đơn hàng.");
    return [];
  }

  try {
    const response = await axios.get(
      `${API_URL}/cart-items/paid/by-status?statuses=${statusQuery}`
    ) as any;
    console.log(`[fetchOrdersByStatus] Raw data received:`, response);

    // Map dữ liệu backend sang cấu trúc OrderData của frontend
    const frontendOrders: OrderData[] = response
      ?.map((item: any) => {
        console.log(`[fetchOrdersByStatus] Processing item ID: ${item.id}`);
        console.log(`[fetchOrdersByStatus] Product data:`, item.product);
        console.log(
          `[fetchOrdersByStatus] Shop data within product:`,
          item.product?.shop
        );
        const orderId = `ORD-${item.id}`;

        return {
          orderId: orderId,
          cartItemId: item.id,
          cartId: item.cart?.id || 0,
          product: {
            id: item.product?.id || 0,
            name: item.product?.name || "N/A",
            img: item.product?.img || "/placeholder.png",
            price: Number(item.product?.price) || 0,
            quantity: Number(item.quantity) || 1,
            weight: Number(item.product?.weight) || 0,
            title: item.product?.name,
          },
          customer: {
            name: item.cart?.user?.name || "Khách hàng",
            address: item.cart?.user?.address || "Chưa cung cấp",
          },
          shop: {
            id: item.product?.shop?.id || 0,
            name: item.product?.shop?.name || "Cửa hàng không tên",
          },
          orderStatus: item.status || OrderStatus.TO_RECEIVE,
          cancelReason: item.cancelReason || undefined,
          isRated: !!item.rating,
        };
      })
      .filter((order: any) => order.cartItemId > 0 && order.product.id > 0);

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

export const fetchShopOrdersByStatus = async (
  statuses: OrderStatus[]
): Promise<OrderData[]> => {
  const statusQuery = statuses.join(",");
  console.log(
    `[fetchShopOrdersByStatus] Fetching SHOP orders with statuses: ${statusQuery}`
  );

  if (!localStorage.getItem("token")) {
    console.error(
      "[fetchShopOrdersByStatus] No token found. Shop owner might not be logged in."
    );
    toast.error("Vui lòng đăng nhập với tài khoản cửa hàng.");
    return [];
  }

  try {
    const response = await axios.get(
      `${API_URL}/cart-items/shop/by-status?statuses=${statusQuery}`
    ) as any;
    console.log(`[fetchShopOrdersByStatus] Raw data received:`, response);

    // Map dữ liệu backend sang cấu trúc OrderData
    const frontendOrders: OrderData[] = response
      .map((item: any) => {
        const orderId = `SHOP-ORD-${item.id}`;
        return {
          orderId: orderId,
          cartItemId: item.id,
          cartId: item.cart?.id || 0,
          product: {
            id: item.product?.id || 0,
            name: item.product?.name || "N/A",
            img: item.product?.img || "/placeholder.png",
            price: Number(item.product?.price) || 0,
            quantity: Number(item.quantity) || 1,
            weight: Number(item.product?.weight) || 0,
            title: item.product?.name,
          },
          customer: {
            name: item.cart?.user?.name || "Khách hàng",
            address: item.cart?.user?.address || "Chưa cung cấp",
          },
          shop: {
            id: item.shop?.id || 0,
            name: item.shop?.name || "Cửa hàng",
          },
          orderStatus: item.status || OrderStatus.TO_RECEIVE,
          cancelReason: item.cancelReason || undefined,
          isRated: !!item.rating,
        };
      })
      .filter((order: any) => order.cartItemId > 0 && order.product.id > 0);

    console.log(
      `[fetchShopOrdersByStatus] Mapped to frontend orders:`,
      frontendOrders
    );
    return frontendOrders;
  } catch (error) {
    console.error(`[fetchShopOrdersByStatus] Critical error:`, error);
    toast.error("Lỗi nghiêm trọng khi tải dữ liệu đơn hàng của shop.");
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

export const fetchAndUpdateOrders = async (): Promise<boolean> => {
  // Fetch based on the *last paid* cart ID if available, otherwise currentCartId
  const cartIdToFetch =
    localStorage.getItem("lastPaidCartId") ||
    localStorage.getItem("currentCartId");

  if (!cartIdToFetch || isNaN(parseInt(cartIdToFetch))) {
    console.warn(
      "[fetchAndUpdateOrders] No valid cartId found. Cannot fetch cart data."
    );
    return true;
  }

  const numericCartId = parseInt(cartIdToFetch);
  console.log(
    `[fetchAndUpdateOrders] Attempting to fetch orders for cartId: ${numericCartId}`
  );

  try {
    const cartItemsFromApi = await axios.get(
      `${API_URL}/cart-items/cart/${numericCartId}`
    );
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
      return false;
    }

    const newPendingOrders: OrderData[] = [];
    const newHistoryOrders: OrderData[] = [];
    const newMappingsForThisCart: OrderMapping[] = [];

    // Process items received from the API
    cartItemsFromApi.forEach((item: any) => {
      const backendCartItemId = item.id;
      const backendProductId = item.product?.id;
      const backendCartId = numericCartId;

      if (
        !backendCartItemId ||
        !backendProductId ||
        !backendCartId ||
        backendCartId <= 0 ||
        backendCartItemId <= 0 ||
        backendProductId <= 0
      ) {
        console.warn(
          "[fetchAndUpdateOrders] Skipping item due to missing or invalid IDs:",
          item
        );
        return;
      }

      const orderId = `FE_ORD-${backendCartId}-${backendCartItemId}`;

      const orderData: OrderData = {
        orderId: orderId,
        cartItemId: backendCartItemId,
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
          name: localStorage.getItem("customerName") || "Khách hàng",
          address: localStorage.getItem("customerAddress") || "Chưa cung cấp",
        },
        shop: {
          id: item.product?.shop?.id || 0,
          name: item.product?.shop?.name || "Cửa hàng không tên",
        },
        orderStatus: item.status as OrderStatus,
        cancelReason: item.cancelReason,
      };

      newMappingsForThisCart.push({
        orderId: orderData.orderId,
        cartId: orderData.cartId,
        productId: Number(orderData.product.id),
        cartItemId: orderData.cartItemId,
      });

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
        console.log(
          `[fetchAndUpdateOrders] Skipping item for local storage: cartItemId=${backendCartItemId}, isPaid=${item.isPaid}, status=${item.status}`
        );
      }
    });

    // Update Local Storage
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

    const finalPending = [...currentPending, ...newPendingOrders];
    const finalHistory = [...currentHistory, ...newHistoryOrders];
    const finalMappings = [...currentMappings, ...newMappingsForThisCart];

    const uniqueHistoryMap = new Map(
      finalHistory.map((order) => [order.orderId, order])
    );
    const uniqueFinalHistory = Array.from(uniqueHistoryMap.values());

    saveOrderDataToLocalStorage(finalPending);
    saveOrderHistoryToLocalStorage(uniqueFinalHistory);
    localStorage.setItem("orderMappings", JSON.stringify(finalMappings));

    console.log(
      `[fetchAndUpdateOrders] Updated local storage for cartId ${numericCartId}: ${newPendingOrders.length} pending, ${newHistoryOrders.length} history items added/updated.`
    );
    console.log(
      `[fetchAndUpdateOrders] Updated mappings for cartId ${numericCartId}: ${newMappingsForThisCart.length} mappings.`
    );

    return true;
  } catch (error) {
    console.error(
      `[fetchAndUpdateOrders] Critical error during fetch/processing for cartId ${numericCartId}:`,
      error
    );
    toast.error("Lỗi nghiêm trọng khi đồng bộ dữ liệu đơn hàng.");
    return false;
  }
};

export const synchronizeOrdersWithBackend = async (): Promise<boolean> => {
  console.log("[synchronizeOrdersWithBackend] Starting synchronization...");
  const success = await fetchAndUpdateOrders();
  if (success) {
    console.log(
      "[synchronizeOrdersWithBackend] Synchronization finished successfully."
    );
  } else {
    console.error(
      "[synchronizeOrdersWithBackend] Synchronization finished with errors."
    );
  }
  return success;
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

  if (!cartItemId || isNaN(cartItemId) || cartItemId <= 0) {
    console.error(
      `[updateOrderStatusOnBackend] Invalid cartItemId: ${cartItemId}. Cannot update.`
    );
    toast.error(`Lỗi: Mã định danh mục đơn hàng không hợp lệ (${cartItemId}).`);
    return false;
  }

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
    `[updateOrderStatusOnBackend] Calling PUT with body:`,
    JSON.stringify(requestBody)
  );

  try {
    await axios.put(
      `${API_URL}/cart-items/${cartItemId}/order-status`,
      requestBody
    );
    console.log("[updateOrderStatusOnBackend] Backend update successful");
    return true;
  } catch (error:any) {
    console.error("[updateOrderStatusOnBackend] Error:", error);

    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        toast.error(
          `Lỗi 404: Không tìm thấy mục đơn hàng với ID: ${cartItemId} trên máy chủ.`
        );
      } else if (status === 400) {
        toast.error(
          `Lỗi cập nhật trạng thái: ${
            error.response.data?.message || "Dữ liệu không hợp lệ."
          }`
        );
      } else if (status === 401 || status === 403) {
        toast.error(
          "Lỗi xác thực hoặc không có quyền cập nhật trạng thái đơn hàng này."
        );
      } else {
        toast.error(`Lỗi ${status} khi cập nhật trạng thái đơn hàng.`);
      }
    } else {
      toast.error(
        "Lỗi kết nối hoặc lỗi không xác định khi cập nhật trạng thái."
      );
    }

    return false;
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

  const payload = {
    isPaid: true,
    cartItemIds: paidCartItemIds,
  };

  try {
    await axios.put(`${API_URL}/cart-items/cart/${cartId}/status`, payload);
    console.log("[confirmPaymentAndUpdateBackend] Backend update successful");

    // Xóa cartId hiện tại sau khi thanh toán thành công
    localStorage.removeItem("currentCartId");
    localStorage.removeItem("cartId");
    localStorage.removeItem("cartUpdated");

    return true;
  } catch (error) {
    console.error("[confirmPaymentAndUpdateBackend] Error:", error);
    toast.error("Lỗi kết nối hoặc lỗi không xác định khi cập nhật backend.");
    return false;
  }
};

export const saveBuyAgainProduct = (product: any): void => {
  try {
    localStorage.setItem("buyAgainProduct", JSON.stringify(product));
    localStorage.setItem("isBuyNow", "true");
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
