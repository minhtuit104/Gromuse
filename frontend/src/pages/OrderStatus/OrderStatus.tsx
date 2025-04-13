import React, { useState, useEffect, useCallback } from "react";
import "./OrderStatus.css";
import Header from "../../layouts/Header/Header";
import ImgProductDefault from "../../assets/images/imagePNG/beef 1.png";
import IconCancel from "../../assets/images/icons/ic_ close.svg";
import IconStar from "../../assets/images/icons/ic_star.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import { useNavigate } from "react-router-dom";
import {
  getOrdersFromLocalStorage,
  getOrderHistoryFromLocalStorage,
  OrderData,
  OrderStatus,
  saveBuyAgainProduct,
  updateOrderStatusOnBackend,
  reconstructOrderMappings,
  getOrderDetails,
  synchronizeOrdersWithBackend,
} from "../../Service/OrderService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type TabType = "toReceive" | "completed" | "cancelled";

const OrderStatuss = () => {
  const [activeTab, setActiveTab] = useState<TabType>("toReceive");
  const [pendingOrders, setPendingOrders] = useState<OrderData[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderData[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<OrderData[]>([]);

  // Hàm tải dữ liệu đơn hàng từ localStorage
  const loadOrderData = useCallback(() => {
    // Thêm useCallback
    console.log(
      "[OrderStatus] Attempting to load all order data from localStorage..."
    );
    const allPending = getOrdersFromLocalStorage();
    const orderHistory = getOrderHistoryFromLocalStorage();

    const pendingOrdersList = allPending.filter(
      (order) => order.orderStatus === OrderStatus.TO_RECEIVE
    );
    const completedOrdersList = orderHistory.filter(
      (order) => order.orderStatus === OrderStatus.COMPLETE
    );
    const cancelledOrdersList = orderHistory.filter(
      (order) => order.orderStatus === OrderStatus.CANCEL_BYUSER
    );

    // Cập nhật state (có thể thêm kiểm tra thay đổi như OrderShop nếu muốn tối ưu)
    setPendingOrders(pendingOrdersList);
    setCompletedOrders(completedOrdersList);
    setCancelledOrders(cancelledOrdersList);
    console.log("[OrderStatus] Loaded data:", {
      pending: pendingOrdersList.length,
      completed: completedOrdersList.length,
      cancelled: cancelledOrdersList.length,
    });
  }, []); // useCallback vì nó không phụ thuộc state/props khác

  // Thêm interval để liên tục cập nhật dữ liệu
  useEffect(() => {
    console.log("[OrderStatus] Component mounted. Initializing...");
    reconstructOrderMappings();

    const syncAndLoad = () => {
      console.log("[OrderStatus] Starting syncAndLoad...");
      synchronizeOrdersWithBackend()
        .then((syncSuccess) => {
          if (syncSuccess) {
            console.log("[OrderStatus] Sync successful.");
          } else {
            console.warn(
              "[OrderStatus] Sync failed, loading local data anyway."
            );
          }
          // Luôn tải dữ liệu sau khi đồng bộ (thành công hoặc thất bại)
          loadOrderData();
        })
        .catch((error) => {
          console.error("[OrderStatus] Error during sync/load:", error);
          toast.error("Lỗi khi đồng bộ hoặc tải đơn hàng.");
          // Vẫn thử tải dữ liệu local nếu sync lỗi
          loadOrderData();
        });
    };

    // Chạy lần đầu
    syncAndLoad();

    // Thiết lập interval
    console.log("[OrderStatus] Setting up polling interval (5 seconds)...");
    const intervalId = setInterval(syncAndLoad, 5000);

    // Cleanup
    return () => {
      console.log("[OrderStatus] Component unmounting. Clearing interval.");
      clearInterval(intervalId);
    };
  }, [loadOrderData]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="order-status-container">
      <Header />
      <div className="three-tab-status">
        <div className="tab-header-status">
          <div
            className={`tab-item-status ${
              activeTab === "toReceive" ? "active" : ""
            }`}
            onClick={() => handleTabChange("toReceive")}
          >
            To Receive
          </div>
          <div className="vertical_line">|</div>
          <div
            className={`tab-item-status ${
              activeTab === "completed" ? "active" : ""
            }`}
            onClick={() => handleTabChange("completed")}
          >
            Completed
          </div>
          <div className="vertical_line">|</div>
          <div
            className={`tab-item-status ${
              activeTab === "cancelled" ? "active" : ""
            }`}
            onClick={() => handleTabChange("cancelled")}
          >
            Cancelled
          </div>
        </div>
        <div className="tab-content-status">
          {activeTab === "toReceive" && (
            <ToReceiveTab
              orders={pendingOrders}
              onOrderUpdate={loadOrderData}
            />
          )}
          {activeTab === "completed" && (
            <CompletedTab orders={completedOrders} />
          )}
          {activeTab === "cancelled" && (
            <CancelledTab orders={cancelledOrders} />
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

interface OrderTabProps {
  orders: OrderData[];
  onOrderUpdate?: () => void;
}

const ToReceiveTab: React.FC<OrderTabProps> = ({ orders }) => {
  const [showCancelInputs, setShowCancelInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const [cancelReasons, setCancelReasons] = useState<{ [key: string]: string }>(
    {}
  );

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10);

  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Xử lý thay đổi trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý chuyển đến trang tiếp theo
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Xử lý chuyển đến trang trước
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleCancelClick = (orderId: string) => {
    setShowCancelInputs((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleReasonChange = (orderId: string, reason: string) => {
    setCancelReasons((prev) => ({
      ...prev,
      [orderId]: reason,
    }));
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = cancelReasons[orderId] || "Người dùng hủy đơn hàng";

    try {
      if (!reason.trim()) {
        toast.warning("Vui lòng cung cấp lý do hủy đơn hàng");
        return;
      }

      const toastId = toast.loading("Đang hủy đơn hàng của bạn...");

      console.log(`Đang hủy đơn hàng ${orderId} với lý do: ${reason}`);

      // Get current order details for debugging (đã có)
      const details = getOrderDetails(orderId);
      console.log(
        `Thông tin đơn hàng trước khi hủy: cartId=${details.cartId}, productId=${details.productId}`
      );

      const backendSuccess = await updateOrderStatusOnBackend(
        orderId,
        OrderStatus.CANCEL_BYUSER,
        reason
      );
      // -----------------------------

      if (backendSuccess) {
        toast.update(toastId, {
          render: "Đơn hàng của bạn đã được hủy",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });

        // Xóa inputs (đã có)
        setShowCancelInputs((prev) => {
          const newState = { ...prev };
          delete newState[orderId];
          return newState;
        });
        setCancelReasons((prev) => {
          const newReasons = { ...prev };
          delete newReasons[orderId];
          return newReasons;
        });
      } else {
        toast.update(toastId, {
          render: "Không thể hủy đơn hàng của bạn. Vui lòng thử lại sau!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      // Xử lý lỗi không mong muốn (đã có)
      console.error("Lỗi khi cập nhật trạng thái:", error);
      toast.error("Đã xảy ra lỗi khi hủy đơn hàng!");
    }
  };

  return (
    <div className="order-list-status">
      {orders.length === 0 ? (
        <div className="no-orders-status">
          <p>Không có đơn hàng nào đang được xử lý</p>
        </div>
      ) : (
        <>
          {currentOrders.map((order) => (
            <div key={order.orderId} className="order-wrapper">
              <OrderItem
                order={order}
                showCancelButton={true}
                onCancelOrder={() => handleCancelClick(order.orderId)}
                expanded={showCancelInputs[order.orderId]}
              />
              {showCancelInputs[order.orderId] && (
                <div className="cancel-reason-container-status">
                  <input
                    type="text"
                    className="cancel-reason-input-status"
                    placeholder="Nhập lý do hủy đơn hàng"
                    value={cancelReasons[order.orderId] || ""}
                    onChange={(e) =>
                      handleReasonChange(order.orderId, e.target.value)
                    }
                  />
                  <button
                    className="send-reason-button-status"
                    onClick={() => handleCancelOrder(order.orderId)}
                  >
                    <img src={IconSend} alt="Send" className="ic_28" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Thêm thanh phân trang */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`pagination-button ${
                  currentPage === 1 ? "disabled" : ""
                }`}
              >
                &laquo;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination-button ${
                      currentPage === number ? "active" : ""
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`pagination-button ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CompletedTab: React.FC<OrderTabProps> = ({ orders }) => {
  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10); // Số đơn hàng mỗi trang

  // Tính toán số trang và đơn hàng hiện tại
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Xử lý thay đổi trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý chuyển đến trang tiếp theo
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Xử lý chuyển đến trang trước
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="order-list-status">
      {orders.length === 0 ? (
        <div className="no-orders-status">
          <p>Chưa có đơn hàng nào đã hoàn thành</p>
        </div>
      ) : (
        <>
          {currentOrders.map((order) => (
            <OrderItem
              key={order.orderId}
              order={order}
              showRateButton={true}
            />
          ))}

          {/* Thêm thanh phân trang */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`pagination-button ${
                  currentPage === 1 ? "disabled" : ""
                }`}
              >
                &laquo;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination-button ${
                      currentPage === number ? "active" : ""
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`pagination-button ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CancelledTab: React.FC<OrderTabProps> = ({ orders }) => {
  const cancelledOrders = orders.filter(
    (order) =>
      order.orderStatus === OrderStatus.CANCEL_BYUSER ||
      order.orderStatus === OrderStatus.CANCEL_BYSHOP
  );

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10); // Số đơn hàng mỗi trang

  // Tính toán số trang và đơn hàng hiện tại
  const totalPages = Math.ceil(cancelledOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = cancelledOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Xử lý thay đổi trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Xử lý chuyển đến trang tiếp theo
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Xử lý chuyển đến trang trước
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="order-list-status">
      {cancelledOrders.length === 0 ? (
        <div className="no-orders-status">
          <p>Không có đơn hàng nào đã bị hủy</p>
        </div>
      ) : (
        <>
          {currentOrders.map((order) => (
            <OrderItem
              key={order.orderId}
              order={order}
              showBuyAgainButton={true}
            />
          ))}

          {/* Thêm thanh phân trang */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`pagination-button ${
                  currentPage === 1 ? "disabled" : ""
                }`}
              >
                &laquo;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination-button ${
                      currentPage === number ? "active" : ""
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`pagination-button ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface OrderItemProps {
  order: OrderData;
  showCancelButton?: boolean;
  showRateButton?: boolean;
  showBuyAgainButton?: boolean;
  onCancelOrder?: (orderId: string) => void;
  expanded?: boolean; // Thêm thuộc tính expanded
}

const OrderItem: React.FC<OrderItemProps> = ({
  order,
  showCancelButton,
  showRateButton,
  showBuyAgainButton,
  onCancelOrder,
  expanded,
}) => {
  const navigate = useNavigate();
  // Xử lý việc hiển thị giá gốc (nếu có)
  const originalPrice = order.product.price * 1.15 * order.product.quantity;
  const currentPrice = order.product.price * order.product.quantity;

  const handleCancelClick = () => {
    if (onCancelOrder) {
      onCancelOrder(order.orderId);
    }
  };

  // Xử lý khi người dùng nhấn nút Rate
  const handleRateClick = () => {
    navigate("/rating_product");
  };

  // Xử lý khi người dùng nhấn nút Buy Again
  const handleBuyAgainClick = async () => {
    try {
      const buyAgainProduct = {
        id: order.product.id,
        name: order.product.name,
        img: order.product.img || ImgProductDefault,
        title: order.product.title || order.product.name,
        weight: order.product.weight || 0,
        price: order.product.price,
      };

      // Sử dụng service để lưu sản phẩm
      saveBuyAgainProduct(buyAgainProduct);

      toast.info("Đang chuyển đến trang thanh toán...");

      // Tạo cartId tạm thời cho quá trình mua lại
      localStorage.setItem("cartId", "buyAgain_" + Date.now());
      localStorage.setItem("isBuyNow", "true");

      // Kiểm tra xem có cần tạo giỏ hàng mới ở backend không
      if (typeof order.product.id === "number") {
        try {
          // Gọi API để tạo giỏ hàng mua ngay
          const response = await fetch("http://localhost:3000/cart/buy-now", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: order.product.id,
              quantity: order.product.quantity || 1,
            }),
            credentials: "include",
          });

          if (!response.ok) {
            console.error(
              "Không thể tạo giỏ hàng mua ngay:",
              await response.text()
            );
          } else {
            const result = await response.json();
            if (result.cartId) {
              localStorage.setItem("cartId", result.cartId.toString());
              console.log("Đã tạo giỏ hàng mới với ID:", result.cartId);
            }
          }
        } catch (error) {
          console.error("Lỗi khi tạo giỏ hàng mua ngay:", error);
          // Tiếp tục với cartId tạm thời nếu API gặp lỗi
        }
      }

      // Chuyển hướng đến trang thanh toán
      setTimeout(() => {
        window.location.href = "/payment";
      }, 800);
    } catch (error) {
      console.error("Lỗi khi xử lý mua lại:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  return (
    <div className={`order-item-status ${expanded ? "expanded" : ""}`}>
      <div className="item-content-status">
        <div className="product-image-status">
          <img
            src={order.product.img || ImgProductDefault}
            alt={order.product.name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = ImgProductDefault;
            }}
          />
        </div>
        <div className="product-info-status">
          <div className="product-title-status">{order.product.name}</div>
          <div className="product-quantity-status">
            x{order.product.quantity}
          </div>
        </div>
        <div className="product-price-status">
          {showCancelButton && (
            <div className="original-price-status">
              ${originalPrice.toFixed(0)}
            </div>
          )}
          <div className="current-price-status">${currentPrice.toFixed(0)}</div>
        </div>
      </div>
      <div className="item-actions-status">
        {showCancelButton && (
          <button className="cancel-button-status" onClick={handleCancelClick}>
            <span className="cancel-icon-status">
              <img src={IconCancel} alt="IconCancel" className="ic_20" />
            </span>
            Cancel
          </button>
        )}
        {showRateButton && (
          <button className="rate-button-status" onClick={handleRateClick}>
            <span className="star-icon-status">
              <img src={IconStar} alt="IconStar" className="ic_20" />
            </span>
            Rate
          </button>
        )}
        {showBuyAgainButton && (
          <button
            className="buy-again-button-status"
            onClick={handleBuyAgainClick}
          >
            <span className="cart-icon-status">
              <img src={IconCart} alt="IconCart" className="ic_20" />
            </span>
            Buy again
          </button>
        )}
      </div>
      {order.cancelReason &&
        (order.orderStatus === OrderStatus.CANCEL_BYUSER ||
          order.orderStatus === OrderStatus.CANCEL_BYSHOP) && (
          <div className="cancel-reason-status">
            <span className="cancel-reason-label">
              {order.orderStatus === OrderStatus.CANCEL_BYSHOP
                ? "Lý do hủy bởi cửa hàng:"
                : "Lý do hủy bởi người dùng:"}
            </span>{" "}
            {order.cancelReason}
          </div>
        )}
    </div>
  );
};

export default OrderStatuss;
