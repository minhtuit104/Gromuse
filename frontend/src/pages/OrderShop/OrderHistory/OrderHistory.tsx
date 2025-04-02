import Header from "../../../layouts/Header/Header";
import { useNavigate } from "react-router-dom";
import "./OrderHistory.css";
import ImgProduct from "../../../assets/images/imagePNG/banana 1.png";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";

const OrderHistory = () => {
  const navigate = useNavigate();

  const handleOrdersClick = () => {
    navigate("/order_shop");
  };
  return (
    <div className="order_container">
      <Header />
      <div className="order_history">
        <div className="tabs">
          <div className="tab inactive" onClick={handleOrdersClick}>
            Orders
          </div>
          <div className="vertical_line">|</div>
          <div className="tab active">History</div>
        </div>

        <div className="order-list-history">
          <div className="product-image">
            <img src={ImgProduct} alt="ImgProduct" className="ic_40" />
          </div>
          <div className="product-info">
            <div className="product-name">Banana Premium Big size</div>
            <div className="product-quantity">x2</div>
          </div>
          <img
            src={IconArrowRight}
            alt="IconArrowRight"
            className="ic_20 arrow_right"
          />
          <div className="customer-info">
            <div className="customer-name">Nguyen Thanh Luan</div>
            <div className="customer-address">
              55 Giai Phong, Hai Ba Trung, Ha Noi, Viet Nam
            </div>
          </div>
          <div className="price-info-history">
            <div className="old-price">79$</div>
            <div className="new-price">69$</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
