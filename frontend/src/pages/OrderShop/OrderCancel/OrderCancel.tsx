import React, { useState, useEffect, useCallback } from "react";
import HeaderDashboard from "../../../pages/DashboardPage/Header/HeaderDashboard";
import { useNavigate } from "react-router-dom";
import "./OrderCancel.css";
import ImgProductDefault from "../../../assets/images/imagePNG/banana 1.png";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";
import {
  OrderData,
  OrderStatus,
  fetchShopOrdersByStatus,
} from "../../../Service/OrderService";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OrderCancel = () => {
  const navigate = useNavigate();
  const [cancelledOrders, setCancelledOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10); // Số đơn hàng mỗi trang

  // Hàm fetch dữ liệu đơn hàng bị hủy bởi shop từ API
  const loadCancelledByShopOrders = useCallback(async () => {
    setIsLoading(true);
    console.log("[OrderCancel] Loading CANCEL_BYSHOP orders from API...");
    try {
      // Fetch các đơn hàng có trạng thái CANCEL_BYSHOP
      const cancelled = await fetchShopOrdersByStatus([
        OrderStatus.CANCEL_BYSHOP,
      ]);
      setCancelledOrders(cancelled); // Cập nhật state
      console.log(
        `[OrderCancel] Loaded ${cancelled.length} cancelled by shop orders.`
      );
    } catch (error) {
      console.error(
        "[OrderCancel] Error loading cancelled by shop orders:",
        error
      );
      toast.error("Lỗi khi tải danh sách đơn hàng đã hủy."); // Thông báo lỗi
    } finally {
      setIsLoading(false);
    }
  }, []); // useCallback không có dependencies

  // Load dữ liệu khi component mount
  useEffect(() => {
    console.log("[OrderCancel] Component mounted. Initial load...");
    loadCancelledByShopOrders();
  }, [loadCancelledByShopOrders]); // Phụ thuộc loadCancelledByShopOrders

  // Thêm listener để fetch lại khi focus
  useEffect(() => {
    const handleFocus = () => {
      console.log(
        "[OrderCancel] Window focused, reloading cancelled by shop orders..."
      );
      loadCancelledByShopOrders(); // Gọi lại hàm fetch
    };
    window.addEventListener("focus", handleFocus);
    console.log("[OrderCancel] Added focus event listener.");

    // Cleanup function
    return () => {
      console.log("[OrderCancel] Component unmounting.");
      window.removeEventListener("focus", handleFocus); // Remove focus listener
      console.log("[OrderCancel] Removed focus event listener.");
    };
  }, [loadCancelledByShopOrders]); // Phụ thuộc loadCancelledByShopOrders

  // Tính toán số trang và đơn hàng hiện tại (giữ nguyên)
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

  // Hàm chuyển hướng (giữ nguyên)
  const handleOrdersClick = () => navigate("/order_shop");
  const handleHistoryClick = () => navigate("/order_history");

  // Xử lý phân trang (giữ nguyên)
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Định dạng giá (giữ nguyên)
  const formatPrice = (price: number, quantity: number = 1) => {
    return `$${(price * quantity).toFixed(0)}`;
  };

  return (
    <div className="order_container">
      <HeaderDashboard />
      <div className="order_history">
        <div className="tabs">
          <div className="tab inactive" onClick={handleOrdersClick}>
            Orders
          </div>
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleHistoryClick}>
            History
          </div>
          <div className="vertical_line">|</div>
          <div className="tab active">Cancelled ({cancelledOrders.length})</div>
        </div>

        <div className="order-list-cancel">
          {/* Hiển thị loading */}
          {isLoading && (
            <div className="loading-indicator">Đang tải đơn hàng đã hủy...</div>
          )}

          {/* Hiển thị khi không có đơn hàng */}
          {!isLoading && cancelledOrders.length === 0 && (
            <div className="no-orders">
              <p>Chưa có đơn hàng nào bị hủy bởi shop.</p>
            </div>
          )}

          {/* Hiển thị danh sách đơn hàng */}
          {!isLoading && cancelledOrders.length > 0 && (
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
                    <div className="product-info-cancel">
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
                    <div className="customer-info-cancel">
                      <div className="customer-name">{order.customer.name}</div>
                      <div className="customer-address">
                        {order.customer.address}
                      </div>
                    </div>
                    <div className="price-info-cancel">
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
                  <div className="cancel-reason">
                    <span className="reason-label">Cancellation:</span>
                    <span className="reason-text">
                      {order.cancelReason || "Không có lý do"}
                    </span>
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

export default OrderCancel;
