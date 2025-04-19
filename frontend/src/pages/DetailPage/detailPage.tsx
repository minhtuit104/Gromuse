// src/pages/DetailPage.tsx
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
import { useParams, useNavigate } from "react-router-dom";
import iconStar from "../../assets/images/icons/ic_star_fill.svg";
import ImgRate from "../../assets/images/imagePNG/beef 1.png";
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

const DetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const productResponse = await fetch(
          `http://localhost:3000/api/products/${id}` // API lấy sản phẩm
        );

        if (!productResponse.ok) {
          if (productResponse.status === 404) {
            throw new Error("Product not found.");
          }
          throw new Error(
            `Unable to load product information (${productResponse.status})`
          );
        }

        const productData = await productResponse.json();
        setProduct(productData);

        // Cập nhật ảnh chính
        if (productData.images && productData.images.length > 0) {
          setMainImage(productData.images[0]);
        } else if (productData.img) {
          setMainImage(productData.img);
        } else {
          setMainImage(Img1);
        }

        if (productData.shop && productData.shop.id) {
          try {
            const shopResponse = await fetch(
              `http://localhost:3000/api/shops/${productData.shop.id}`
            );
            if (shopResponse.ok) {
              const shopData = await shopResponse.json();
              setShop(shopData);
            } else {
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
          setShop({
            id: 0,
            name: "Gromuse Store",
            avatar: DefaultAvatar,
          });
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        setError(
          error instanceof Error ? error.message : "An undefined error occurred"
        );
        setProduct(null);
        setShop(null);
      } finally {
        setLoading(false);
      }
    };

    if (id && !isNaN(parseInt(id))) {
      fetchData();
    } else {
      setError("Invalid Product ID.");
      setLoading(false);
    }
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

  const handleImageClick = (imageUrl: string) => {
    setMainImage(imageUrl);
  };

  const formatDescription = (description: string | undefined) => {
    if (!description) return "Chưa có mô tả chi tiết cho sản phẩm này.";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(description, "text/html");
      return doc.body.textContent?.replace(/\s+/g, " ").trim() || "";
    } catch (e) {
      console.error("Error parsing description HTML:", e);
      return description
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  };

  const addItemToCartAPI = async (
    userId: number,
    productId: number,
    quantity: number
  ): Promise<{ cartId: number | null; error?: string }> => {
    try {
      const response = await fetch("http://localhost:3000/cart-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, userId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        console.error("Add/Buy API Error Response:", errorData);
        return {
          cartId: null,
          error: `Lỗi HTTP ${response.status}: ${
            errorData.message || response.statusText
          }`,
        };
      }

      const addedItemData = await response.json();
      console.log("Add/Buy API Success Response:", addedItemData);

      if (addedItemData && addedItemData.cart && addedItemData.cart.id) {
        return { cartId: addedItemData.cart.id };
      } else {
        console.error(
          "Add/Buy API response invalid or missing cartId:",
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

  const handleAddToCart = async () => {
    if (!product?.id) {
      alert("Sản phẩm không hợp lệ!");
      return;
    }
    const userId = getUserIdFromToken();
    if (userId === null) {
      alert("Bạn cần đăng nhập để thực hiện chức năng này.");
      navigate("/login");
      return;
    }

    console.log(
      `[handleAddToCart] Adding productId: ${product.id}, quantity: ${quantity} to cart for userId: ${userId}`
    );
    const toastId = toast.loading("Đang thêm vào giỏ hàng...");

    const result = await addItemToCartAPI(userId, product.id, quantity);

    if (result.cartId) {
      toast.update(toastId, {
        render: "Đã thêm sản phẩm vào giỏ hàng!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      localStorage.setItem("cartUpdated", "true");

      localStorage.setItem("currentCartId", result.cartId.toString());
      localStorage.removeItem("buyNowCartId");
      localStorage.removeItem("isBuyNow");

      setTimeout(() => {
        navigate("/payment");
      }, 1500);
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
      alert("Sản phẩm không hợp lệ!");
      return;
    }
    const userId = getUserIdFromToken();
    if (userId === null) {
      alert("Bạn cần đăng nhập để thực hiện chức năng này.");
      navigate("/login");
      return;
    }

    console.log(
      `[handleBuyNow] Adding productId: ${product.id}, quantity: ${quantity} for userId: ${userId} and navigating`
    );
    const toastId = toast.loading("Đang chuẩn bị thanh toán...");

    const result = await addItemToCartAPI(userId, product.id, quantity);

    if (result.cartId) {
      localStorage.setItem("currentCartId", result.cartId.toString());
      localStorage.removeItem("buyNowCartId");
      localStorage.removeItem("isBuyNow");

      toast.update(toastId, {
        render: "Đang chuyển đến trang thanh toán...",
        type: "success",
        isLoading: false,
        autoClose: 1500,
      });

      // Chuyển hướng
      setTimeout(() => {
        navigate("/payment");
      }, 1500);
    } else {
      // Xử lý lỗi
      toast.update(toastId, {
        render: `Lỗi Mua ngay: ${result.error || "Lỗi không xác định"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (loading) return <div className="loading-spinner">Đang tải...</div>;
  if (error)
    return <div className="error-message">Lỗi tải sản phẩm: {error}</div>;
  if (!product)
    return <div className="error-message">Không tìm thấy sản phẩm.</div>;

  return (
    <div className="detail-page">
      <Header />
      <div className="detail-product-page">
        <div className="detail-product-information">
          {/* ... Phần hiển thị ảnh sản phẩm ... */}
          <div className="detail-product">
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
                  onError={(e) => (e.currentTarget.src = Img1)}
                />
              </div>
              <div className="detail-product-image-options">
                {(product.images && product.images.length > 0
                  ? product.images
                  : [product.img]
                )
                  .filter((imgUrl) => imgUrl)
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
                        onError={(e) => (e.currentTarget.src = Img1)}
                      />
                    </div>
                  ))}
              </div>
            </div>
            {/* ... Phần thông tin sản phẩm, nút bấm ... */}
            <div className="detail-product-info">
              <div className="detail-product-info-time">
                <img src={IconClock} alt="time" className="ic_28" />
                <span>18 : 00 : 24</span>
              </div>
              <div className="detail-product-info-content">
                <span className="name">{product.name}</span>
                <span className="price">{product.price.toFixed(2)} $</span>
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
        </div>
        <div className="line1"></div>
        <div className="detail-product-nameshop">
          <div className="detail-avatar">
            <img
              src={shop?.avatar || DefaultAvatar}
              alt="shop-avatar"
              onError={(e) => (e.currentTarget.src = DefaultAvatar)}
            />
          </div>
          <div className="detail-name">
            <img src={shopIcon} alt="shop" className="ic_32" />
            <span>{shop?.name || "Shop Name"}</span>{" "}
          </div>
        </div>

        <div className="detail-product-description">
          <h2>Description</h2>
          <div className="description-list">
            <p style={{ whiteSpace: "pre-wrap" }}>
              {formatDescription(product.description)}
            </p>
            <ul>
              {product.weight > 0 && <li>Weight: {product.weight}g</li>}
              {product.tag && <li>Tag: {product.tag}</li>}
            </ul>
          </div>
          <div className="ad-section">
            <img
              src={ImgDescription}
              alt="Smile with Lays this Tet"
              className="ad-image"
            />
          </div>
        </div>
        <span className="line"></span>
        <div className="rating-detail">
          <h2 className="rating-title-detail">Rate</h2>
          <span className="rating-score-detail">4.7</span>
          <img src={iconStar} alt="iconStar" className="ic_24 rating-icon" />
        </div>
        <div className="reviews-list-detail">
          <div className="review-item-detail">
            <div className="review-header-detail">
              <span className="reviewer-name-detail">ntluan</span>
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
            </div>
            <p className="review-text-detail">
              Sản phẩm cũng được không đến nỗi nào, tuyệt cà là vời, hình ảnh
              như thực tế
            </p>
            <img src={ImgRate} alt="ImgRate" className="ImgRate" />
          </div>
          <span className="rating-line"></span>
          <div className="review-item-detail">
            <div className="review-header-detail">
              <span className="reviewer-name-detail">ntluan</span>
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
              <img src={iconStar} alt="iconStar" className="ic_24" />
            </div>
            <p className="review-text-detail">
              Sản phẩm cũng được không đến nỗi nào, tuyệt cà là vời, hình ảnh
              như thực tế
            </p>
            <img src={ImgRate} alt="ImgRate" className="ImgRate" />
          </div>
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

export default DetailPage;
