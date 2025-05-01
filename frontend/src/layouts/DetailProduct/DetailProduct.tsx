import { useEffect, useState } from "react";
import "./detailProduct.css";
import Img1 from "../../assets/images/imagePNG/lays_1 1.png";
import Img2 from "../../assets/images/imagePNG/lays_2.png";
import Img3 from "../../assets/images/imagePNG/lays_3.png";
import Img4 from "../../assets/images/imagePNG/lays_4.png";
import IconClock from "../../assets/images/icons/ic_ clock.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconSold from "../../assets/images/icons/ic_ flame.svg";
import { getTopSellingProducts } from "../../Service/ProductService";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  discount?: number;
  brand?: string;
  sold: number;
  img?: string;
  images?: string[];
  category?: {
    id: number;
    name: string;
  };
  tag?: string;
  weight?: number;
  amount?: number;
  active?: boolean;
}

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}

interface CartItemApiResponse {
  id: number;
  quantity: number;
  cartId?: number;
  cart?: { id: number };
}

const DetailProduct = () => {
  const navigate = useNavigate();
  const [topProduct, setTopProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1); // Default quantity

  // useEffect để cập nhật thời gian mỗi giây
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setCurrentTime(`${hours} : ${minutes} : ${seconds}`);
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    const fetchTopProduct = async () => {
      try {
        setLoading(true);
        setError(null); // Reset lỗi trước khi fetch
        console.log("Bắt đầu gọi API lấy sản phẩm bán chạy nhất (limit=1)");

        // Gọi hàm từ ProductService
        const productsArray = await getTopSellingProducts(1);
        console.log(
          "Dữ liệu API trả về (đã xử lý bởi service):",
          productsArray
        );

        // API nên trả về một mảng, lấy phần tử đầu tiên
        if (Array.isArray(productsArray) && productsArray.length > 0) {
          setTopProduct(productsArray[0]);
          console.log("Sản phẩm bán chạy nhất:", productsArray[0]);
        } else {
          setError("Không tìm thấy sản phẩm bán chạy nhất.");
          console.log("API không trả về sản phẩm nào.");
          setTopProduct(null); // Đảm bảo state là null nếu không có sản phẩm
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm bán chạy nhất:", err);
        setError(
          `Không thể tải sản phẩm: ${
            err instanceof Error ? err.message : "Vui lòng thử lại sau"
          }`
        );
        setTopProduct(null); // Đảm bảo state là null khi có lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchTopProduct();
  }, []);

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "NaN $";
    return `${price.toFixed(2)} $`;
  };

  // Function to get user ID from JWT token
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

  // API function for adding to cart
  const callCartItemApi = async (
    userId: number,
    productId: number,
    quantity: number
  ): Promise<{
    success: boolean;
    cartId?: number;
    cartItemId?: number;
    error?: string;
  }> => {
    try {
      const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiURL}/cart-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, productId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        console.error("Cart Item API Error Response:", errorData);
        return {
          success: false,
          error: `Lỗi HTTP ${response.status}: ${
            errorData.message || response.statusText
          }`,
        };
      }

      const addedItemData: CartItemApiResponse = await response.json();
      console.log("Cart Item API Success Response:", addedItemData);

      let cartIdFromResponse: number | undefined = undefined;
      if (addedItemData?.cart?.id) cartIdFromResponse = addedItemData.cart.id;
      else if (addedItemData?.cartId) cartIdFromResponse = addedItemData.cartId;

      // Lấy cartItemId từ response
      const cartItemIdFromResponse = addedItemData?.id;

      if (cartIdFromResponse && cartItemIdFromResponse) {
        return {
          success: true,
          cartId: cartIdFromResponse,
          cartItemId: cartItemIdFromResponse,
        };
      } else {
        console.error(
          "Cart Item API response invalid or missing cartId/cartItemId:",
          addedItemData
        );
        return {
          success: false,
          error:
            "Phản hồi từ server không hợp lệ (thiếu cartId hoặc cartItemId).",
        };
      }
    } catch (error) {
      console.error("Lỗi gọi API Cart Item:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Lỗi mạng hoặc không xác định.",
      };
    }
  };

  // Handler for Add to Cart button
  const handleAddToCart = async () => {
    if (!topProduct?.id) {
      toast.error("Sản phẩm không hợp lệ!");
      return;
    }

    const userId = getUserIdFromToken();
    if (userId === null) {
      toast.info("Bạn cần đăng nhập để thực hiện chức năng này.");
      navigate("/login");
      return;
    }

    console.log(
      `[handleAddToCart] Adding productId: ${topProduct.id}, quantity: ${quantity} to cart for userId: ${userId}`
    );
    const toastId = toast.loading("Đang thêm vào giỏ hàng...");

    const result = await callCartItemApi(userId, topProduct.id, quantity);

    if (result.success && result.cartId) {
      toast.update(toastId, {
        render: "Đã thêm sản phẩm vào giỏ hàng!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      localStorage.setItem("cartUpdated", "true"); // Đánh dấu giỏ hàng cập nhật
      localStorage.setItem("currentCartId", result.cartId.toString()); // Lưu cartId hiện tại
      localStorage.removeItem("buyNowCartItemId"); // Xóa key buy now cũ nếu có
    } else {
      toast.update(toastId, {
        render: `Lỗi thêm vào giỏ: ${result.error || "Lỗi không xác định"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // Handler for Buy Now button
  const handleBuyNow = async () => {
    if (!topProduct?.id) {
      toast.error("Sản phẩm không hợp lệ!");
      return;
    }

    const userId = getUserIdFromToken();
    if (userId === null) {
      toast.info("Bạn cần đăng nhập để thực hiện chức năng này.");
      navigate("/login");
      return;
    }

    console.log(
      `[handleBuyNow] Adding productId: ${topProduct.id}, quantity: ${quantity} for userId: ${userId} and proceeding to payment.`
    );
    const toastId = toast.loading("Đang xử lý...");

    const result = await callCartItemApi(userId, topProduct.id, quantity);

    if (result.success && result.cartId && result.cartItemId) {
      toast.update(toastId, {
        render: "Đang chuyển đến thanh toán...",
        type: "success",
        isLoading: false,
        autoClose: 1000,
      });

      // Lưu thông tin cần thiết cho trang Payment
      localStorage.setItem("currentCartId", result.cartId.toString());
      localStorage.setItem("buyNowCartItemId", result.cartItemId.toString());
      localStorage.setItem("cartUpdated", "true");

      // Chuyển hướng đến trang thanh toán
      setTimeout(() => {
        navigate("/payment");
      }, 1000);
    } else {
      toast.update(toastId, {
        render: `Lỗi khi xử lý Mua ngay: ${
          result.error || "Lỗi không xác định"
        }`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // Thêm hàm xử lý đường dẫn hình ảnh chính xác
  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return Img1;

    // Nếu đường dẫn đã có http/https, sử dụng nguyên dạng
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }

    // Nếu đường dẫn bắt đầu bằng dấu /, coi như đường dẫn tương đối từ gốc
    if (imagePath.startsWith("/")) {
      return `http://localhost:3000${imagePath}`;
    }

    // Nếu không, thêm tiền tố đường dẫn
    return `http://localhost:3000/${imagePath}`;
  };

  const formatDescription = (description: string | undefined): string => {
    if (!description) {
      return "Chưa có mô tả chi tiết cho sản phẩm này.";
    }
    const cleanedDescription = description
      .replace(/<\/?p>|<\/?strong>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return cleanedDescription;
  };

  if (loading) {
    return <div className="loading">Đang tải sản phẩm nổi bật...</div>;
  }

  if (error && !topProduct) {
    return <div className="error">{error}</div>;
  }

  if (!topProduct && !error) {
    return <div className="empty">Không có sản phẩm nổi bật nào.</div>;
  }

  if (!topProduct) {
    return null;
  }

  return (
    <>
      <div className="detail-home-product">
        <div className="detail-home-product-image">
          <div className="detail-home-product-image-parrent">
            {topProduct.discount && topProduct.discount > 0 && (
              <div className="sale-home">
                <p>{topProduct.discount}%</p>
                <span>Discount</span>
              </div>
            )}
            <img
              src={getImageUrl(topProduct.img)}
              alt={topProduct.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.log(`Ảnh chính lỗi, sử dụng ảnh dự phòng: ${Img1}`);
                target.src = Img1;
              }}
            />
          </div>
          <div className="detail-home-product-image-options">
            {topProduct.images && topProduct.images.length > 0 ? (
              // Sử dụng danh sách images từ product
              topProduct.images
                .slice(0, 5)
                .map((img: string, index: number) => (
                  <div key={index} className="product-option-item-home">
                    <img
                      src={getImageUrl(img)}
                      alt={`${topProduct.name} - ${index + 1}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log(
                          `Ảnh phụ lỗi, sử dụng ảnh dự phòng ${index}`
                        );
                        target.src = [Img2, Img3, Img4][index % 3];
                      }}
                    />
                  </div>
                ))
            ) : (
              // Sử dụng ảnh mặc định nếu không có images
              <>
                <div className="product-option-item-home">
                  <img src={Img2} alt="product" />
                </div>
                <div className="product-option-item-home">
                  <img src={Img3} alt="product" />
                </div>
                <div className="product-option-item-home">
                  <img src={Img4} alt="product" />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="detail-home-product-info">
          <div className="detail-home-product-info-time">
            <img src={IconClock} alt="time" className="ic_28" />
            <span>{currentTime || "Loading..."}</span>{" "}
          </div>

          <div className="detail-home-product-info-content">
            <span className="brand-home">
              {topProduct.brand || "Lay's Việt Nam"}
            </span>
            <span className="name-home">
              {topProduct.name || "Sản phẩm không có tên"}
            </span>
            <span className="price-home">{formatPrice(topProduct.price)}</span>
            <span className="description-home">
              {formatDescription(topProduct.description)}
            </span>
          </div>
          <span className="line-home"></span>
          <div className="detail-home-product-info-btn">
            <button className="btn-home-add-cart" onClick={handleAddToCart}>
              <img src={IconCart} alt="add cart" className="ic_28" />
              Add to bucket
            </button>
            <button className="btn-buy-now-home" onClick={handleBuyNow}>
              Buy now
            </button>
          </div>

          <div className="detail-home-product-info-footer">
            <div className="sold-home">
              <img src={IconSold} alt="sold" className="ic_28" />
              <p>{topProduct.sold || 0} sold</p>
            </div>
            <p className="categories-home">
              Categories: {topProduct.category?.name || "Chưa phân loại"}
            </p>
          </div>
        </div>
      </div>
      {/* Toast Container */}
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
    </>
  );
};

export default DetailProduct;
