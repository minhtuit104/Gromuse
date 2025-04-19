import React, { useState, useEffect } from "react";
import HeaderDashboard from "../DashboardPage/Header/HeaderDashboard";
import "./ListProduct.css";
import ImgProducts1 from "../../assets/images/imagePNG/vegetables_icon 1.png";
import ImgProducts2 from "../../assets/images/imagePNG/bread_icon 1.png";
import ImgProducts3 from "../../assets/images/imagePNG/fruits_icon 1.png";
import ImgProducts4 from "../../assets/images/imagePNG/meats_icon 1.png";
import ImgProducts5 from "../../assets/images/imagePNG/milks_icon 1.png";
import IconEditBtn from "../../assets/images/icons/ic_ edit.svg";
import { getAllProducts } from "../../Service/ProductService";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  img?: string;
  price: number;
  sold: number;
  category: {
    name: string;
  };
  shop?: {
    name: string;
  };
  tag: string;
  discount?: number;
}

const ListProduct: React.FC = () => {
  // Sử dụng state để lưu trữ dữ liệu sản phẩm
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productsPerPage] = useState<number>(10);

  const navigate = useNavigate();

  // Gọi API để lấy dữ liệu sản phẩm khi component được mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        console.log("Fetched products:", data);
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error("Không thể lấy dữ liệu sản phẩm:", err);
        setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
        setProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Hàm xử lý sự kiện sửa sản phẩm
  const handleEditProduct = (event: React.MouseEvent, productId: number) => {
    event.stopPropagation();
    console.log(`Đang sửa sản phẩm với ID: ${productId}`);
    navigate(`/add_product/${productId}`);
  };

  // Hàm xử lý khi người dùng click vào sản phẩm
  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  // Tính toán các sản phẩm hiện tại cho trang hiện tại
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Thay đổi trang
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

  // Tính tổng số trang
  const totalPages = Math.ceil(products.length / productsPerPage);

  // Component hiển thị sản phẩm
  const ProductItem: React.FC<{ product: Product }> = ({ product }) => {
    // Tính toán giá sau khi giảm giá (nếu có)
    const finalPrice = product.discount
      ? product.price * (1 - product.discount / 100)
      : product.price;

    return (
      <div
        className="product-card-list-info"
        onClick={() => handleProductClick(product.id)}
      >
        <div className="product-image">
          <img
            src={product.img || ImgProducts1}
            alt={product.name}
            onError={(e) => {
              // Nếu hình ảnh không tải được, sử dụng ảnh mặc định
              (e.target as HTMLImageElement).src = ImgProducts1;
            }}
          />
        </div>
        <div className="product-details">
          <h3>{product.name}</h3>
          <p>
            (
            {product.shop?.name ||
              product.category?.name ||
              "Không có danh mục"}
            )
          </p>
          <div className="product-price-list">{finalPrice.toFixed(2)} $</div>
          <div className="product-stats">
            Revenue: <span className="orange">{product.sold}</span>
          </div>
          <div
            className="edit-button-list"
            onClick={(e) => handleEditProduct(e, product.id)}
          >
            <img src={IconEditBtn} alt="IconEditBtn" className="ic_32" />
          </div>
        </div>
      </div>
    );
  };

  // Component phân trang
  const Pagination: React.FC = () => {
    return (
      <div className="pagination">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`pagination-button ${currentPage === 1 ? "disabled" : ""}`}
        >
          &laquo;
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`pagination-button ${
              currentPage === number ? "active" : ""
            }`}
          >
            {number}
          </button>
        ))}

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
    );
  };

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className="category-container">
        <HeaderDashboard />
        <div className="container-list-product">
          <p>Đang tải dữ liệu sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <div className="category-container">
        <HeaderDashboard />
        <div className="container-list-product">
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  // Tạo mảng chứa các sản phẩm được chia thành các nhóm để hiển thị
  const productGroups = [];
  const productsArray = currentProducts || []; // Sử dụng currentProducts thay vì products
  for (let i = 0; i < productsArray.length; i += 2) {
    productGroups.push(productsArray.slice(i, i + 2));
  }

  return (
    <div className="category-container">
      <HeaderDashboard />
      <div className="container-list-product">
        <h2 className="category-name">Categories</h2>
        <div className="categories">
          <div className="category-card active">
            <div className="category-content">
              <h3>Vegetables</h3>
              <p>Local market</p>
            </div>
            <img src={ImgProducts1} alt="Vegetables" />
          </div>
          <div className="category-card">
            <div className="category-content">
              <h3>Breads</h3>
              <p>In store delivery</p>
            </div>
            <img src={ImgProducts2} alt="Fruits" />
          </div>
          <div className="category-card">
            <div className="category-content">
              <h3>Fruits</h3>
              <p>Chemical free</p>
            </div>
            <img src={ImgProducts3} alt="Meats" />
          </div>
          <div className="category-card">
            <div className="category-content">
              <h3>Meats</h3>
              <p>Frozen meal</p>
            </div>
            <img src={ImgProducts4} alt="Dairy" />
          </div>
          <div className="category-card">
            <div className="category-content">
              <h3>Milks & drinks</h3>
              <p>Process food</p>
            </div>
            <img src={ImgProducts5} alt="Drinks" />
          </div>
        </div>

        <h2 className="name-product">Products</h2>

        {productsArray.length === 0 ? (
          <p>Không có sản phẩm nào.</p>
        ) : (
          <>
            <div className="products-grid">
              {productGroups.map((group, index) => (
                <div key={`group-${index}`} className="product-card-list">
                  {group.map((product) => (
                    <ProductItem key={product.id} product={product} />
                  ))}
                </div>
              ))}
            </div>

            {/* Hiển thị phân trang chỉ khi có nhiều hơn 1 trang */}
            {totalPages > 1 && <Pagination />}
          </>
        )}
      </div>
    </div>
  );
};

export default ListProduct;
