import "./mightNeed.css";
import IconArrowRight from "../../assets/images/icons/ic_ arrow-right.svg";
import MightNeedItem from "./MightNeedItem/MightNeedItem";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopSellingProducts } from "../../Service/ProductService";

interface Product {
  id: number;
  name: string;
  price: number;
  weight: number;
  tag: string;
  img?: string;
  sold?: number;
  category?: {
    name?: string;
  };
}

function MightNeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSeeMoreClick = () => {
    navigate("/list_product");
  };

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        setLoading(true);
        setError(null); // Reset lỗi
        console.log("Đang gọi API lấy sản phẩm bán chạy (MightNeed)...");

        // Gọi hàm từ service, ví dụ lấy 10 sản phẩm
        const topProducts = await getTopSellingProducts(10);
        console.log("Dữ liệu API nhận được (MightNeed):", topProducts);

        // Service đã xử lý response, nên topProducts là mảng
        if (Array.isArray(topProducts)) {
          setProducts(topProducts);
          console.log(
            "Đã cập nhật state với dữ liệu sản phẩm (MightNeed):",
            topProducts
          );
        } else {
          // Trường hợp service trả về không phải mảng (ít khả năng xảy ra nếu service đúng)
          console.log("Dữ liệu trả về từ service không phải mảng (MightNeed)");
          setError("Không có sản phẩm");
          setProducts([]); // Đảm bảo state là mảng rỗng
        }
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm bán chạy (MightNeed):", err);
        setError("Không thể tải dữ liệu sản phẩm");
        setProducts([]); // Đảm bảo state là mảng rỗng khi lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellingProducts();
  }, []);

  console.log("Current products state:", products);
  console.log("Loading state:", loading);
  console.log("Error state:", error);

  return (
    <div className="might-need">
      <div className="might-need-header">
        <h2>You might need</h2>
        <span onClick={handleSeeMoreClick} style={{ cursor: "pointer" }}>
          See more <img src={IconArrowRight} alt="img-arrow-right" />
        </span>
      </div>
      <div className="might-need-list">
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div>{error}</div>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <MightNeedItem key={product.id} product={product} />
          ))
        ) : (
          <div>Không có sản phẩm</div>
        )}
      </div>
    </div>
  );
}

export default MightNeed;
