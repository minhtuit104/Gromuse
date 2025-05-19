import "./header.css";
import IconList from "../../assets/images/icons/ic_ list.svg";
import IconSearch from "../../assets/images/icons/ic_ search.svg";
import IconCart from "../../assets/images/icons/ic_cart.svg";
import IconMessage from "../../assets/images/icons/ic_message.svg";
import IconLogOut from "../../assets/images/icons/ic_logout.svg";
import IconProduct from "../../assets/images/icons/ic_food.svg";
import IconOrder from "../../assets/images/icons/ic_order.svg";
import IconProfile from "../../assets/images/icons/ic_profile.svg";
import IconSetting from "../../assets/images/icons/ic_setting.svg";
import ImgAvatar from "../../assets/images/avt.jpg";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../../components/NotificationDropdown/NotificationDropdown";
import { useEffect, useState, useRef } from "react";
import { getCartCount } from "../../Service/CartService";
import { fetchUserConversationsCount } from "../../Service/MessageService";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  idUser: number;
  role?: number;
}

function Header() {
  const navigate = useNavigate();
  const [cartQuantity, setCartQuantity] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0); // Đổi tên state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCartQuantity = async () => {
    try {
      const response = (await getCartCount()) as any;
      if (response.message !== "success") {
        console.error(`Error fetching cart: ${response.status}`);
        return;
      }

      setCartQuantity(response.data);
    } catch (error) {
      console.error("Error fetching cart quantity:", error);
    }
  };

  useEffect(() => {
    fetchCartQuantity();

    const handleCartUpdate = () => {
      fetchCartQuantity();
    };

    // Lắng nghe sự kiện cập nhật giỏ hàng
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  // Fetch số lượng tin nhắn (cuộc trò chuyện) ban đầu cho user
  useEffect(() => {
    const token = localStorage.getItem("token");
    let currentUserId: number | null = null;
    let isUserRole = false; // Biến để kiểm tra có phải user thường không

    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.role === 1 || typeof decoded.role === "undefined") {
          currentUserId = decoded.idUser;
          isUserRole = true;
        }
      } catch (e) {
        console.error("[Header] Failed to decode token for user ID", e);
      }
    }

    if (currentUserId && isUserRole) {
      const fetchInitialMessageCount = async () => {
        try {
          const count = await fetchUserConversationsCount(); // API này lấy theo token
          if (typeof count === "number") {
            setUserMessageCount(count);
          } else {
            console.warn(
              "[Header] fetchUserConversationsCount did not return a number. Received:",
              count
            );
            setUserMessageCount(0);
          }
        } catch (error) {
          console.error(
            "[Header] Failed to fetch initial user message count:",
            error
          );
          setUserMessageCount(0);
        }
      };
      fetchInitialMessageCount();
    } else {
      setUserMessageCount(0); // Nếu không phải user hoặc không có token, đặt là 0
    }
  }, []); // Chạy một lần khi mount

  useEffect(() => {
    const handleUserConversationCountUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setUserMessageCount(customEvent.detail);
      }
    };
    window.addEventListener(
      "messagerUserConversationCountUpdate",
      handleUserConversationCountUpdate
    );
    return () => {
      window.removeEventListener(
        "messagerUserConversationCountUpdate",
        handleUserConversationCountUpdate
      );
    };
  }, []);

  const goToPaymentPage = () => {
    navigate("/payment");
  };

  const gotoHome = () => {
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
    console.log("User logged out.");
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const goToMessages = () => {
    navigate("/messager_user");
  };

  const goToProductList = () => {
    navigate("/list_product_User");
  };

  const goToOrderStatus = () => {
    navigate("/order_status");
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

        <div
          className="header-right-message"
          onClick={goToMessages}
          style={{ cursor: "pointer" }}
          title="Messages"
        >
          <img src={IconMessage} alt="icon-message" className="ic_16" />
          <span className="quantity">
            {userMessageCount > 9 ? "9+" : userMessageCount}
          </span>
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
              <div className="avatar_dropdown_item">
                {" "}
                <img src={IconProfile} alt="phone" className="ic_20" />
                Profile
              </div>
              <div className="avatar_dropdown_item">
                {" "}
                <img src={IconSetting} alt="phone" className="ic_20" />
                Settings
              </div>
              <div className="avatar-dropdown-item" onClick={goToProductList}>
                {" "}
                <img src={IconProduct} alt="product" className="ic_20" />
                Products
              </div>
              <div className="avatar-dropdown-item" onClick={goToOrderStatus}>
                {" "}
                <img src={IconOrder} alt="IconOrder" className="ic_20" />
                Orders
              </div>
              <div
                className="avatar-dropdown-item logout"
                onClick={handleLogout}
              >
                <img src={IconLogOut} alt="phone" className="ic_20" />
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
