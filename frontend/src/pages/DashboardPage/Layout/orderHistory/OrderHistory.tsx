import React, { useState } from 'react';
import ImgAvatar from '../../../../assets/images/imagePNG/Avatar.png';
import IconDow from '../../../../assets/images/icons/id_down.svg';
import './orderHistory.css';


const OrderHistory: React.FC = () => {
    const [visibleItems, setVisibleItems] = useState<number>(6);

    // Tạo mảng dữ liệu lớn hơn để test
    const orders = new Array(12).fill({
        name: "Guy Hawkins",
        orderNumber: "#1510031",
        amount: "$19.89",
        avatar: ImgAvatar,
    });

    const handleShowMore = () => {
        setVisibleItems(prev => prev + 6);
    };

    const hasMoreItems = visibleItems < orders.length;

    return (
        <div className="order_history_container">
            <div className="order_history_header">
                <h3>Order History</h3>
                <div className='order_history_lable'>
                    <span className="total_amount">$1,375</span>
                    <div className='line'></div>
                    <span className="today_text">Today</span>
                </div>
            </div>

            <div className="order_list">
                {orders.slice(0, visibleItems).map((order, index) => (
                    <div className="order_item" key={index}>
                        <div className="order_info">
                            <img src={order.avatar} alt="User" className="avatar" />
                            <div>
                                <p className="name">{order.name}</p>
                                <p className="order_number">Number Order {order.orderNumber}</p>
                            </div>
                        </div>
                        <span className="order_amount">{order.amount}</span>
                    </div>
                ))}
            </div>

            {hasMoreItems && (
                <div className="view_full_history" onClick={handleShowMore}>
                    <span>See Full History</span>
                    <button className="arrow_down" onClick={handleShowMore}>
                        <img src={IconDow} alt="updow" className='ic_20' />
                    </button>
                </div>
            )}
        </div>
  );
};

export default OrderHistory