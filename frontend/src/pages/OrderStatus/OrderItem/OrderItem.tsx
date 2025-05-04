import { OrderData } from "../../../Service/OrderService";
import ImgProductDefault from "../../../assets/images/imagePNG/beef 1.png";
import IconCancel from "../../../assets/images/icons/ic_ close.svg";
import IconStar from "../../../assets/images/icons/ic_star.svg";
import IconCart from "../../../assets/images/icons/ic_cart.svg";
import { OrderStatus } from "../../../Service/OrderService";
import IconView from "../../../assets/images/icons/ic_eye.svg";
import IconSend from "../../../assets/images/icons/ic_ send.svg"; // Thêm icon send nếu chuyển input vào đây
import ImgShop from "../../../assets/images/icons/ic_ shop.svg";
import IconChecked from "../../../assets/images/icons/ic_ check.svg";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  name: string;
  role: number;
  iat: number;
  exp: number;
}

interface OrderItemProps {
  order: OrderData;
  showCancelButton?: boolean;
  showBuyAgainButton?: boolean;
  onCancelOrder?: (orderId: string) => void; // Callback khi nhấn nút Cancel gốc
  expanded?: boolean;
  // Props mới cho input hủy bên trong component:
  showCancelInput?: boolean;
  cancelReason?: string;
  onReasonChange?: (reason: string) => void;
  onConfirmCancel?: () => void;
  onCompleteOrder: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const OrderItem: React.FC<OrderItemProps> = ({
  order,
  onCancelOrder,
  expanded, // Vẫn dùng để thêm class 'expanded' nếu cần
  showCancelInput, // Nhận prop mới
  cancelReason, // Nhận prop mới
  onReasonChange, // Nhận prop mới
  onConfirmCancel, // Nhận prop mới
  onCompleteOrder,
}) => {
  const navigate = useNavigate();
  const originalPrice = order.product.price * 1.15 * order.product.quantity;
  const currentPrice = order.product.price * order.product.quantity;

  const addItemToCartAPI = async (
    userId: number,
    productId: number | string,
    quantity: number
  ): Promise<{ cartId: number | null; error?: string }> => {
    try {
      const response = await fetch("http://localhost:3000/api/cart-items", {
        // Endpoint thêm vào giỏ
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(productId),
          quantity,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        console.error("Add Item API Error:", errorData);
        return {
          cartId: null,
          error: `Lỗi HTTP ${response.status}: ${
            errorData.message || response.statusText
          }`,
        };
      }

      const addedItemData = await response.json();
      console.log("Add Item API Success:", addedItemData);

      if (addedItemData && addedItemData.cart && addedItemData.cart.id) {
        return { cartId: addedItemData.cart.id };
      } else {
        console.error(
          "Add Item API response invalid or missing cartId:",
          addedItemData
        );
        return {
          cartId: null,
          error: "Phản hồi từ server không hợp lệ (thiếu cartId).",
        };
      }
    } catch (error) {
      console.error("Lỗi gọi API thêm vào giỏ:", error);
      return {
        cartId: null,
        error:
          error instanceof Error
            ? error.message
            : "Lỗi mạng hoặc không xác định.",
      };
    }
  };

  const handleCancelClick = () => {
    if (onCancelOrder) {
      onCancelOrder(order.orderId);
    }
  };

  const handleRateClick = () => {
    navigate("/rating_product", {
      state: {
        cartItemId: order.cartItemId,
        productId: order.product.id,
        productName: order.product.name,
        productImg: order.product.img,
        weight: order.product.weight,
        quantity: order.product.quantity,
        price: currentPrice,
      },
    });
  };

  const handleViewRateClick = () => {
    // Chuyển hướng đến trang chi tiết sản phẩm với ID tương ứng
    navigate(`/product/${order.product.id}`);
  };

  const handleBuyAgainClick = async () => {
    // Chuyển đổi productId sang kiểu number ngay từ đầu
    const productId = Number(order.product.id);
    const quantity = order.product.quantity || 1; // Lấy số lượng gốc, mặc định là 1 nếu không có

    // Kiểm tra xem productId có phải là số hợp lệ và lớn hơn 0 không
    if (isNaN(productId) || productId <= 0) {
      // Bây giờ phép so sánh hợp lệ
      toast.error("Lỗi: ID sản phẩm không hợp lệ.");
      return;
    }

    const userId = getUserIdFromToken();
    if (userId === null) {
      toast.error("Bạn cần đăng nhập để mua lại sản phẩm.");
      navigate("/login"); // Chuyển hướng đăng nhập
      return;
    }

    console.log(
      `[handleBuyAgainClick] Adding productId: ${productId}, quantity: ${quantity} to cart for userId: ${userId}`
    );
    const toastId = toast.loading("Đang thêm sản phẩm vào giỏ...");

    // Gọi hàm API chung để thêm vào giỏ
    // Hàm addItemToCartAPI đã xử lý Number(productId) bên trong, nên không cần đổi ở đây
    const result = await addItemToCartAPI(userId, productId, quantity);

    if (result.cartId) {
      // Lưu cartId vào localStorage để trang Payment sử dụng
      localStorage.setItem("currentCartId", result.cartId.toString());
      // Xóa các key cũ không cần thiết
      localStorage.removeItem("buyNowCartId");
      localStorage.removeItem("isBuyNow");
      localStorage.removeItem("buyAgainProduct"); // Xóa key này nếu có

      toast.update(toastId, {
        render: "Đã thêm vào giỏ! Đang chuyển đến thanh toán...",
        type: "success",
        isLoading: false,
        autoClose: 1500,
      });

      // Chuyển hướng đến trang thanh toán
      setTimeout(() => {
        navigate("/payment");
      }, 1500);
    } else {
      // Xử lý lỗi
      toast.update(toastId, {
        render: `Lỗi khi mua lại: ${result.error || "Lỗi không xác định"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const getUserIdFromToken = (): number | null => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Không tìm thấy token trong localStorage.");
      return null;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.error("Token đã hết hạn.");
        localStorage.removeItem("token");
        localStorage.removeItem("currentCartId");
        localStorage.removeItem("buyNowCartId");
        localStorage.removeItem("isBuyNow");
        localStorage.removeItem("cartUpdated");
        return null;
      }
      if (typeof decoded.idUser !== "number") {
        console.error("Token payload không chứa idUser hợp lệ.");
        localStorage.removeItem("token");
        return null;
      }
      return decoded.idUser;
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
      localStorage.removeItem("token");
      return null;
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
          {order.product.weight > 0 && (
            <div className="product-weight-status">{order.product.weight}g</div>
          )}
          <div className="product-quantity-status">
            x{order.product.quantity}
          </div>
        </div>
        <div className="product-price-status">
          <div className="original-price-status">
            ${originalPrice.toFixed(2)}
          </div>
          <div className="current-price-status">${currentPrice.toFixed(2)}</div>
        </div>
      </div>
      <div className="Shop-info">
        <img src={ImgShop} alt="ImgShop" className="ic_20" />
        <span className="Shop-name">{order.shop?.name || "Cửa hàng"}</span>{" "}
      </div>
      <div className="item-actions-status">
        {order.orderStatus === OrderStatus.TO_ORDER && (
          <button className="cancel-button-status" onClick={handleCancelClick}>
            <span className="cancel-icon-status">
              <img src={IconCancel} alt="IconCancel" className="ic_20" />
            </span>
            Cancel
          </button>
        )}
        {order.orderStatus === OrderStatus.TO_RECEIVE && (
          <button
            className="to-receive-button-status"
            onClick={onCompleteOrder}
          >
            <span className="cancel-icon-status">
              <img src={IconChecked} alt="IconCancel" className="ic_20" />
            </span>
            Received
          </button>
        )}
        {order.orderStatus === OrderStatus.COMPLETE && (
          <>
            {!order.isRated && (
              <button className="rate-button-status" onClick={handleRateClick}>
                <span className="star-icon-status">
                  <img src={IconStar} alt="IconStar" className="ic_20" />
                </span>
                Rate
              </button>
            )}
            {order.isRated && (
              <button
                className="view-rate-button-status"
                onClick={handleViewRateClick}
              >
                <span className="view-icon-status">
                  <img src={IconView} alt="View Rate" className="ic_20" />
                </span>
                View Rate
              </button>
            )}
          </>
        )}

        {/* Nút Buy Again: Hiển thị nếu showBuyAgainButton là true */}
        {order.orderStatus === OrderStatus.CANCEL_BYSHOP ||
          (order.orderStatus === OrderStatus.CANCEL_BYUSER && (
            <button
              className="buy-again-button-status"
              onClick={handleBuyAgainClick}
            >
              <span className="cart-icon-status">
                <img src={IconCart} alt="IconCart" className="ic_20" />
              </span>
              Buy again
            </button>
          ))}
      </div>
      {/* Hiển thị lý do hủy nếu có */}
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

      {/* Phần hiển thị input hủy (NẾU chuyển vào đây) */}
      {showCancelInput && (
        <div className="cancel-reason-container-status">
          <input
            type="text"
            className="cancel-reason-input-status"
            placeholder="Nhập lý do hủy đơn hàng"
            value={cancelReason || ""}
            onChange={(e) => onReasonChange?.(e.target.value)}
            autoFocus
          />
          <button
            className="send-reason-button-status"
            onClick={onConfirmCancel}
            disabled={!cancelReason?.trim()}
            title="Gửi lý do và hủy"
          >
            <img src={IconSend} alt="Send" className="ic_28" />
          </button>
        </div>
      )}
    </div>
  );
};
