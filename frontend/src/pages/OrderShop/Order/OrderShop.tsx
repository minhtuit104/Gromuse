import React, { useState, useEffect, useCallback } from "react"; // Thêm useCallback
import HeaderDashboard from "../../../pages/DashboardPage/Header/HeaderDashboard";
import { useNavigate } from "react-router-dom";
import "./OrderShop.css";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";
import IconCheck from "../../../assets/images/icons/ic_ check.svg";
import IconClose from "../../../assets/images/icons/ic_ close.svg";
import IconSend from "../../../assets/images/icons/ic_ send.svg";
import ImgProductDefault from "../../../assets/images/imagePNG/banana 1.png";
import {
  getOrdersFromLocalStorage,
  OrderData,
  OrderStatus,
  updateOrderStatusOnBackend,
  reconstructOrderMappings,
  // synchronizeOrdersWithBackend,
} from "../../../Service/OrderService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderShop = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [cancelReasons, setCancelReasons] = useState<{ [key: string]: string }>(
    {}
  );
  const [showCancelInputs, setShowCancelInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10);

  const loadPendingOrders = useCallback(() => {
    console.log(
      "[OrderShop] Attempting to load pending orders from localStorage..."
    );
    const pending = getOrdersFromLocalStorage();
    setOrders((prevOrders) => {
      if (JSON.stringify(prevOrders) !== JSON.stringify(pending)) {
        console.log(
          "[OrderShop] Pending orders data changed, updating state:",
          pending
        );
        return pending;
      }
      console.log("[OrderShop] Pending orders data unchanged.");
      return prevOrders;
    });
  }, []);

  useEffect(() => {
    console.log("[OrderShop] Component mounted. Initializing...");
    reconstructOrderMappings();

    // Hàm thực hiện đồng bộ và tải dữ liệu
    // const syncAndLoad = () => {
    //   console.log("[OrderShop] Starting syncAndLoad...");
    //   synchronizeOrdersWithBackend()
    //     .then((syncSuccess) => {
    //       if (syncSuccess) {
    //         console.log("[OrderShop] Sync successful.");
    //       } else {
    //         console.warn("[OrderShop] Sync failed, loading local data anyway.");
    //         toast.warn("Đồng bộ thất bại, hiển thị dữ liệu cục bộ.", {
    //           autoClose: 2000,
    //         });
    //       }
    //       // Luôn tải dữ liệu từ local storage sau khi đồng bộ (hoặc thất bại)
    //       loadPendingOrders();
    //     })
    //     .catch((error) => {
    //       console.error("[OrderShop] Error during sync/load:", error);
    //       toast.error("Lỗi khi đồng bộ hoặc tải đơn hàng.");
    //       // Vẫn thử tải dữ liệu local nếu sync lỗi
    //       loadPendingOrders();
    //     });
    // };

    // syncAndLoad();

    // // Thiết lập interval để chạy lại syncAndLoad mỗi 5 giây
    // console.log("[OrderShop] Setting up polling interval (5 seconds)...");
    // const intervalId = setInterval(syncAndLoad, 5000); // 5000ms = 5 giây

    // Cleanup function: Xóa interval khi component unmount
    // Thêm: Tải lại dữ liệu khi cửa sổ được focus
    const handleFocus = () => {
      console.log(
        "[OrderStatus] Window focused, reloading data from localStorage..."
      );
      loadPendingOrders();
    };
    window.addEventListener("focus", handleFocus);
    console.log("[OrderStatus] Added focus event listener.");

    // Cleanup
    return () => {
      console.log("[OrderStatus] Component unmounting.");
      // clearInterval(intervalId); // Bỏ cleanup interval
      window.removeEventListener("focus", handleFocus); // Gỡ bỏ listener khi unmount
      console.log("[OrderStatus] Removed focus event listener.");
    };
  }, [loadPendingOrders]); // Thêm loadPendingOrders vào dependency array

  // Tính toán phân trang dựa trên state `orders`
  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));

  // Đảm bảo currentPage không vượt quá totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Lấy các đơn hàng cho trang hiện tại
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  const handleCloseClick = (orderId: string) => {
    setShowCancelInputs((prev) => ({
      ...prev,
      [orderId]: !prev[orderId], // Toggle hiển thị input
    }));
  };

  // --- Xử lý chấp nhận đơn hàng ---
  const handleAcceptOrder = async (orderId: string) => {
    const toastId = toast.loading("Đang xác nhận hoàn thành đơn hàng...");
    try {
      // Gọi trực tiếp hàm cập nhật backend
      const backendSuccess = await updateOrderStatusOnBackend(
        orderId,
        OrderStatus.COMPLETE // Trạng thái mới là COMPLETE
      );

      if (backendSuccess) {
        // Nếu backend thành công (hoặc DEV mode thành công)
        toast.update(toastId, {
          render: "Đơn hàng đã được chuyển sang hoàn thành!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        // Nếu backend thất bại (và không phải DEV mode)
        toast.update(toastId, {
          render: "Không thể xác nhận đơn hàng. Lỗi từ server hoặc kết nối.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("Lỗi bất ngờ khi chấp nhận đơn hàng:", error);
      toast.update(toastId, {
        render: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // --- Xử lý hủy đơn hàng ---
  const handleCancelOrder = async (orderId: string) => {
    const reason = cancelReasons[orderId] || "";

    if (!reason.trim()) {
      toast.warning("Vui lòng nhập lý do hủy đơn hàng.");
      return;
    }

    const toastId = toast.loading("Đang xử lý hủy đơn hàng...");
    try {
      const backendSuccess = await updateOrderStatusOnBackend(
        orderId,
        OrderStatus.CANCEL_BYSHOP,
        reason
      );

      if (backendSuccess) {
        toast.update(toastId, {
          render: "Đơn hàng đã được hủy thành công.",
          type: "info",
          isLoading: false,
          autoClose: 3000,
        });

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
          render: "Không thể hủy đơn hàng. Lỗi từ server hoặc kết nối.",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (error) {
      console.error("Lỗi bất ngờ khi hủy đơn hàng:", error);
      toast.update(toastId, {
        render: "Đã xảy ra lỗi không mong muốn khi hủy. Vui lòng thử lại.",
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

  // Hàm chuyển hướng đến các tab
  const handleHistoryClick = () => navigate("/order_history");
  const handleCancelledClick = () => navigate("/order_cancel");

  // Xử lý phân trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Định dạng giá tiền
  const formatPrice = (price: number, quantity: number = 1) => {
    return `$${(price * quantity).toFixed(0)}`;
  };

  return (
    <div className="order_container">
      <HeaderDashboard />
      <div className="order_history">
        {/* Phần Tabs */}
        <div className="tabs">
          <div className="tab active">Orders ({orders.length})</div>{" "}
          {/* Hiển thị số lượng */}
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleHistoryClick}>
            History
          </div>
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleCancelledClick}>
            Cancelled
          </div>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="order-list">
          {orders.length === 0 ? (
            <div className="no-orders">
              <p>Không có đơn hàng nào đang chờ xử lý.</p>
            </div>
          ) : (
            <>
              {/* Render danh sách đơn hàng của trang hiện tại */}
              {currentOrders.map((order, index) => (
                <React.Fragment key={order.orderId}>
                  <div
                    className={`order-item ${
                      showCancelInputs[order.orderId] ? "expanded" : ""
                    }`}
                  >
                    {/* Thông tin sản phẩm */}
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
                    <div className="product-info">
                      <div className="product-name-shop">
                        {order.product.name}
                      </div>
                      <div className="product-quantity">
                        x{order.product.quantity}
                      </div>
                    </div>

                    {/* Mũi tên */}
                    <img
                      src={IconArrowRight}
                      alt="IconArrowRight"
                      className="ic_20 arrow_right"
                    />

                    {/* Thông tin khách hàng */}
                    <div className="customer-info">
                      <div className="customer-name">{order.customer.name}</div>
                      <div className="customer-address">
                        {order.customer.address}
                      </div>
                    </div>

                    {/* Thông tin giá */}
                    <div className="price-info">
                      {/* Có thể bỏ giá cũ nếu không cần thiết */}
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

                    {/* Nút hành động */}
                    <div className="action-button">
                      {/* Nút chấp nhận */}
                      <div
                        className="icon_check"
                        onClick={() => handleAcceptOrder(order.orderId)}
                        title="Xác nhận hoàn thành"
                      >
                        <img
                          src={IconCheck}
                          alt="Accept Order"
                          className="ic_28"
                        />
                      </div>
                      {/* Nút mở/đóng ô hủy */}
                      <div
                        className="icon_close"
                        onClick={() => handleCloseClick(order.orderId)}
                        title={
                          showCancelInputs[order.orderId]
                            ? "Đóng ô hủy"
                            : "Hủy đơn hàng"
                        } // Tooltip động
                      >
                        <img
                          src={IconClose}
                          alt="Cancel Order"
                          className="ic_24"
                        />
                      </div>
                    </div>

                    {/* Ô nhập lý do hủy (chỉ hiển thị khi cần) */}
                    {showCancelInputs[order.orderId] && (
                      <div className="cancel-reason-container">
                        <input
                          type="text"
                          className="cancel-reason-input"
                          placeholder="Nhập lý do hủy..." // Placeholder tiếng Việt
                          value={cancelReasons[order.orderId] || ""}
                          onChange={(e) =>
                            handleReasonChange(order.orderId, e.target.value)
                          }
                          autoFocus // Tự động focus vào input khi mở
                        />
                        <button
                          className="send-reason-button"
                          onClick={() => handleCancelOrder(order.orderId)}
                          title="Gửi lý do và hủy" // Tooltip
                          disabled={!cancelReasons[order.orderId]?.trim()} // Disable nút nếu chưa nhập lý do
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
                  {/* Đường kẻ phân cách giữa các đơn hàng */}
                  {index < currentOrders.length - 1 && (
                    <div className="order-card-line"></div>
                  )}
                </React.Fragment>
              ))}

              {/* Phân trang */}
              {orders.length > 0 && totalPages > 1 && (
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
                  {/* Tạo các nút số trang */}
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
      {/* Toast Container để hiển thị thông báo */}
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

export default OrderShop;
