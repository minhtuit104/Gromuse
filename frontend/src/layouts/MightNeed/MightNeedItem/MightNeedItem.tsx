import { useState } from "react";
import ImgItem1 from "../../../assets/images/imagePNG/green-broccoli1.png";
import IconPlus from "../../../assets/images/icons/ic_add.svg";
import "./MightNeedItem.css";
import Counter from "../../../components/CountBtn/CountBtn";
import { useNavigate } from "react-router-dom";

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

const MightNeedItem = ({ product }: { product: Product }) => {
  const [isCounterActive, setIsCounterActive] = useState(false);
  const navigate = useNavigate();

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn việc navigation khi click vào nút thêm
    setIsCounterActive(true);
  };

  const handleCountChange = (newCount: number) => {
    if (newCount < 1) {
      setIsCounterActive(false);
    }
  };

  const handleProductClick = () => {
    // Điều hướng đến trang chi tiết với ID sản phẩm
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="might-need-item-component" onClick={handleProductClick}>
      <div className="might-need-item">
        <div className="might-need-item-header">
          <img src={product.img || ImgItem1} alt={product.name} />
          {product.sold && product.sold > 0 && (
            <div className="sold-badge">{product.sold} đã bán</div>
          )}
        </div>
        <div className="might-need-item-body">
          <p className="might-need-item-name">{product.name}</p>
          <p className="might-need-item-source">{product.tag}</p>
          <span className="might-need-item-weight">{product.weight}g</span>
          <span className="might-need-item-price">{product.price} $</span>
        </div>
        <div
          className="might-need-item-footer"
          onClick={(e) => e.stopPropagation()}
        >
          {!isCounterActive ? (
            <button className="might-need-item-button" onClick={handleAddClick}>
              <img src={IconPlus} alt="img-plus" />
            </button>
          ) : (
            <div className="might-need-item-counter">
              <Counter
                initialCount={1}
                onChange={handleCountChange}
                allowZero={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MightNeedItem;
