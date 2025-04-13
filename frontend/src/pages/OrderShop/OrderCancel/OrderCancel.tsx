import React, { useState, useEffect } from "react";
import HeaderDashboard from "../../../pages/DashboardPage/Header/HeaderDashboard";
import { useNavigate } from "react-router-dom";
import "./OrderCancel.css";
import ImgProductDefault from "../../../assets/images/imagePNG/banana 1.png";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";
import {
  getCancelledByShopOrdersFromLocalStorage,
  OrderData,
} from "../../../Service/OrderService";

const OrderCancel = () => {
  const navigate = useNavigate();
  const [cancelledOrders, setCancelledOrders] = useState<OrderData[]>([]);

  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ordersPerPage] = useState<number>(10); // Số đơn hàng mỗi trang

  useEffect(() => {
    // Chỉ lấy các đơn hàng bị hủy bởi shop
    const orders = getCancelledByShopOrdersFromLocalStorage();
    setCancelledOrders(orders);
  }, []);

  // Tính toán số trang và đơn hàng hiện tại
  const totalPages = Math.ceil(cancelledOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = cancelledOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );

  const handleOrdersClick = () => {
    navigate("/order_shop");
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
          <div className="tab inactive" onClick={handleOrdersClick}>
            Orders
          </div>
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleHistoryClick}>
            History
          </div>
          <div className="vertical_line">|</div>
          <div className="tab active">Cancelled</div>
        </div>

        <div className="order-list-cancel">
          {cancelledOrders.length === 0 ? (
            <div className="no-orders">
              <p>Chưa có đơn hàng nào bị hủy bởi shop.</p>
            </div>
          ) : (
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
                    <div className="product-info">
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
                      className="ic_20 arrow_right"
                    />
                    <div className="customer-info">
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
