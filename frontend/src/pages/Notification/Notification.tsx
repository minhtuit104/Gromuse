import "./Notification.css";
import Header from "../../layouts/Header/Header";
import ImgSP from "../../assets/images/imagePNG/lays_4.png";

const Notification = () => {
  return (
    <div className="notification-container">
      <Header />
      <div className="notifications">
        <div className="notifications-header">Notifications</div>
        <div className="order-card-line"></div>

        <div className="notification-item success">
          <div className="notification-logo">
            <img src={ImgSP} alt="Img Product" />
          </div>
          <div className="notification-text">
            <span className="store-name-product">Product Name</span>
            <span className="product-status">accepted your order.</span>
          </div>
        </div>

        <div className="notification-item error">
          <div className="notification-logo">
            <img src={ImgSP} alt="Img Product" />
          </div>
          <div className="notification-text">
            <span className="store-name-product">Product Name</span>
            <span className="product-status">canceled your order.</span>
          </div>
        </div>

        <div className="notification-item pending">
          <div className="empty-content-img"></div>
          <div className="empty-content-text">
            <div className="empty-content-text1"></div>
            <div className="empty-content-text2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
