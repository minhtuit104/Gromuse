import { useState, useEffect } from "react";
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
  updateOrderStatus,
  OrderData,
  cleanupDuplicateOrders, // Thêm import cho hàm mới
} from "../../../Service/OrderService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";

const OrderShop = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [cancelReasons, setCancelReasons] = useState<{ [key: string]: string }>(
    {}
  );
  const [showCancelInputs, setShowCancelInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const navigate = useNavigate();

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10); // Số đơn hàng mỗi trang

  useEffect(() => {
    // Gọi hàm dọn dẹp đơn hàng trùng lặp và lấy danh sách đã làm sạch
    const cleanedOrders = cleanupDuplicateOrders();
    setOrders(cleanedOrders);
  }, []);

  // Lọc đơn hàng có trạng thái pending
  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "pending"
  );

  // Tính số trang
  const totalPages = Math.max(
    1,
    Math.ceil(pendingOrders.length / ordersPerPage)
  );

  // Đảm bảo currentPage không vượt quá totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Lấy các đơn hàng cho trang hiện tại
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = pendingOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const handleCloseClick = (orderId: string) => {
    setShowCancelInputs((prev) => ({
      ...prev,
      [orderId]: true,
    }));
  };

  const handleAcceptOrder = (orderId: string) => {
    // Chuyển đơn hàng sang trạng thái hoàn thành và di chuyển sang lịch sử
    const success = updateOrderStatus(orderId, "completed");

    if (success) {
      // Cập nhật lại danh sách đơn hàng bằng cách lấy từ localStorage
      const updatedOrders = getOrdersFromLocalStorage();
      setOrders(updatedOrders);

      // Hiển thị thông báo thành công
      toast.success("Đơn hàng đã được xác nhận thành công!");

      // Nếu không còn đơn hàng pending nào, có thể tự động chuyển đến trang lịch sử sau một khoảng thời gian
      if (
        updatedOrders.filter((order) => order.orderStatus === "pending")
          .length === 0
      ) {
        setTimeout(() => {
          navigate("/order_history");
        }, 2000);
      }
    }
  };

  const handleCancelOrder = (orderId: string) => {
    const reason = cancelReasons[orderId] || "Không có lý do";

    // Chuyển đơn hàng sang trạng thái hủy và di chuyển sang lịch sử
    const success = updateOrderStatus(orderId, "cancelled", reason);

    if (success) {
      // Cập nhật lại danh sách đơn hàng bằng cách lấy từ localStorage
      const updatedOrders = getOrdersFromLocalStorage();
      setOrders(updatedOrders);

      // Hiển thị thông báo
      toast.info(`Đơn hàng đã bị hủy. Lý do: ${reason}`);

      // Đóng ô nhập lý do
      setShowCancelInputs((prev) => ({
        ...prev,
        [orderId]: false,
      }));

      // Xóa lý do khỏi state
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

  const handleHistoryClick = () => {
    navigate("/order_history");
  };

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

  const formatPrice = (price: number, quantity: number = 1) => {
    return `$${(price * quantity).toFixed(0)}`;
  };

  return (
    <div className="order_container">
      <HeaderDashboard />
      <div className="order_history">
        <div className="tabs">
          <div className="tab active">Orders</div>
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleHistoryClick}>
            History
          </div>
        </div>

        <div className="order-list">
          {pendingOrders.length === 0 ? (
            <div className="no-orders">
              <p>Không có đơn hàng nào đang chờ xử lý.</p>
            </div>
          ) : (
            <>
              {currentOrders.map((order, index, filteredArray) => (
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
                        className="ic_40"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = ImgProductDefault;
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <div className="product-name">{order.product.name}</div>
                      <div className="product-quantity">
                        x{order.product.quantity}
                      </div>
                    </div>
                    <img
                      src={IconArrowRight}
                      alt="IconArrowRight"
                      className="ic_20 arrow_right"
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
                        onClick={() => handleAcceptOrder(order.orderId)}
                      >
                        <img
                          src={IconCheck}
                          alt="IconCheck"
                          className="ic_28"
                        />
                      </div>
                      <div
                        className="icon_close"
                        onClick={() => handleCloseClick(order.orderId)}
                      >
                        <img
                          src={IconClose}
                          alt="IconClose"
                          className="ic_24"
                        />
                      </div>
                    </div>
                    {showCancelInputs[order.orderId] && (
                      <div className="cancel-reason-container">
                        <input
                          type="text"
                          className="cancel-reason-input"
                          placeholder="Send reason cancel to buyer "
                          value={cancelReasons[order.orderId] || ""}
                          onChange={(e) =>
                            handleReasonChange(order.orderId, e.target.value)
                          }
                        />
                        <button
                          className="send-reason-button"
                          onClick={() => handleCancelOrder(order.orderId)}
                        >
                          <img
                            src={IconSend}
                            alt="Send"
                            className="ic_28 send-icon"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                  {index < filteredArray.length - 1 && (
                    <div className="order-card-line"></div>
                  )}
                </React.Fragment>
              ))}

              {/* Thanh phân trang chỉ hiển thị khi có đơn hàng và totalPages > 1 */}
              {pendingOrders.length > 0 && totalPages > 1 && (
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
