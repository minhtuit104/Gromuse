import "./header.css";
import IconList from "../../assets/images/icons/ic_ list.svg";
import IconSearch from "../../assets/images/icons/ic_ search.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconMessage from "../../assets/images/icons/ic_message.svg";
import ImgAvatar from "../../assets/images/avt.jpg";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../../components/NotificationDropdown/NotificationDropdown";
import { useEffect, useState, useRef } from "react";

function Header() {
  const navigate = useNavigate();
  const [cartQuantity, setCartQuantity] = useState(0);
  const [messageCount, setMessageCount] = useState(53);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCartQuantity = async () => {
    try {
      const cartId = localStorage.getItem("currentCartId");
      if (!cartId) {
        setCartQuantity(0);
        return;
      }

      const response = await fetch(
        `http://localhost:3000/cart-items/cart/${cartId}`
      );
      if (!response.ok) {
        console.error(`Error fetching cart: ${response.status}`);
        return;
      }

      const cartData = await response.json();
      if (Array.isArray(cartData)) {
        const totalQuantity = cartData.reduce((sum, item) => {
          return sum + (Number(item.quantity) || 0);
        }, 0);
        setCartQuantity(totalQuantity);
      }
    } catch (error) {
      console.error("Error fetching cart quantity:", error);
    }
  };

  useEffect(() => {
    fetchCartQuantity();
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "cartUpdated" ||
        e.key === "currentCartId" ||
        e.key === "buyNowCartId"
      ) {
        fetchCartQuantity();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const handleCartUpdate = () => {
      fetchCartQuantity();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    document.addEventListener("cartUpdate", handleCartUpdate);
    const intervalId = setInterval(fetchCartQuantity, 30000);

    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      document.removeEventListener("cartUpdate", handleCartUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(intervalId);
    };
  }, []);

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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
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
          <span className="quantity">{messageCount}</span>
        </div>
        <div className="header-right-cart" onClick={goToPaymentPage}>
          <img src={IconCart} alt="icon-cart" className="ic_24" />
          <span className="quantity">{cartQuantity}</span>
        </div>
        <div className="header-right-avatar-container" ref={dropdownRef}>
          <div
            className="header-right-avatar"
            onClick={toggleDropdown}
            style={{ cursor: "pointer" }}
            title="User Profile"
          >
            <img src={ImgAvatar} alt="img-avatar" />
          </div>
          {showDropdown && (
            <div className="avatar-dropdown">
              <div className="avatar-dropdown-item">Profile</div>
              <div className="avatar-dropdown-item">Settings</div>
              <div
                className="avatar-dropdown-item logout"
                onClick={handleLogout}
              >
                Log out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
