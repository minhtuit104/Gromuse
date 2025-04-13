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
        const productResponse = await fetch(
          `http://localhost:3000/api/products/${id}`
        );

        if (!productResponse.ok) {
          throw new Error("Unable to load product information");
        }

        const productData = await productResponse.json();
        setProduct(productData);

        if (productData.images && productData.images.length > 0) {
          setMainImage(productData.images[0]);
        } else if (productData.img) {
          setMainImage(productData.img);
        }

        // Fetch shop data từ API dựa vào shopId từ product
        if (productData.shop && productData.shop.id) {
          const shopResponse = await fetch(
            `http://localhost:3000/api/shops/${productData.shop.id}`
          );
          if (shopResponse.ok) {
            const shopData = await shopResponse.json();
            setShop(shopData);
          } else {
            // Fallback nếu không lấy được thông tin shop
            setShop({
              id: productData.shop.id,
              name: "Store",
              avatar: DefaultAvatar,
            });
          }
        } else {
          setShop({
            id: 1,
            name: "Lay's Việt Nam",
            avatar: DefaultAvatar,
          });
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An undefined error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleImageClick = (imageUrl: string) => {
    setMainImage(imageUrl);
  };

  const handleBuyNow = async () => {
    if (!product?.id) {
      alert("Invalid product!");
      return;
    }

    if (!shop?.id) {
      alert("Invalid store information!");
      return;
    }

    try {
      // Tạo một cart mới chỉ chứa sản phẩm hiện tại
      const response = await fetch("http://localhost:3000/cart/buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          shopId: shop.id,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `HTTP Error! Status: ${response.status}${
            errorData ? ` - ${JSON.stringify(errorData)}` : ""
          }`
        );
      }

      const data = await response.json();

      if (data && data.cartId) {
        // Lưu cartId từ response
        localStorage.setItem("cartId", data.cartId.toString());
        localStorage.setItem("isBuyNow", "true"); // Thêm flag để phân biệt

        // Hiển thị thông báo thành công
        alert("Added to cart and redirecting to payment!");

        // Chuyển đến trang thanh toán
        navigate("/payment");
      } else {
        throw new Error("API did not return a valid cart ID.");
      }
    } catch (error) {
      console.error("Error when buying now:", error);
      alert(
        "Error when buying now: " +
          (error instanceof Error ? error.message : "Please try again!")
      );
    }
  };

  const handleAddToCart = async () => {
    if (!product?.id) {
      alert("Invalid product!");
      return;
    }

    if (!shop?.id) {
      alert("Invalid store information!");
      return;
    }

    try {
      // Kiểm tra xem đã có giỏ hàng chưa
      let cartId = 0; // Giá trị mặc định
      const existingCartId = localStorage.getItem("cartId");

      if (existingCartId && !isNaN(parseInt(existingCartId))) {
        cartId = parseInt(existingCartId);
      }

      // Thêm sản phẩm vào giỏ hàng
      const response = await fetch("http://localhost:3000/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          shopId: shop.id,
          cartId: cartId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Lỗi HTTP! Trạng thái: ${response.status}${
            errorData ? ` - ${JSON.stringify(errorData)}` : ""
          }`
        );
      }

      const data = await response.json();

      // Lưu cartId từ response
      if (data) {
        let newCartId = null;

        if (data.id) {
          newCartId = data.id;
        } else if (data.cartId) {
          newCartId = data.cartId;
        } else if (data.cart && data.cart.id) {
          newCartId = data.cart.id;
        }

        if (newCartId) {
          localStorage.setItem("cartId", newCartId.toString());
          localStorage.setItem("cartUpdated", "true");

          // Thông báo thành công
          alert("Added to cart!");

          // Chuyển đến trang thanh toán
          navigate("/payment");
        } else {
          throw new Error("API did not return a valid cart ID.");
        }
      } else {
        throw new Error("API did not return valid data.");
      }
    } catch (error) {
      console.error("Error when adding to cart:", error);
      alert(
        "Error when adding to cart: " +
          (error instanceof Error ? error.message : "Please try again!")
      );
    }
  };

  // Hàm xử lý description để loại bỏ thẻ <p> và </p>
  const formatDescription = (description: string | undefined) => {
    if (!description) return "Chưa có mô tả chi tiết cho sản phẩm này.";

    return description
      .replace(/^<p>|<\/p>$/g, "") // Loại bỏ <p> ở đầu và </p> ở cuối
      .trim();
  };

  if (loading) return <div className="loading-spinner">Đang tải...</div>;
  if (!product)
    return (
      <div className="error-message">
        Product does not exist or is loading...
      </div>
    );
  if (error) return <div className="error-message">Lỗi: {error}</div>;

  return (
    <div className="detail-page">
      <Header />
      <div className="detail-product-page">
        <div className="detail-product-information">
          <div className="detail-product">
            <div className="detail-product-image">
              <div className="detail-product-image-parent">
                <div className="sale">
                  <p>{product.discount || 0}%</p>
                  <span>Discount</span>
                </div>
                <img
                  src={mainImage || product.img || Img1}
                  alt={product.name}
                  className="main-product-image"
                  onError={(e) => (e.currentTarget.src = Img1)}
                />
              </div>
              <div className="detail-product-image-options">
                {(product.images && product.images.length > 0
                  ? product.images
                  : product.img
                  ? [product.img]
                  : []
                ).map((image, index) => (
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
            <div className="detail-product-info">
              <div className="detail-product-info-time">
                <img src={IconClock} alt="time" className="ic_28" />
                <span>18 : 00 : 24</span>
              </div>
              <div className="detail-product-info-content">
                <span className="name">{product.name}</span>
                <span className="price">{product.price} $</span>
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
                  <p>{product.sold || 0} sold in last 35 hours</p>
                </div>
                <p className="categories">
                  Category:
                  {product.category && <span> {product.category.name}</span>}
                </p>
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
            <span>{shop?.name || "Shop Name"}</span>
          </div>
        </div>
        <div className="detail-product-description">
          <h2>Description</h2>
          <div className="description-list">
            <p>
              {formatDescription(
                product.description || "No description for this product"
              )}
            </p>
            <ul>
              <li>Weight: {product.weight}g</li>
              <li>Tag: {product.tag}</li>
              {product.active ? <li>True</li> : <li>False</li>}
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
    </div>
  );
};

export default DetailPage;
