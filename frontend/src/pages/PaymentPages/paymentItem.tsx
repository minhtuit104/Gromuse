
import React, { useState } from "react";
import "./paymentPage.css";
import ImgDetailLays from '../../assets/images/imagePNG/lays_1 1.png';
import IconMinus from '../../assets/images/icons/ic_frame_minus.svg';
import IconAdd from '../../assets/images/icons/ic_frame_add.svg';
import ImgDetailMax from '../../assets/images/imagePNG/lays_2.png';

interface PaymentItemProps {
    data: any,
    onUpdateAmount: () => void
}

export const PaymentItem = ({data} : PaymentItemProps) => {
  const [isItemsVisible, setIsItemsVisible] = useState(false);
  const [isItemsVisible1, setIsItemsVisible1] = useState(false);

  const toggleItems = () => {
    setIsItemsVisible(!isItemsVisible);
  };

  const toggleItems1 = () => {
    setIsItemsVisible1(!isItemsVisible1);
  };
  
  return (
    {data.map((item: any) => {
        <div>
            <div className='payment_left_detail_information_top'>
                <div className='payment_left_detail_information_top_header'>
                    <img src={item?.avatar} alt="avt_shop" className='img_shop'/>
                    <div className='payment_left_detail_information_shoppers'>
                    <div className='payment_left_detail_information_shoppers_text'>
                        <span className='text_1'>{item?.name}</span>
                        <span className='text_2'>Delivery in 15 minutes ago</span>
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
            isItemsVisible1 ? "product-card-show" : "product-card-hide"
            }`}
        >
        {item?.products?.map((product: any) => {
            <div className='product-card-information'>
            <img src={ImgDetailLays} alt="ImgDetailLays" className="product-image"/>
            <div className="product-info">
                <h2 className="product-name">{product?.name}</h2>
                <p className="product-weight">{product?.weight + 'g'}</p>
                <p className="product-price">1.29$</p>
            </div>
            <div className="quantity-control">
                <button className="quantity-btn"><img src={IconMinus} alt="IconMinus" className='ic_24'/></button>
                <span className="quantity">1</span>
                <button className="quantity-btn"><img src={IconAdd} alt="IconAdd" className='ic_24'/></button>
            </div>  
            </div>
        })}
            
            <div className='product-card-line'></div>
            <div className='product-card-information'>
            <img src={ImgDetailMax} alt="ImgDetailMax" className="product-image1"/>
            <div className="product-info1">
                <h2 className="product-name1">Snack Lays khoai tây tươi giòn rụm số 1 thế giới</h2>
                <p className="product-weight1">500g</p>
                <p className="product-price1">1.29$</p>
            </div>
            <div className="quantity-control1">
                <button className="quantity-btn1"><img src={IconMinus} alt="IconMinus" className='ic_24'/></button>
                <span className="quantity1">99+</span>
                <button className="quantity-btn1"><img src={IconAdd} alt="IconAdd" className='ic_24'/></button>
            </div>  
            </div>
            <div className='product-card-line'></div>
            <div className="product-card-seemore"><span>See more...</span></div>
        </div>
        </div>
        
    })}
    
  );
}

export default PaymentItem;
