import React, { useState, useEffect, useCallback } from "react";
import "./OrderStatus.css";
import Header from "../../layouts/Header/Header";
import ImgProductDefault from "../../assets/images/imagePNG/beef 1.png";
import IconCancel from "../../assets/images/icons/ic_ close.svg";
import IconStar from "../../assets/images/icons/ic_star.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import IconView from "../../assets/images/icons/ic_eye.svg";
import { useNavigate } from "react-router-dom";
import {
  OrderData,
  OrderStatus,
  fetchOrdersByStatus,
  updateOrderStatusOnBackend,
} from "../../Service/OrderService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import { OrderItem } from "./RatingProduct/OrderItem";

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}

type TabType = "toReceive" | "completed" | "cancelled";

const OrderStatuss = () => {
  const [activeTab, setActiveTab] = useState<TabType>("toReceive");
  const [pendingOrders, setPendingOrders] = useState<OrderData[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OrderData[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hàm fetch dữ liệu cho tab hiện tại từ API
  const loadDataForTab = useCallback(async (tab: TabType) => {
    setIsLoading(true);
    console.log(`[OrderStatus] Loading data for tab: ${tab} from API...`);
    try {
      let orders: OrderData[] = [];
      if (tab === "toReceive") {
        orders = await fetchOrdersByStatus([OrderStatus.TO_RECEIVE]);
        setPendingOrders(orders);
      } else if (tab === "completed") {
        orders = await fetchOrdersByStatus([OrderStatus.COMPLETE]);
        setCompletedOrders(orders);
      } else if (tab === "cancelled") {
        // Lấy cả 2 loại hủy
        orders = await fetchOrdersByStatus([
          OrderStatus.CANCEL_BYUSER,
          OrderStatus.CANCEL_BYSHOP,
        ]);
        // Lọc lại chỉ lấy CANCEL_BYUSER cho tab này (nếu muốn tách bạch)
        const userCancelled = orders.filter(
          (o) => o.orderStatus === OrderStatus.CANCEL_BYUSER
        );
        setCancelledOrders(userCancelled);
        console.log(
          `[OrderStatus] Filtered user cancelled orders:`,
          userCancelled.length
        );
      }
      console.log(
        `[OrderStatus] Loaded ${orders.length} orders for tab ${tab}`
      );
    } catch (error) {
      console.error(`[OrderStatus] Error loading data for tab ${tab}:`, error);
      // toast.error(...) đã có trong service
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback không phụ thuộc gì khác

  // Load dữ liệu khi component mount hoặc tab thay đổi
  useEffect(() => {
    console.log(
      `[OrderStatus] Tab changed to ${activeTab} or component mounted. Loading data...`
    );
    loadDataForTab(activeTab);
  }, [activeTab, loadDataForTab]); // Phụ thuộc activeTab và loadDataForTab

  // Thêm listener để fetch lại khi focus (tùy chọn, nhưng hữu ích)
  useEffect(() => {
    const handleFocus = () => {
      console.log(
        "[OrderStatus] Window focused, reloading data for current tab..."
      );
      loadDataForTab(activeTab); // Gọi lại hàm fetch
    };
    window.addEventListener("focus", handleFocus);
    console.log("[OrderStatus] Added focus event listener.");

    // Cleanup function
    return () => {
      console.log("[OrderStatus] Component unmounting.");
      window.removeEventListener("focus", handleFocus); // Remove focus listener
      console.log("[OrderStatus] Removed focus event listener.");
    };
  }, [activeTab, loadDataForTab]); // Phụ thuộc activeTab và loadDataForTab

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // useEffect sẽ tự động gọi loadDataForTab khi activeTab thay đổi
  };

  // Hàm callback để load lại dữ liệu sau khi update thành công
  const handleOrderUpdate = () => {
    console.log(
      "[OrderStatus] Order updated, reloading data for current tab..."
    );
    loadDataForTab(activeTab); // Gọi lại hàm fetch cho tab hiện tại
  };

  return (
    <div className="order-status-container">
      <Header />
      <div className="three-tab-status">
        {/* Tab Header giữ nguyên */}
        <div className="tab-header-status">
          <div
            className={`tab-item-status ${
              activeTab === "toReceive" ? "active" : ""
            }`}
            onClick={() => handleTabChange("toReceive")}
          >
            To Receive ({pendingOrders.length}) {/* Hiển thị số lượng */}
          </div>
          <div className="vertical_line">|</div>
          <div
            className={`tab-item-status ${
              activeTab === "completed" ? "active" : ""
            }`}
            onClick={() => handleTabChange("completed")}
          >
            Completed ({completedOrders.length}) {/* Hiển thị số lượng */}
          </div>
          <div className="vertical_line">|</div>
          <div
            className={`tab-item-status ${
              activeTab === "cancelled" ? "active" : ""
            }`}
            onClick={() => handleTabChange("cancelled")}
          >
            Cancelled ({cancelledOrders.length}) {/* Hiển thị số lượng */}
          </div>
        </div>
        {/* Tab Content */}
        <div className="tab-content-status">
          {isLoading && <div className="loading-indicator">Đang tải...</div>}
          {!isLoading && activeTab === "toReceive" && (
            <ToReceiveTab
              orders={pendingOrders}
              onOrderUpdate={handleOrderUpdate} // Truyền callback để load lại
            />
          )}
          {!isLoading && activeTab === "completed" && (
            <CompletedTab orders={completedOrders} />
          )}
          {!isLoading && activeTab === "cancelled" && (
            <CancelledTab orders={cancelledOrders} />
          )}
        </div>
      </div>
      {/* ToastContainer giữ nguyên */}
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

// --- Props cho các Tab Component ---
interface OrderTabProps {
  orders: OrderData[];
  onOrderUpdate?: () => void; // Callback để báo cho cha load lại (chỉ cần cho ToReceiveTab)
}

// --- Sửa ToReceiveTab ---
const ToReceiveTab: React.FC<OrderTabProps> = ({ orders, onOrderUpdate }) => {
  const [showCancelInputs, setShowCancelInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const [cancelReasons, setCancelReasons] = useState<{ [key: string]: string }>(
    {}
  );

  // State và logic phân trang giữ nguyên
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10);
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage)); // Đảm bảo totalPages >= 1
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Đảm bảo currentPage không vượt quá totalPages khi orders thay đổi
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Hàm xử lý khi nhấn nút Cancel trên OrderItem
  const handleCancelClick = (orderId: string) => {
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

  const handleReasonChange = (orderId: string, reason: string) => {
    setCancelReasons((prev) => ({
      ...prev,
      [orderId]: reason,
    }));
  };

  // Hàm xử lý khi nhấn nút Send (gửi lý do và hủy)
  const handleCancelOrder = async (order: OrderData) => {
    // *** THAY ĐỔI: Nhận cả order object ***
    const reason = cancelReasons[order.orderId] || "Người dùng hủy đơn hàng"; // Lấy lý do từ state
    const cartItemId = order.cartItemId; // *** Lấy cartItemId từ order data ***

    // Validate reason
    if (!reason.trim()) {
      toast.warning("Vui lòng cung cấp lý do hủy đơn hàng");
      return;
    }
    // Validate cartItemId
    if (!cartItemId || cartItemId <= 0) {
      toast.error("Lỗi: Không tìm thấy mã định danh hợp lệ để hủy.");
      console.error(
        "[ToReceiveTab] Invalid cartItemId for cancellation:",
        order
      );
      return;
    }

    const toastId = toast.loading("Đang hủy đơn hàng của bạn...");
    console.log(
      `[ToReceiveTab] Attempting cancel for cartItemId: ${cartItemId} with reason: ${reason}`
    );

    try {
      // Gọi hàm update đã sửa, truyền cartItemId
      const backendSuccess = await updateOrderStatusOnBackend(
        cartItemId, // *** TRUYỀN cartItemId ***
        OrderStatus.CANCEL_BYUSER,
        reason
      );

      if (backendSuccess) {
        toast.update(toastId, {
          render: "Đơn hàng của bạn đã được hủy",
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

        // Gọi callback để báo cho component cha fetch lại dữ liệu
        if (onOrderUpdate) {
          onOrderUpdate();
        }
      } else {
        // Lỗi đã được toast trong service, chỉ cần update toast loading
        toast.update(toastId, {
          render: "Không thể hủy đơn hàng. Vui lòng thử lại.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      // Xử lý lỗi không mong muốn (ví dụ: network error)
      console.error(
        "[ToReceiveTab] Unexpected error during cancellation:",
        error
      );
      toast.update(toastId, {
        render: "Đã xảy ra lỗi không mong muốn khi hủy đơn hàng!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="order-list-status">
      {orders.length === 0 ? (
        <div className="no-orders-status">
          <p>Không có đơn hàng nào đang chờ nhận</p> {/* Sửa text */}
        </div>
      ) : (
        <>
          {currentOrders.map((order) => (
            <div key={order.orderId} className="order-wrapper">
              <OrderItem
                order={order}
                showCancelButton={true}
                // Truyền hàm để xử lý click nút Cancel trên OrderItem
                onCancelOrder={() => handleCancelClick(order.orderId)}
                expanded={showCancelInputs[order.orderId]}
              />
              {/* Input hủy chỉ hiển thị khi `showCancelInputs[order.orderId]` là true */}
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
                    autoFocus // Tự động focus
                  />
                  <button
                    className="send-reason-button-status"
                    // Gọi handleCancelOrder với cả object order
                    onClick={() => handleCancelOrder(order)}
                    disabled={!cancelReasons[order.orderId]?.trim()} // Disable nếu chưa nhập lý do
                    title="Gửi lý do và hủy"
                  >
                    <img src={IconSend} alt="Send" className="ic_28" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Thanh phân trang (giữ nguyên) */}
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

// --- CompletedTab ---
const CompletedTab: React.FC<OrderTabProps> = ({ orders }) => {
  // State và logic phân trang giữ nguyên
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10);
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Đảm bảo currentPage không vượt quá totalPages khi orders thay đổi
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
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
            <OrderItem key={order.orderId} order={order} />
          ))}
          {/* Thanh phân trang (giữ nguyên) */}
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

// --- CancelledTab ---
const CancelledTab: React.FC<OrderTabProps> = ({ orders }) => {
  // Không cần lọc lại ở đây vì component cha đã lọc
  const cancelledOrders = orders;

  // State và logic phân trang giữ nguyên
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10);
  const totalPages = Math.max(
    1,
    Math.ceil(cancelledOrders.length / ordersPerPage)
  );
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = cancelledOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Đảm bảo currentPage không vượt quá totalPages khi orders thay đổi
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
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
              showBuyAgainButton={true} // Chỉ hiển thị nút Buy Again
            />
          ))}
          {/* Thanh phân trang (giữ nguyên) */}
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


export default OrderStatuss;
