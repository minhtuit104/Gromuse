import React, { useState, useEffect, useCallback } from "react";
import HeaderDashboard from "../../../pages/DashboardPage/Header/HeaderDashboard";
import { useNavigate } from "react-router-dom";
import "./OrderHistory.css";
import ImgProductDefault from "../../../assets/images/imagePNG/banana 1.png";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";
import {
  OrderData,
  OrderStatus,
  fetchOrdersByStatus,
  // fetchShopOrdersByStatus,
} from "../../../Service/OrderService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderHistory = () => {
  const navigate = useNavigate();
  // Sử dụng getOrderHistoryFromLocalStorage thay vì lọc ở component
  const [historyOrders, setHistoryOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10); // Số đơn hàng mỗi trang

  const loadHistoryOrders = useCallback(async () => {
    setIsLoading(true);
    console.log("[OrderHistory] Loading COMPLETE orders from API...");
    try {
      // Fetch các đơn hàng có trạng thái COMPLETE
      const completed = await fetchOrdersByStatus([OrderStatus.COMPLETE]);
      setHistoryOrders(completed); // Cập nhật state
      console.log(
        `[OrderHistory] Loaded ${completed.length} completed orders.`
      );
    } catch (error) {
      console.error("[OrderHistory] Error loading completed orders:", error);
      toast.error("Lỗi khi tải lịch sử đơn hàng."); // Thông báo lỗi
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("[OrderHistory] Component mounted. Initial load...");
    loadHistoryOrders();
  }, [loadHistoryOrders]);

  useEffect(() => {
    const handleFocus = () => {
      console.log(
        "[OrderHistory] Window focused, reloading completed orders..."
      );
      loadHistoryOrders(); // Gọi lại hàm fetch
    };
    window.addEventListener("focus", handleFocus);
    console.log("[OrderHistory] Added focus event listener.");

    // Cleanup function
    return () => {
      console.log("[OrderHistory] Component unmounting.");
      window.removeEventListener("focus", handleFocus); // Remove focus listener
      console.log("[OrderHistory] Removed focus event listener.");
    };
  }, [loadHistoryOrders]);

  // Tính toán số trang và đơn hàng hiện tại
  const totalPages = Math.ceil(historyOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = historyOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Hàm chuyển hướng đến các tab
  const handleOrdersClick = () => {
    navigate("/order_shop");
  };

  const handleCancelledClick = () => {
    navigate("/order_cancel");
  };

  // Xử lý phân trang
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
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
        {/* Cập nhật tabs để thêm tab OrderCancel */}
        <div className="tabs">
          <div className="tab inactive" onClick={handleOrdersClick}>
            Orders
          </div>
          <div className="vertical_line">|</div>
          <div className="tab active">History ({historyOrders.length})</div>
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleCancelledClick}>
            Cancelled
          </div>
        </div>

        <div className="order-list-history">
          {/* Hiển thị loading */}
          {isLoading && (
            <div className="loading-indicator">Đang tải lịch sử...</div>
          )}

          {/* Hiển thị khi không có đơn hàng */}
          {!isLoading && historyOrders.length === 0 && (
            <div className="no-orders">
              <p>Chưa có đơn hàng nào trong lịch sử.</p>
            </div>
          )}

          {/* Hiển thị danh sách đơn hàng */}
          {!isLoading && historyOrders.length > 0 && (
            <>
              {currentOrders.map((order, index) => (
                <React.Fragment key={order.orderId}>
                  <div className="order-item">
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
                    <div className="product-info-history">
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
                    <div className="customer-info-history">
                      <div className="customer-name">{order.customer.name}</div>
                      <div className="customer-address">
                        {order.customer.address}
                      </div>
                    </div>
                    <div className="price-info-history">
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
                  </div>
                  {index < currentOrders.length - 1 && (
                    <div className="order-card-line"></div>
                  )}
                </React.Fragment>
              ))}

              {/* Thanh phân trang */}
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

export default OrderHistory;
