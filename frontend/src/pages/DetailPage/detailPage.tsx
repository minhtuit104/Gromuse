import { useEffect, useState } from "react";
import "./detailPage.css";
import Header from "../../layouts/Header/Header";
import Counter from "../../components/CountBtn/CountBtn";
import Img1 from "../../assets/images/imagePNG/lays_1 1.png";
import DefaultAvatar from "../../assets/images/imagePNG/Avatar.png";
import ImgDescription from "../../assets/images/imagePNG/image 1.png";
import IconClock from "../../assets/images/icons/ic_ clock.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconSold from "../../assets/images/icons/ic_ flame.svg";
import shopIcon from "../../assets/images/icons/ic_ shop.svg";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import iconStarFill from "../../assets/images/icons/ic_star_fill.svg";
import iconStarEmpty from "../../assets/images/icons/ic_star_orange.svg";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface DecodedToken {
  idAccount: number;
  idUser: number;
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  discount: number;
  weight: number;
  tag: string;
  sold: number;
  category: { id: number; name: string };
  backgroundColor: string;
  description: string;
  img: string;
  images: string[];
  active: boolean;
  shop?: { id: number; name?: string; avatar?: string };
}

export interface Shop {
  id: number;
  avatar: string;
  name: string;
}

export interface RatingItem {
  id: number;
  userId: number;
  productId: number;
  cartItemId: number;
  rating: number;
  comment: string | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
  user: {
    idUser: number;
    name: string;
    avarta: string | null;
  };
}

interface CartItemApiResponse {
  id: number;
  quantity: number;
  cartId?: number;
  cart?: { id: number };
}

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuantityFromState = location.state?.quantity || 1;
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(initialQuantityFromState);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  const INITIAL_RATINGS_TO_SHOW = 2;

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
    const fetchData = async () => {
      if (!id || isNaN(parseInt(id))) {
        setError("Invalid Product ID.");
        setLoading(false);
        return;
      }
      const productId = parseInt(id);

      try {
        setLoading(true);
        setError(null);
        setRatings([]);
        setAverageRating(0);
        setRatingCount(0);
        setShowAllRatings(false);

        // 1. Fetch Product Data
        const productResponse = await fetch(
          `http://localhost:3000/api/products/${productId}`
        );
        if (!productResponse.ok) {
          if (productResponse.status === 404)
            throw new Error("Product not found.");
          throw new Error(
            `Unable to load product information (${productResponse.status})`
          );
        }
        const productData: Product = await productResponse.json();
        console.log("Fetched Product Data from API:", productData);
        setProduct(productData);

        // Cập nhật ảnh chính
        if (productData.images && productData.images.length > 0)
          setMainImage(productData.images[0]);
        else if (productData.img) setMainImage(productData.img);
        else setMainImage(Img1);

        // 2. Fetch Shop Data
        if (productData.shop && productData.shop.id) {
          try {
            const shopResponse = await fetch(
              `http://localhost:3000/api/shops/${productData.shop.id}`
            );
            if (shopResponse.ok) setShop(await shopResponse.json());
            else {
              console.warn(
                `Could not fetch shop details for ID: ${productData.shop.id}, using info from product.`
              );
              setShop({
                id: productData.shop.id,
                name: productData.shop.name || "Store",
                avatar: productData.shop.avatar || DefaultAvatar,
              });
            }
          } catch (shopError) {
            console.error(
              "Error fetching shop data, using info from product:",
              shopError
            );
            setShop({
              id: productData.shop.id,
              name: productData.shop.name || "Store",
              avatar: productData.shop.avatar || DefaultAvatar,
            });
          }
        } else {
          setShop({ id: 0, name: "Lays Việt Nam", avatar: DefaultAvatar });
        }

        // 3. Fetch Ratings Data
        console.log(`Fetching ratings for productId: ${productData.id}`);
        try {
          const ratingsResponse = await fetch(
            `http://localhost:3000/api/products/${productData.id}/ratings`
          );
          if (ratingsResponse.ok) {
            const ratingsData = await ratingsResponse.json();
            console.log("Ratings data received:", ratingsData);
            setRatings(ratingsData.data || []);
            setAverageRating(Number(ratingsData.average) || 0);
            setRatingCount(Number(ratingsData.count) || 0);
          } else {
            console.warn(
              `Could not fetch ratings for product ${productData.id}. Status: ${ratingsResponse.status}`
            );
            setRatings([]);
            setAverageRating(0);
            setRatingCount(0);
          }
        } catch (ratingError) {
          console.error("Error fetching ratings:", ratingError);
          setRatings([]);
          setAverageRating(0);
          setRatingCount(0);
        }
      } catch (error) {
        console.error("Error fetching product or related data:", error);
        setError(
          error instanceof Error ? error.message : "An undefined error occurred"
        );
        setProduct(null);
        setShop(null);
        setRatings([]);
        setAverageRating(0);
        setRatingCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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

  // Hàm xử lý click ảnh nhỏ (giữ nguyên)
  const handleImageClick = (imageUrl: string) => {
    setMainImage(imageUrl);
  };

  // Hàm format mô tả (giữ nguyên)
  const formatDescription = (description: string | undefined): string => {
    if (!description) return "Chưa có mô tả chi tiết cho sản phẩm này.";
    // Đơn giản hóa: chỉ loại bỏ thẻ HTML, giữ lại ngắt dòng nếu có
    return description
      .replace(/<[^>]*>/g, "")
      .replace(/\\n/g, "\n")
      .trim();
  };

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
        // Endpoint POST /cart-items
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
        }; // <<< Trả về cả cartItemId
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

  const handleAddToCart = async () => {
    if (!product?.id) {
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
      `[handleAddToCart] Adding productId: ${product.id}, quantity: ${quantity} to cart for userId: ${userId}`
    );
    const toastId = toast.loading("Đang thêm vào giỏ hàng...");

    const result = await callCartItemApi(userId, product.id, quantity);

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

  const handleBuyNow = async () => {
    if (!product?.id) {
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
      `[handleBuyNow] Adding productId: ${product.id}, quantity: ${quantity} for userId: ${userId} and proceeding to payment.`
    );
    const toastId = toast.loading("Đang xử lý...");

    const result = await callCartItemApi(userId, product.id, quantity);

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

  // Helper component để render sao
  const RenderStars = ({ rating }: { rating: number }) => {
    const totalStars = 5;
    const filledStars = Math.round(rating); // Làm tròn đến sao gần nhất
    return (
      <div className="star-rating-display">
        {[...Array(totalStars)].map((_, index) => (
          <img
            key={index}
            src={index < filledStars ? iconStarFill : iconStarEmpty}
            alt={index < filledStars ? "Filled Star" : "Empty Star"}
            className="ic_20" // Kích thước sao nhỏ hơn trong list
          />
        ))}
      </div>
    );
  };

  const handleSeeMoreRatings = () => {
    setShowAllRatings(true);
  };

  // --- Render Logic ---
  if (loading) return <div className="loading-spinner">Đang tải...</div>;
  if (error)
    return <div className="error-message">Lỗi tải sản phẩm: {error}</div>;
  if (!product)
    return <div className="error-message">Không tìm thấy sản phẩm.</div>;

  const displayRatings = showAllRatings
    ? ratings
    : ratings.slice(0, INITIAL_RATINGS_TO_SHOW);
  const hasMoreRatings = ratings.length > INITIAL_RATINGS_TO_SHOW;

  // --- JSX ---
  return (
    <div className="detail-page">
      <Header />
      <div className="detail-product-page">
        {/* --- Phần Thông tin Sản phẩm --- */}
        <div className="detail-product-information">
          {/* Ảnh sản phẩm */}
          <div className="detail-product-image">
            <div className="detail-product-image-parent">
              {product.discount > 0 && (
                <div className="sale">
                  <p>{product.discount}%</p>
                  <span>Discount</span>
                </div>
              )}
              <img
                src={mainImage}
                alt={product.name}
                className="main-product-image"
                onError={(e) => (e.currentTarget.src = Img1)} // Fallback
              />
            </div>
            <div className="detail-product-image-options">
              {/* Lọc bỏ URL ảnh rỗng hoặc null */}
              {(product.images && product.images.length > 0
                ? product.images
                : [product.img]
              )
                .filter((imgUrl): imgUrl is string => !!imgUrl) // Đảm bảo là string và không rỗng
                .map((image, index) => (
                  <div
                    className={`product-option-item ${
                      mainImage === image ? "active" : ""
                    }`}
                    key={`image-${index}`}
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image}
                      alt={`detail-option-${index}`}
                      onError={(e) => (e.currentTarget.src = Img1)} // Fallback
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Thông tin chi tiết và nút bấm */}
          <div className="detail-product-info">
            <div className="detail-product-info-time">
              <img src={IconClock} alt="time" className="ic_28" />
              <span>{currentTime || "Loading..."}</span>{" "}
            </div>
            <div className="detail-product-info-content">
              <span className="name">{product.name}</span>
              {/* Hiển thị giá gốc và giá sau giảm giá nếu có */}
              {typeof product.price === "number" ? (
                product.discount > 0 ? (
                  <div className="price-container">
                    <span className="original-price">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="discounted-price">
                      $
                      {(product.price * (1 - product.discount / 100)).toFixed(
                        2
                      )}
                    </span>
                  </div>
                ) : (
                  <span className="price">${product.price.toFixed(2)}</span>
                )
              ) : (
                <span className="price">N/A</span>
              )}
            </div>
            <span className="line"></span>
            <Counter
              initialCount={quantity}
              onChange={(newCount) => setQuantity(newCount)}
            />
            <div className="detail-product-info-btn">
              <button className="btn-add-cart" onClick={handleAddToCart}>
                <img src={IconCart} alt="add cart" className="ic_28" />
                Add to bucket
              </button>
              <button className="btn-buy-now" onClick={handleBuyNow}>
                Buy now
              </button>
            </div>
            <div className="detail-product-info-footer">
              <div className="sold">
                <img src={IconSold} alt="sold" className="ic_28" />
                <p>{product.sold || 0} sold</p>
              </div>
              {product.category && (
                <p className="categories">
                  Category: <span> {product.category.name}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="line1"></div>

        {/* --- Phần Thông tin Shop --- */}
        <div className="detail-product-nameshop">
          <div className="detail-avatar">
            <img
              src={shop?.avatar || DefaultAvatar}
              alt="shop-avatar"
              onError={(e) => (e.currentTarget.src = DefaultAvatar)} // Fallback
            />
          </div>
          <div className="detail-name">
            <img src={shopIcon} alt="shop" className="ic_32" />
            <span>{shop?.name || "Shop Name"}</span>{" "}
          </div>
        </div>

        {/* --- Phần Mô tả Sản phẩm --- */}
        <div className="detail-product-description">
          <h2>Description</h2>
          <div className="description-content">
            <p style={{ whiteSpace: "pre-wrap" }}>
              {formatDescription(product.description)}
            </p>
            <ul className="ul-info">
              {product.weight > 0 && <li>Weight: {product.weight}g</li>}
              {product.tag && <li>Tag: {product.tag}</li>}
            </ul>
          </div>
          {/* Phần quảng cáo nếu có */}
          <div className="ad-section">
            <img
              src={ImgDescription}
              alt="Smile with Lays this Tet"
              className="ad-image"
            />
          </div>
        </div>

        <span className="line"></span>

        {/* --- Phần Đánh giá Sản phẩm --- */}
        <div className="product-reviews-section">
          <h2 className="reviews-title">Product Review ({ratingCount})</h2>

          {ratingCount > 0 && (
            <div className="rating-summary">
              <h3 className="rating-title-detail">Rate: </h3>
              <span className="summary-score">{averageRating.toFixed(1)}</span>
              <span className="summary-max-score">/ 5</span>
              <RenderStars rating={averageRating} />
            </div>
          )}

          {/* Danh sách các đánh giá chi tiết */}
          <div className="reviews-list">
            {displayRatings.length > 0 ? (
              displayRatings.map((rating) => (
                <div key={rating.id} className="review-item">
                  <div className="review-author">
                    <div className="author-info">
                      <span className="author-name">
                        {rating.user?.name || "Anonymous"}
                      </span>
                      <RenderStars rating={rating.rating} />
                    </div>
                  </div>
                  <div className="review-content">
                    {rating.comment && (
                      <p className="review-text">{rating.comment}</p>
                    )}
                    {rating.images && rating.images.length > 0 && (
                      <div className="review-images">
                        {rating.images.map((imgUrl, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={imgUrl}
                            alt={`Review image ${imgIndex + 1}`}
                            className="review-image-item"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="review-separator"></span>
                </div>
              ))
            ) : (
              <p className="no-reviews-message">
                This product has no reviews yet!
              </p>
            )}
          </div>
          {!showAllRatings && hasMoreRatings && (
            <div className="see-more-container-rating">
              <button
                className="see-more-btn-rating"
                onClick={handleSeeMoreRatings}
              >
                See more reviews...
              </button>
            </div>
          )}
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
    </div>
  );
};

export default DetailPage;
