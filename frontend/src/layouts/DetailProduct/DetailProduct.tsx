import { useEffect, useState } from "react";
import "./detailProduct.css";
// Giữ lại các ảnh mặc định để sử dụng trong trường hợp không có dữ liệu
import Img1 from "../../assets/images/imagePNG/lays_1 1.png";
import Img2 from "../../assets/images/imagePNG/lays_2.png";
import Img3 from "../../assets/images/imagePNG/lays_3.png";
import Img4 from "../../assets/images/imagePNG/lays_4.png";
import IconClock from "../../assets/images/icons/ic_ clock.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconSold from "../../assets/images/icons/ic_ flame.svg";
import { getTopSellingProducts } from "../../Service/ProductService";

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

const DetailProduct = () => {
  const [topProduct, setTopProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopProduct = async () => {
      try {
        setLoading(true);
        console.log("Bắt đầu gọi API lấy sản phẩm bán chạy nhất");

        // Gọi API với limit = 1 để lấy sản phẩm bán chạy nhất
        const response = await getTopSellingProducts(1);
        console.log("Dữ liệu API trả về:", response);

        // Kiểm tra cấu trúc dữ liệu trả về
        if (response) {
          // Kiểm tra nếu response là một mảng
          if (Array.isArray(response) && response.length > 0) {
            setTopProduct(response[0]);
            console.log("Sản phẩm bán chạy nhất (từ mảng):", response[0]);
          }
          // Kiểm tra nếu response có thuộc tính data là một mảng
          else if (
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            setTopProduct(response.data[0]);
            console.log(
              "Sản phẩm bán chạy nhất (từ response.data):",
              response.data[0]
            );
          }
          // Kiểm tra nếu response là một đối tượng sản phẩm trực tiếp
          else if (response.data?.id) {
            setTopProduct(response.data);
            console.log(
              "Sản phẩm bán chạy nhất (đối tượng trực tiếp):",
              response.data
            );
          } else {
            setError("Không tìm thấy sản phẩm nào");
            console.log(
              "Không nhận dạng được cấu trúc dữ liệu trả về:",
              response
            );
          }
        } else {
          setError("Không nhận được dữ liệu từ API");
          console.log("Response rỗng hoặc undefined");
        }
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm bán chạy nhất:", err);
        setError(
          `Không thể tải sản phẩm: ${
            err instanceof Error ? err.message : "Vui lòng thử lại sau"
          }`
        );
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

  // Hàm xử lý description để loại bỏ thẻ <p> và </p>
  const formatDescription = (description: string | undefined) => {
    if (!description) return "Chưa có mô tả chi tiết cho sản phẩm này.";

    return description
      .replace(/^<p>|<\/p>$/g, "") // Loại bỏ <p> ở đầu và </p> ở cuối
      .trim();
  };

  if (loading) {
    return <div className="loading">Đang tải sản phẩm...</div>;
  }

  if (error && !topProduct) {
    return <div className="error">{error}</div>;
  }

  if (!topProduct) {
    return <div className="empty">Không có sản phẩm nào</div>;
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
            <span>18 : 00 : 25</span>
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
            <button className="btn-home-add-cart">
              <img src={IconCart} alt="add cart" className="ic_28" />
              Add to bucket
            </button>
            <button className="btn-buy-now-home">Buy now</button>
          </div>

          <div className="detail-home-product-info-footer">
            <div className="sold-home">
              <img src={IconSold} alt="sold" className="ic_28" />
              <p>{topProduct.sold || 0} sold in last 35 hours</p>
            </div>
            <p className="categories-home">
              Categories: {topProduct.category?.name || "Chưa phân loại"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailProduct;
