import React, { useState } from "react";
import "./paymentPage.css";
import ImgMTC from "../../assets/images/imagePNG/Avatar.png";
import IconUp from "../../assets/images/icons/ic_ up.svg";
import ImgDetailLays from "../../assets/images/imagePNG/lays_1 1.png";
import IconMinus from "../../assets/images/icons/ic_frame_minus.svg";
import IconAdd from "../../assets/images/icons/ic_frame_add.svg";
import ImgDetailMax from "../../assets/images/imagePNG/lays_2.png";
import ImgWheat2 from "../../assets/images/imagePNG/wheat2.png";
import ImgBeef1 from "../../assets/images/imagePNG/beef 1.png";
import ImgAvocado1 from "../../assets/images/imagePNG/avocado 1.png";
import IconVoucher from "../../assets/images/icons/ic_ voucher.svg";
import usePayment from "./usePayment";
import PaymentItem from "./paymentItem";
import AddressPayment from "./addressPayment";
import Header from "../../layouts/Header/Header";

interface Product {
  id: string;
  name: string;
  img: string;
  title: string;
  weight: number;
  price: number;
  amount: number;
  created_at: string;
}

interface Shop {
  id: string;
  avatar: string;
  name: string;
  products: Product[];
}

interface PaymentState {
  handleGetAdressData: () => void;
  handleGetItemData: () => void;
  data: Shop[];
  setData: React.Dispatch<React.SetStateAction<Shop[]>>;
  handleUpdatePrice: (price: number, type: string) => void;
}

const data: Shop[] = [
  {
    id: "1",
    avatar: "avatar.png",
    name: "Lay's Việt Nam",
    products: [
      {
        id: "1",
        name: "Snack Lay's",
        img: "lays.png",
        title: "Snack Khoai Tây",
        weight: 500,
        price: 15.25,
        amount: 2,
        created_at: "2023-02-01",
      },
    ],
  },
];

const handleUpdatePrice = (id: string, newAmount: number) => {
  console.log(`Updated product ${id} with new amount ${newAmount}`);
};

export const PaymentPage = () => {
  const [isItemsVisible1, setIsItemsVisible1] = useState(false);
  const paymentState = usePayment() as unknown as PaymentState;

  const toggleItems1 = () => {
    setIsItemsVisible1(!isItemsVisible1);
  };
  return (
    <div className="payment-page">
      <Header />
      <div className="payment_container">
        <div className="payment_left">
          <AddressPayment
            address={{
              name: "Delivery to",
              phone: "123-456-7890",
              address: "55 Giai Phong, Hai Ba Trung, Ha Noi, Viet Nam",
            }}
            onEdit={() => {
              console.log("Chỉnh sửa địa chỉ");
            }}
          />
          <div className="payment_left_detail">
            <div className="payment_left_detail_name">Review item by store</div>
            <div className="payment_left_detail_line"></div>

            <PaymentItem data={data} onUpdateAmount={handleUpdatePrice} />

            <div className="store-container">
              <div className="store-header">
                <div className="store-info">
                  <img src={ImgMTC} alt="ImgMTC" className="store-logo" />
                  <div className="store-details">
                    <h3 className="store-name">Gromuse shop</h3>
                    <p className="delivery-time">Delivery in 21/11/2024</p>
                  </div>
                </div>
                <div className="icon_up">
                  <img src={IconUp} alt="icon_up" className="ic_24" />
                </div>
              </div>
              <div className="products">
                <img src={ImgWheat2} alt="ImgWheat2" />
                <img src={ImgBeef1} alt="ImgBeef1" />
                <img src={ImgAvocado1} alt="ImgAvocado1" />
                <span className="quantity1">+9</span>
              </div>
            </div>

            <div className="payment_left_detail_information_top">
              <div className="payment_left_detail_information_top_header">
                <img src={ImgMTC} alt="avt_shop" className="img_shop" />
                <div className="payment_left_detail_information_shoppers">
                  <div className="payment_left_detail_information_shoppers_text">
                    <span className="text_1">Lay's Việt Nam</span>
                    <span className="text_2">Delivery in 15 minutes ago</span>
                  </div>
                </div>
              </div>
              <div className="icon_up1" onClick={toggleItems1}>
                <img
                  src={IconUp}
                  alt="icon_up"
                  className={`ic_24 ${isItemsVisible1 ? "rotate" : ""}`}
                />
              </div>
            </div>
            <div
              className={`product-card ${
                isItemsVisible1 ? "product-card-show" : "product-card-hide"
              }`}
            >
              <div className="product-card-information">
                <img
                  src={ImgDetailLays}
                  alt="ImgDetailLays"
                  className="product-image"
                />
                <div className="product-info">
                  <h2 className="product-name">
                    Snack Lays khoai tây tươi giòn rụm số 1 thế giới
                  </h2>
                  <p className="product-weight">500g</p>
                  <p className="product-price">1.29$</p>
                </div>
                <div className="quantity-control">
                  <button className="quantity-btn">
                    <img src={IconMinus} alt="IconMinus" className="ic_24" />
                  </button>
                  <span className="quantity">1</span>
                  <button className="quantity-btn">
                    <img src={IconAdd} alt="IconAdd" className="ic_24" />
                  </button>
                </div>
              </div>
              <div className="product-card-line"></div>
              <div className="product-card-information">
                <img
                  src={ImgDetailMax}
                  alt="ImgDetailMax"
                  className="product-image1"
                />
                <div className="product-info1">
                  <h2 className="product-name1">
                    Snack Lays khoai tây tươi giòn rụm số 1 thế giới
                  </h2>
                  <p className="product-weight1">500g</p>
                  <p className="product-price1">1.29$</p>
                </div>
                <div className="quantity-control1">
                  <button className="quantity-btn1">
                    <img src={IconMinus} alt="IconMinus" className="ic_24" />
                  </button>
                  <span className="quantity1">99+</span>
                  <button className="quantity-btn1">
                    <img src={IconAdd} alt="IconAdd" className="ic_24" />
                  </button>
                </div>
              </div>
              <div className="product-card-line"></div>
              <div className="product-card-seemore">
                <span>See more...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="payment_right">
          <div className="order-summary">
            <h2 className="order-summary-name">Order summary</h2>
            <div className="payment_right_line_1"></div>
            <div className="payment-method">
              <label>
                <input type="radio" name="payment" checked />
                <span>Online Payment</span>
              </label>
              <label>
                <input type="radio" name="payment" />
                <span>Cash on delivery</span>
              </label>
            </div>
            <div className="voucher-input">
              <div className="icon">
                <img src={IconVoucher} alt="" className="ic_40" />
              </div>
              <input type="text" placeholder="Enter voucher code ..." />
              <button className="view-button">View</button>
            </div>
            <div className="voucher">
              <span>Vourcher code is invalid!</span>
            </div>

            <div className="order-details">
              <div className="detail">
                <span className="span1">Subtotal</span>
                <span className="span2">$ 35.75</span>
              </div>
              <div className="detail">
                <span className="span1">Delivery fee</span>
                <span className="span2">
                  <p>$ 25.00</p>$ 15.00
                </span>
              </div>
              <div className="detail">
                <span className="span1">Coupon Discount</span>
                <span className="span2">-$ 10.75</span>
              </div>
              <div className="payment_right_line_4"></div>
              <div className="total">
                <span className="span3">Total</span>
                <span className="span3">$ 10.0</span>
              </div>
            </div>
            <div className="actions">
              <button className="btn-confirm">Confirm Order</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
