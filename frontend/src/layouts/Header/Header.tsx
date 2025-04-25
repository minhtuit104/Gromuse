import "./header.css";
import IconList from "../../assets/images/icons/ic_ list.svg";
import IconSearch from "../../assets/images/icons/ic_ search.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconMessage from "../../assets/images/icons/ic_message.svg";
import ImgAvatar from "../../assets/images/avt.jpg";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../../components/NotificationDropdown/NotificationDropdown";

function Header() {
  const navigate = useNavigate();

  const goToPaymentPage = () => {
    navigate("/payment");
  };

  const gotoHome = () => {
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentCartId");
    localStorage.removeItem("buyNowCartId");
    localStorage.removeItem("isBuyNow");
    localStorage.removeItem("cartUpdated");
    localStorage.removeItem("lastPaidCartId");
    localStorage.removeItem("userRole");
    navigate("/login");
    console.log("User logged out.");
  };

  return (
    <div className="header">
      <div className="header-left">
        <img src={IconList} alt="icon-list" className="ic_40" />
        <span className="name_app" onClick={gotoHome}>
          Gromuse
        </span>
      </div>
      <div className="header-middle">
        <input
          type="text"
          placeholder="Search for Grocery, Stores, Vegetables or Meat"
        />
        <img src={IconSearch} alt="icon-search" className="ic_32" />
      </div>
      <div className="header-right">
        <NotificationDropdown />

        <div className="header-right-message">
          <img src={IconMessage} alt="icon-message" className="ic_16" />
          <span className="quantity">53</span>
        </div>
        <div className="header-right-cart" onClick={goToPaymentPage}>
          <img src={IconCart} alt="icon-cart" className="ic_24" />
          <span className="quantity">53</span>
        </div>
        <div
          className="header-right-avatar"
          onClick={handleLogout}
          style={{ cursor: "pointer" }}
          title="Logout"
        >
          <img src={ImgAvatar} alt="img-avatar" />
        </div>
      </div>
    </div>
  );
}

export default Header;
