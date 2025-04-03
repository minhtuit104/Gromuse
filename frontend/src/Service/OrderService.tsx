import { Product } from "../pages/PaymentPages/paymentItem";

export interface OrderData {
  orderId: string;
  product: {
    id: string;
    name: string;
    img: string;
    price: number;
    quantity: number;
  };
  customer: {
    name: string;
    address: string;
  };
  orderStatus: "pending" | "completed" | "cancelled";
  cancelReason?: string;
}

export const saveOrderDataToLocalStorage = (newOrderData: OrderData[]) => {
  // Lưu danh sách mới vào localStorage (thay thế hoàn toàn, không kết hợp)
  localStorage.setItem("pendingOrders", JSON.stringify(newOrderData));
};

export const getOrdersFromLocalStorage = (): OrderData[] => {
  const orders = localStorage.getItem("pendingOrders");
  return orders ? JSON.parse(orders) : [];
};

export const createOrdersFromPaymentData = (
  products: Product[],
  customerName: string,
  customerAddress: string
): OrderData[] => {
  // Tạo đơn hàng mới từ sản phẩm trong giỏ hàng
  const newOrders: OrderData[] = products.map((product) => ({
    orderId: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    product: {
      id: product.id,
      name: product.name || product.title,
      img: product.img,
      price: product.price,
      quantity: product.amount,
    },
    customer: {
      name: customerName,
      address: customerAddress,
    },
    orderStatus: "pending" as "pending" | "completed" | "cancelled",
  }));

  // Lấy danh sách đơn hàng hiện có
  const existingOrders = getOrdersFromLocalStorage();

  // Kết hợp danh sách đơn hàng hiện có với đơn hàng mới
  const combinedOrders = [...existingOrders, ...newOrders];

  // Lưu danh sách kết hợp vào localStorage
  saveOrderDataToLocalStorage(combinedOrders);

  return newOrders;
};

// Cập nhật hàm updateOrderStatus để di chuyển đơn hàng sang lịch sử
export const updateOrderStatus = (
  orderId: string,
  newStatus: "pending" | "completed" | "cancelled",
  cancelReason?: string
): boolean => {
  const orders = getOrdersFromLocalStorage();
  let orderToMove: OrderData | undefined;

  // Tìm và xóa đơn hàng khỏi danh sách đơn hàng đang xử lý
  const updatedOrders = orders.filter((order) => {
    if (order.orderId === orderId) {
      orderToMove = {
        ...order,
        orderStatus: newStatus,
        cancelReason: cancelReason || order.cancelReason,
      };
      return false; // Loại bỏ khỏi danh sách đang xử lý
    }
    return true;
  });

  // Lưu danh sách đơn hàng đã cập nhật
  saveOrderDataToLocalStorage(updatedOrders);

  // Nếu trạng thái là completed hoặc cancelled, thêm vào lịch sử
  if (orderToMove && (newStatus === "completed" || newStatus === "cancelled")) {
    const history = getOrderHistoryFromLocalStorage();
    history.unshift(orderToMove); // Thêm vào đầu danh sách lịch sử
    saveOrderHistoryToLocalStorage(history);
  }

  return true;
};

// Thêm hàm lấy lịch sử đơn hàng từ localStorage
export const getOrderHistoryFromLocalStorage = (): OrderData[] => {
  const history = localStorage.getItem("orderHistory");
  return history ? JSON.parse(history) : [];
};

// Thêm hàm lưu lịch sử đơn hàng vào localStorage
export const saveOrderHistoryToLocalStorage = (historyData: OrderData[]) => {
  localStorage.setItem("orderHistory", JSON.stringify(historyData));
};

// Thêm hàm mới để kiểm tra và xóa các đơn hàng trùng lặp
export const cleanupDuplicateOrders = () => {
  const orders = getOrdersFromLocalStorage();

  // Sử dụng Set để theo dõi orderId đã xuất hiện
  const seenOrderIds = new Set<string>();
  const uniqueOrders: OrderData[] = [];

  // Chỉ giữ lại các đơn hàng có orderId duy nhất
  orders.forEach((order) => {
    if (!seenOrderIds.has(order.orderId)) {
      seenOrderIds.add(order.orderId);
      uniqueOrders.push(order);
    }
  });

  // Lưu lại danh sách không có đơn hàng trùng lặp
  if (uniqueOrders.length !== orders.length) {
    saveOrderDataToLocalStorage(uniqueOrders);
  }

  return uniqueOrders;
};
