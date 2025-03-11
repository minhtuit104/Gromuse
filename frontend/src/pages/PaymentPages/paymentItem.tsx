import React, { useState } from "react";
import "./paymentPage.css";
import ImgDetailLays from "../../assets/images/imagePNG/lays_1 1.png";
import IconMinus from "../../assets/images/icons/ic_frame_minus.svg";
import IconAdd from "../../assets/images/icons/ic_frame_add.svg";
import IconUp from "../../assets/images/icons/ic_ up.svg";
import "./usePayment";

export interface Product {
  id: string;
  name: string;
  img: string;
  title: string;
  weight: number;
  price: number;
  amount: number;
  created_at: string;
}

export interface Shop {
  id: string;
  avatar: string;
  name: string;
  products: Product[];
}

interface PaymentItemProps {
  item: Shop;
  isExpandable: boolean;
  onUpdateAmount: (id: string, amount: number) => void;
}

export const PaymentItem = ({
  item,
  isExpandable,
  onUpdateAmount,
}: PaymentItemProps) => {
  const [isItemsVisible, setIsItemsVisible] = useState(false); // Điều khiển mở/đóng danh sách sản phẩm
  const [visibleItems, setVisibleItems] = useState(2); // Số lượng sản phẩm hiển thị

  const toggleItems = () => {
    setIsItemsVisible(!isItemsVisible);
  };

  const handleSeeMore = () => {
    setVisibleItems((prev) => Math.min(prev + 3, item.products.length)); // Tăng thêm 3 sản phẩm (tối đa là tổng sản phẩm)
  };

  return (
    <div className="payment_item" key={item.id}>
      <div className="payment_left_detail_information_top">
        <div className="payment_left_detail_information_top_header">
          <img src={item?.avatar} alt="avt_shop" className="img_shop" />
          <div className="payment_left_detail_information_shoppers">
            <div className="payment_left_detail_information_shoppers_text">
              <span className="text_1">{item?.name}</span>
              <span className="text_2">Delivery in 15 minutes ago</span>
            </div>
          </div>
        </div>
        <div className="icon_up" onClick={toggleItems}>
          <img
            src={IconUp}
            alt="icon_up"
            className={`ic_24 ${isItemsVisible ? "rotate" : ""}`}
          />
        </div>
      </div>
      <div
        className={`product-card ${
          isItemsVisible ? "product-card-show" : "product-card-hide"
        }`}
      >
        {item?.products
          ?.slice(0, visibleItems)
          ?.map((product: Product, index: number) => (
            <React.Fragment key={`product.id ${index}`}>
              <div
                key={`product.id ${index}`}
                className="product-card-information"
              >
                <img
                  src={product.img !== "string" ? product.img : ImgDetailLays}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-info">
                  <h2 className="product-name">{product?.title}</h2>
                  <p className="product-weight">{product?.weight + "g"}</p>
                  <p className="product-price">{product?.price + "$"}</p>
                </div>
                <div className="quantity-control">
                  <button
                    className="quantity-btn"
                    onClick={() =>
                      onUpdateAmount(product.id, product.amount - 1)
                    }
                  >
                    <img src={IconMinus} alt="IconMinus" className="ic_24" />
                  </button>
                  <span className="quantity">{product.amount}</span>
                  <button
                    className="quantity-btn"
                    onClick={() =>
                      onUpdateAmount(product.id, product.amount + 1)
                    }
                  >
                    <img src={IconAdd} alt="IconAdd" className="ic_24" />
                  </button>
                </div>
              </div>
              {index !== item?.products?.length - 1 ? (
                <div className="product-card-line"></div>
              ) : null}
            </React.Fragment>
          ))}
        {isExpandable &&
          visibleItems < item.products.length &&
          isItemsVisible && (
            <button className="see-more-btn" onClick={handleSeeMore}>
              See more ...
            </button>
          )}
      </div>
    </div>
  );
};

export default PaymentItem;
