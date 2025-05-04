import React, { useState, useEffect, useCallback, useRef } from "react";
import "./OrderStatus.css";
import Header from "../../layouts/Header/Header";
import IconSend from "../../assets/images/icons/ic_ send.svg";
import {
  OrderData,
  OrderStatus,
  fetchOrdersByStatus,
  updateOrderStatusOnBackend,
} from "../../Service/OrderService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { OrderItem } from "./OrderItem/OrderItem";
import { useNavigate } from "react-router-dom";
import OrderEmptyImage from "../../assets/images/imagePNG/order_empty.png";

type TabType = "toOrder" | "toReceive" | "completed" | "cancelled";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  paginate: (pageNumber: number) => void;
  prevPage: () => void;
  nextPage: () => void;
}

const OrderStatuss = () => {
  const navigate = useNavigate(); // Khởi tạo navigate
  const [activeTab, setActiveTab] = useState<TabType>("toOrder");
  const [currentOrders, setCurrentOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(5);

  const [showCancelInputs, setShowCancelInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const [cancelReasons, setCancelReasons] = useState<{ [key: string]: string }>(
    {}
  );

  const [indicatorStyle, setIndicatorStyle] = useState({});
  const toOrderTabRef = useRef<HTMLDivElement>(null);
  const toReceiveTabRef = useRef<HTMLDivElement>(null);
  const completedTabRef = useRef<HTMLDivElement>(null);
  const cancelledTabRef = useRef<HTMLDivElement>(null);

  // --- AUTH CHECK ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("[OrderStatus] No token found, redirecting to login.");
      toast.error("Vui lòng đăng nhập để xem trạng thái đơn hàng.");
      // Chuyển hướng về trang đăng nhập sau một khoảng trễ ngắn để toast hiển thị
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
      return () => clearTimeout(timer); // Cleanup timer nếu component unmount sớm
    }
    // Nếu có token, không làm gì cả, các useEffect khác sẽ chạy để load data
  }, [navigate]); // Thêm navigate vào dependency array

  // Hàm fetch dữ liệu cho tab hiện tại từ API
  const loadDataForTab = useCallback(async (tab: TabType) => {
    setIsLoading(true);
    console.log(`[OrderStatus] Loading data for tab: ${tab} from API...`);
    try {
      let orders: OrderData[] = [];
      if (tab === "toOrder") {
        orders = await fetchOrdersByStatus([OrderStatus.TO_ORDER]);
      } else if (tab === "toReceive") {
        orders = await fetchOrdersByStatus([OrderStatus.TO_RECEIVE]);
      } else if (tab === "completed") {
        orders = await fetchOrdersByStatus([OrderStatus.COMPLETE]);
      } else if (tab === "cancelled") {
        // Lấy cả 2 loại hủy
        orders = await fetchOrdersByStatus([
          OrderStatus.CANCEL_BYUSER,
          OrderStatus.CANCEL_BYSHOP,
        ]);
      }
      setCurrentOrders(orders); // Cập nhật state chung
      setCurrentPage(1); // Reset về trang 1 khi đổi tab hoặc load lại
      setShowCancelInputs({}); // Reset trạng thái input hủy
      setCancelReasons({}); // Reset lý do hủy
      console.log(
        `[OrderStatus] Loaded ${orders.length} orders for tab ${tab}`
      );
    } catch (error) {
      console.error(`[OrderStatus] Error loading data for tab ${tab}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependency rỗng vì hàm này không dùng state/prop nào bên ngoài scope của nó

  useEffect(() => {
    // Chỉ load data nếu có token (tránh gọi API khi đang chuẩn bị redirect)
    const token = localStorage.getItem("token");
    if (!token) return;
    // console.log(
    //   `[OrderStatus] Tab changed to ${activeTab} or component mounted. Loading data...`
    // );
    loadDataForTab(activeTab);
  }, [activeTab, loadDataForTab]);

  useEffect(() => {
    const handleFocus = () => {
      console.log(
        "[OrderStatus] Window focused, reloading data for current tab..."
      );
      // Chỉ load data nếu có token
      const token = localStorage.getItem("token");
      if (token) {
        loadDataForTab(activeTab); // Gọi lại hàm fetch
      }
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
    if (tab === activeTab) return; // Không làm gì nếu click vào tab đang active
    setActiveTab(tab);
  };

  // Thêm useEffect để tính toán vị trí của indicator
  useEffect(() => {
    const updateIndicator = () => {
      let activeTabElement = null;

      if (activeTab === "toOrder") activeTabElement = toOrderTabRef.current;
      else if (activeTab === "toReceive")
        activeTabElement = toReceiveTabRef.current;
      else if (activeTab === "completed")
        activeTabElement = completedTabRef.current;
      else if (activeTab === "cancelled")
        activeTabElement = cancelledTabRef.current;

      if (activeTabElement) {
        const tabWidth = activeTabElement.offsetWidth;
        const tabLeft = activeTabElement.offsetLeft;

        setIndicatorStyle({
          width: `${tabWidth}px`,
          transform: `translateX(${tabLeft - 5}px)`,
        });
      }
    };

    updateIndicator();

    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab]);

  // --- Logic phân trang ---
  const totalPages = Math.max(
    1,
    Math.ceil(currentOrders.length / ordersPerPage)
  );
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentPagedOrders = currentOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  // Đảm bảo currentPage không vượt quá totalPages khi orders thay đổi (ví dụ sau khi hủy)
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

  // --- Logic hủy đơn hàng (cho tab 'toReceive') ---
  const handleOrderUpdate = () => {
    console.log(
      "[OrderStatus] Order updated, reloading data for current tab..."
    );
    loadDataForTab(activeTab); // Gọi lại hàm fetch cho tab hiện tại
  };

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

  const handleReceivedClick = async (cartItemId: number) => {
    const toastId = toast.loading(
      "Being confirmed to have received the cave..."
    );
    try {
      const backendSuccess = await updateOrderStatusOnBackend(
        cartItemId,
        OrderStatus.COMPLETE
      );
      if (backendSuccess) {
        toast.update(toastId, {
          render: "Confirmation of successful goods",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });
        handleOrderUpdate(); // Load lại dữ liệu sau khi hủy thành công
      } else {
        toast.update(toastId, {
          render: "Error occurs when confirming the goods!",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error(
        "[OrderStatus] Unexpected error during cancellation:",
        error
      );
      toast.update(toastId, {
        render: "Lỗi không mong muốn khi hủy đơn hàng!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleReasonChange = (orderId: string, reason: string) => {
    setCancelReasons((prev) => ({
      ...prev,
      [orderId]: reason,
    }));
  };

  const handleConfirmCancelOrder = async (order: OrderData) => {
    const reason = cancelReasons[order.orderId] || "Người dùng hủy đơn hàng";
    const cartItemId = order.cartItemId;

    if (!cartItemId || cartItemId <= 0) {
      toast.error("Lỗi: Không tìm thấy mã định danh hợp lệ để hủy.");
      return;
    }

    const toastId = toast.loading("Đang hủy đơn hàng của bạn...");
    try {
      const backendSuccess = await updateOrderStatusOnBackend(
        cartItemId,
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
        handleOrderUpdate(); // Load lại dữ liệu sau khi hủy thành công
      } else {
        toast.update(toastId, {
          render: "Không thể hủy đơn hàng. Vui lòng thử lại.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error(
        "[OrderStatus] Unexpected error during cancellation:",
        error
      );
      toast.update(toastId, {
        render: "Lỗi không mong muốn khi hủy đơn hàng!",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="order-status-container">
      <Header />
      <div className="three-tab-status">
        <div className="tab-header-status">
          <div className="tab-indicator" style={indicatorStyle}></div>
          <div
            className={`tab-item-status ${
              activeTab === "toOrder" ? "active" : ""
            }`}
            onClick={() => handleTabChange("toOrder")}
            ref={toOrderTabRef}
          >
            To Order ({activeTab === "toOrder" ? currentOrders.length : 0})
          </div>
          <div
            className={`tab-item-status ${
              activeTab === "toReceive" ? "active" : ""
            }`}
            onClick={() => handleTabChange("toReceive")}
            ref={toReceiveTabRef}
          >
            To Receive ({activeTab === "toReceive" ? currentOrders.length : 0})
          </div>
          <div
            className={`tab-item-status ${
              activeTab === "completed" ? "active" : ""
            }`}
            onClick={() => handleTabChange("completed")}
            ref={completedTabRef}
          >
            Completed ({activeTab === "completed" ? currentOrders.length : 0})
          </div>
          <div
            className={`tab-item-status ${
              activeTab === "cancelled" ? "active" : ""
            }`}
            onClick={() => handleTabChange("cancelled")}
            ref={cancelledTabRef}
          >
            Cancelled ({activeTab === "cancelled" ? currentOrders.length : 0})
          </div>
        </div>
        <div className="tab-content-status">
          {isLoading && <div className="loading-indicator">Đang tải...</div>}
          {!isLoading && currentOrders.length === 0 && (
            <div className="no-orders-status">
              <img
                src={OrderEmptyImage}
                alt="No orders"
                className="no-orders-image"
              />
              <p className="no-orders-message">Have no data!!!</p>
            </div>
          )}
          {!isLoading && currentOrders.length > 0 && (
            <div className="order-list-status">
              {currentPagedOrders.map((order) => (
                <div key={order.orderId} className="order-wrapper">
                  <OrderItem
                    order={order}
                    onCancelOrder={
                      activeTab === "toOrder" || activeTab === "toReceive"
                        ? () => handleCancelClick(order.orderId)
                        : undefined
                    }
                    onCompleteOrder={() => {
                      handleReceivedClick(+order.cartItemId);
                    }}
                    expanded={
                      activeTab === "toOrder" || activeTab === "toReceive"
                        ? !!showCancelInputs[order.orderId]
                        : false
                    }
                  />
                  {(activeTab === "toOrder" || activeTab === "toReceive") &&
                    showCancelInputs[order.orderId] && (
                      <div className="cancel-reason-container-status">
                        <input
                          type="text"
                          className="cancel-reason-input-status"
                          placeholder="Nhập lý do hủy đơn hàng"
                          value={cancelReasons[order.orderId] || ""}
                          onChange={(e) =>
                            handleReasonChange(order.orderId, e.target.value)
                          }
                          autoFocus
                        />
                        <button
                          className="send-reason-button-status"
                          onClick={() => handleConfirmCancelOrder(order)}
                          disabled={!cancelReasons[order.orderId]?.trim()}
                          title="Gửi lý do và hủy"
                        >
                          <img src={IconSend} alt="Send" className="ic_28" />
                        </button>
                      </div>
                    )}
                </div>
              ))}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  paginate={paginate}
                  prevPage={prevPage}
                  nextPage={nextPage}
                />
              )}
            </div>
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

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  paginate,
  prevPage,
  nextPage,
}) => {
  return (
    <div className="pagination">
      <button
        onClick={prevPage}
        disabled={currentPage === 1}
        className={`pagination-button ${currentPage === 1 ? "disabled" : ""}`}
      >
        &laquo;
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`pagination-button ${
            currentPage === number ? "active" : ""
          }`}
        >
          {number}
        </button>
      ))}
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
  );
};

export default OrderStatuss;
