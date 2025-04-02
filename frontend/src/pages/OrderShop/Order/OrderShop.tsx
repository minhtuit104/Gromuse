import { useState } from "react";
import Header from "../../../layouts/Header/Header";
import { useNavigate } from "react-router-dom";
import "./OrderShop.css";
import ImgProduct from "../../../assets/images/imagePNG/banana 1.png";
import IconArrowRight from "../../../assets/images/icons/ic_ arrow-right.svg";
import IconCheck from "../../../assets/images/icons/ic_ check.svg";
import IconClose from "../../../assets/images/icons/ic_ close.svg";
import IconSend from "../../../assets/images/icons/ic_ send.svg";

const OrderShop = () => {
  const [showCancelInput, setShowCancelInput] = useState(false);
  const navigate = useNavigate();

  const handleCloseClick = () => {
    setShowCancelInput(true);
  };

  const handleHistoryClick = () => {
    navigate("/order_history");
  };
  return (
    <div className="order_container">
      <Header />
      <div className="order_history">
        <div className="tabs">
          <div className="tab active">Orders</div>
          <div className="vertical_line">|</div>
          <div className="tab inactive" onClick={handleHistoryClick}>
            History
          </div>
        </div>

        <div className="order-list">
          <div className={`order-item ${showCancelInput ? "expanded" : ""}`}>
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
            <div className="price-info">
              <div className="old-price">79$</div>
              <div className="new-price">69$</div>
            </div>
            <div className="action-button">
              <div className="icon_check">
                <img src={IconCheck} alt="IconCheck" className="ic_28" />
              </div>
              <div className="icon_close" onClick={handleCloseClick}>
                <img src={IconClose} alt="IconClose" className="ic_24" />
              </div>
            </div>
            {showCancelInput && (
              <div className="cancel-reason-container">
                <input
                  type="text"
                  className="cancel-reason-input"
                  placeholder="Send reason cancel to buyer"
                />
                <button className="send-reason-button">
                  <img src={IconSend} alt="Send" className="ic_28 send-icon" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderShop;
