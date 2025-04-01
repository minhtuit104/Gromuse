import "./mightNeed.css";
import IconArrowRight from "../../assets/images/icons/ic_ arrow-right.svg";
import MightNeedItem from "./MightNeedItem/MightNeedItem";
import { useEffect, useState } from "react";
// import customAxios from "../../Service/axios";

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

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        setLoading(true);
        console.log("Đang gọi API lấy sản phẩm bán chạy...");

        // Gọi API trực tiếp với URL đầy đủ để debug
        const response = await fetch(
          "http://localhost:3000/api/products/most-sold/10"
        );
        const data = await response.json();
        console.log("Dữ liệu API nhận được:", data);

        // Kiểm tra và xử lý dữ liệu
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          console.log("Đã cập nhật state với dữ liệu sản phẩm:", data);
        } else if (data && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
          console.log("Đã cập nhật state với data.data:", data.data);
        } else {
          console.log("Không tìm thấy dữ liệu sản phẩm hợp lệ trong response");
          setError("Không có sản phẩm");
        }
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm bán chạy:", err);
        setError("Không thể tải dữ liệu sản phẩm");
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
        <span>
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
