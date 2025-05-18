import React, { useState, useEffect, useCallback } from "react";
import HeaderDashboard from "../../../pages/DashboardPage/Header/HeaderDashboard";
import { useNavigate } from "react-router-dom";
import "./OrderShop.css";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";
import IconCheck from "../../../assets/images/icons/ic_ check.svg";
import IconClose from "../../../assets/images/icons/ic_ close.svg";
import IconSend from "../../../assets/images/icons/ic_ send.svg";
import OrderEmptyImage from "../../../assets/images/imagePNG/order_empty.png";
import ImgProductDefault from "../../../assets/images/imagePNG/banana 1.png";
import {
  OrderData,
  OrderStatus,
  fetchShopOrdersByStatus,
  fetchShopOrderStatusCounts,
  updateOrderStatusOnBackend,
} from "../../../Service/OrderService";
import { toast, ToastContainer } from "react-toastify";

const OrderShop = () => {
  const [orders, setOrders] = useState<OrderData[]>([]); // State chứa đơn hàng TO_RECEIVE
  const [isLoading, setIsLoading] = useState(false); // State loading
  const [cancelReasons, setCancelReasons] = useState<{ [key: string]: string }>(
    {}
  );
  const [showCancelInputs, setShowCancelInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const navigate = useNavigate();

  // State to hold counts for all tabs
  const [statusCounts, setStatusCounts] = useState<{
    [key in OrderStatus]?: number;
  }>({});

  // State và logic phân trang giữ nguyên
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10);
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Hàm fetch đơn hàng TO_RECEIVE từ API
  const loadPendingOrders = useCallback(async () => {
    setIsLoading(true);
    console.log("[OrderShop] Loading TO_RECEIVE orders from API...");
    try {
      // Chỉ fetch các đơn hàng có trạng thái TO_RECEIVE
      const pending = await fetchShopOrdersByStatus([OrderStatus.TO_ORDER]);
      setOrders(pending); // Cập nhật state
      console.log(`[OrderShop] Loaded ${pending.length} pending orders.`);
    } catch (error) {
      console.error("[OrderShop] Error loading pending orders:", error);
      // toast.error(...) đã có trong service
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback không có dependencies

  // Hàm fetch số lượng đơn hàng cho các tab
  const loadStatusCounts = useCallback(async () => {
    console.log("[OrderShop] Loading status counts...");
    try {
      const counts = await fetchShopOrderStatusCounts();
      setStatusCounts(counts);
      console.log("[OrderShop] Loaded status counts:", counts);
    } catch (error) {
      console.error("[OrderShop] Error loading status counts:", error);
      // Toast handled in service
    }
  }, []);

  // Load dữ liệu khi component mount
  useEffect(() => {
    console.log("[OrderShop] Component mounted. Initial load...");
    loadPendingOrders();
    loadStatusCounts(); // Load counts on mount
  }, [loadPendingOrders, loadStatusCounts]); // Phụ thuộc loadPendingOrders và loadStatusCounts


  // Đảm bảo currentPage không vượt quá totalPages khi orders thay đổi
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Hàm xử lý khi nhấn nút Close (mở/đóng input hủy)
  const handleCloseClick = (orderId: string) => {
    setShowCancelInputs((prev) => ({
      ...prev,
      [orderId]: !prev[orderId], // Toggle hiển thị input
    }));
    // Reset lý do khi đóng input
    if (showCancelInputs[orderId]) {
      setCancelReasons((prev) => {
        const newReasons = { ...prev };
        delete newReasons[orderId];
        return newReasons;
      });
    }
  };

  // --- Xử lý chấp nhận đơn hàng (chuyển sang COMPLETE) ---
  const handleAcceptOrder = async (order: OrderData) => {
    // *** THAY ĐỔI: Nhận cả order object ***
    const cartItemId = order.cartItemId; // *** Lấy cartItemId ***

    // Validate cartItemId
    if (!cartItemId || cartItemId <= 0) {
      toast.error("Lỗi: Không tìm thấy mã định danh hợp lệ để xác nhận.");
      console.error("[OrderShop] Invalid cartItemId for acceptance:", order);
      return;
    }

    const toastId = toast.loading("Đang xác nhận hoàn thành đơn hàng...");
    console.log(
      `[OrderShop] Attempting accept (COMPLETE) for cartItemId: ${cartItemId}`
    );

    try {
      // Gọi hàm update đã sửa, truyền cartItemId và status COMPLETE
      const backendSuccess = await updateOrderStatusOnBackend(
        cartItemId,
        OrderStatus.TO_RECEIVE // Trạng thái mới là COMPLETE
      );

      if (backendSuccess) {
        toast.update(toastId, {
          render: "Đơn hàng đã được chuyển sang hoàn thành!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        // Gọi lại hàm fetch để cập nhật danh sách
        loadPendingOrders();
      } else {
        // Lỗi đã được toast trong service
        toast.update(toastId, {
          render: "Không thể xác nhận đơn hàng. Vui lòng thử lại.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("[OrderShop] Unexpected error during acceptance:", error);
      toast.update(toastId, {
        render: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // --- Xử lý hủy đơn hàng (bởi Shop) ---
  const handleCancelOrder = async (order: OrderData) => {
    // *** THAY ĐỔI: Nhận cả order object ***
    const reason = cancelReasons[order.orderId] || ""; // Lấy lý do từ state
    const cartItemId = order.cartItemId; // *** Lấy cartItemId ***

    // Validate reason
    if (!reason.trim()) {
      toast.warning("Vui lòng nhập lý do hủy đơn hàng.");
      return;
    }
    // Validate cartItemId
    if (!cartItemId || cartItemId <= 0) {
      toast.error("Lỗi: Không tìm thấy mã định danh hợp lệ để hủy.");
      console.error("[OrderShop] Invalid cartItemId for cancellation:", order);
      return;
    }

    const toastId = toast.loading("Đang xử lý hủy đơn hàng...");
    console.log(
      `[OrderShop] Attempting cancel (CANCEL_BYSHOP) for cartItemId: ${cartItemId} with reason: ${reason}`
    );

    try {
      // Gọi hàm update đã sửa, truyền cartItemId, status CANCEL_BYSHOP và reason
      const backendSuccess = await updateOrderStatusOnBackend(
        cartItemId,
        OrderStatus.CANCEL_BYSHOP, // Trạng thái hủy bởi shop
        reason
      );

      if (backendSuccess) {
        toast.update(toastId, {
          render: "Đơn hàng đã được hủy thành công.",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });

        // Đóng input và xóa lý do khỏi state
        setShowCancelInputs((prev) => {
          const newState = { ...prev };
          delete newState[order.orderId];
          return newState;
        });
        setCancelReasons((prev) => {
          const newReasons = { ...prev };
          delete newReasons[order.orderId];
          return newReasons;
        });

        // Gọi lại hàm fetch để cập nhật danh sách
        loadPendingOrders();
      } else {
        // Lỗi đã được toast trong service
        toast.update(toastId, {
          render: "Không thể hủy đơn hàng. Vui lòng thử lại.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("[OrderShop] Unexpected error during cancellation:", error);
      toast.update(toastId, {
        render: "Đã xảy ra lỗi không mong muốn khi hủy. Vui lòng thử lại.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // Hàm cập nhật state lý do hủy (giữ nguyên)
  const handleReasonChange = (orderId: string, reason: string) => {
    setCancelReasons((prev) => ({
      ...prev,
      [orderId]: reason,
    }));
  };

  // Hàm chuyển hướng đến các tab (giữ nguyên)
  const handleHistoryClick = () => navigate("/order_history");
  const handleCancelledClick = () => navigate("/order_cancel");

  // Xử lý phân trang (giữ nguyên)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Định dạng giá tiền (giữ nguyên)
  const formatPrice = (price: number, quantity: number = 1) => {
    return `$${(price * quantity).toFixed(0)}`;
  };

  return (
    <div className="order_container">
      <HeaderDashboard />
      <div className="order_history">
        {/* Phần Tabs (giữ nguyên) */}
        {/* === ĐẢM BẢO BẠN CẬP NHẬT ĐÚNG PHẦN NÀY === */}
        <div className="tabs">
          <div className="tab active">
            Orders ({statusCounts[OrderStatus.TO_ORDER] ?? 0}) {/* Sửa ở đây */}
          </div>
          <div className="tab inactive" onClick={handleHistoryClick}>
            History ({statusCounts[OrderStatus.COMPLETE] ?? 0}){" "}
            {/* Thêm số lượng */}
          </div>
          <div className="tab inactive" onClick={handleCancelledClick}>
            Cancelled ({statusCounts[OrderStatus.CANCEL_BYSHOP] ?? 0}){" "}
            {/* Thêm số lượng */}
          </div>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="order-list">
          {/* Hiển thị loading */}
          {isLoading && (
            <div className="loading-indicator">Đang tải đơn hàng...</div>
          )}

          {/* Hiển thị khi không có đơn hàng */}
          {!isLoading && orders.length === 0 && (
            <div className="no-orders-status">
              <img
                src={OrderEmptyImage}
                alt="No orders"
                className="no-orders-image"
              />
              <p className="no-orders-message">Have no data!!!</p>
            </div>
          )}

          {/* Hiển thị danh sách đơn hàng */}
          {!isLoading && orders.length > 0 && (
            <>
              {currentOrders.map((order, index) => (
                <React.Fragment key={order.orderId}>
                  <div
                    className={`order-item ${
                      showCancelInputs[order.orderId] ? "expanded" : ""
                    }`}
                  >
                    <div className="product-image">
                      <img
                        src={order.product.img || ImgProductDefault}
                        alt={order.product.name}
                        className="ic_48"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = ImgProductDefault;
                        }}
                      />
                    </div>
                    <div className="product-info-orderShop">
                      <div className="product-name-shop">
                        {order.product.name}
                      </div>
                      <div className="product-quantity">
                        x{order.product.quantity}
                      </div>
                    </div>
                    <img
                      src={IconArrowRight}
                      alt="IconArrowRight"
                      className="ic_20 arrow_right-orderShop"
                    />
                    <div className="customer-info">
                      <div className="customer-name">{order.customer.name}</div>
                      <div className="customer-address">
                        {order.customer.address}
                      </div>
                    </div>

                    <div className="price-info">
                      <div className="old-price">
                        {formatPrice(
                          order.product.price * 1.15,
                          order.product.quantity
                        )}
                      </div>
                      <div className="new-price">
                        {formatPrice(
                          order.product.price,
                          order.product.quantity
                        )}
                      </div>
                    </div>

                    <div className="action-button">
                      <div
                        className="icon_check"
                        onClick={() => handleAcceptOrder(order)}
                        title="Xác nhận hoàn thành"
                      >
                        <img
                          src={IconCheck}
                          alt="Accept Order"
                          className="ic_28"
                        />
                      </div>
                      <div
                        className="icon_close"
                        onClick={() => handleCloseClick(order.orderId)}
                        title={
                          showCancelInputs[order.orderId]
                            ? "Đóng ô hủy"
                            : "Hủy đơn hàng"
                        }
                      >
                        <img
                          src={IconClose}
                          alt="Cancel Order"
                          className="ic_24"
                        />
                      </div>
                    </div>

                    {showCancelInputs[order.orderId] && (
                      <div className="cancel-reason-container">
                        <input
                          type="text"
                          className="cancel-reason-input"
                          placeholder="Nhập lý do hủy..."
                          value={cancelReasons[order.orderId] || ""}
                          onChange={(e) =>
                            handleReasonChange(order.orderId, e.target.value)
                          }
                          autoFocus
                        />
                        <button
                          className="send-reason-button"
                          onClick={() => handleCancelOrder(order)}
                          title="Gửi lý do và hủy"
                          disabled={!cancelReasons[order.orderId]?.trim()}
                        >
                          <img
                            src={IconSend}
                            alt="Send Reason"
                            className="ic_28 send-icon"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                  {index < currentOrders.length - 1 && (
                    <div className="order-card-line"></div>
                  )}
                </React.Fragment>
              ))}

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
      </div>
    </div>
  );
};

export default OrderShop;
