import { useState, useRef, useEffect } from "react";
import "./headerDashboard.css";
import TextInput from "../../../components/TextInput/TextInput";
import IconMenu from "../../../assets/images/icons/ic_menu.svg";
import IconSearch from "../../../assets/images/icons/ic_ search.svg";
import IconMess from "../../../assets/images/icons/ic_message.svg";
import IconProfile from "../../../assets/images/icons/ic_profile.svg";
import IconSetting from "../../../assets/images/icons/ic_setting.svg";
import ImgAvatar from "../../../assets/images/imagePNG/Avatar.png";
import IconLogOut from "../../../assets/images/icons/ic_logout.svg";
import SidebarShop from "../SideBarShop/SideBarShop";
import NotificationDashboard from "../NotificationDashboard/NotificationDashboard";
import { useNavigate } from "react-router-dom";

export interface DecodedShopToken {
  idAccount: number;
  idUser: number;
  email: string; // Đảm bảo có email
  name: string; // Đảm bảo có name
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
  shopId?: number; // Có thể có nếu là shop
}

function HeaderDashboard() {
  const [search, setSearch] = useState("");
  const [openSideBar, setOpenSideBar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [shopName, setShopName] = useState<string>("Shop");
  const [shopMessageCount, setShopMessageCount] = useState(0); // State mới cho số lượng tin nhắn
  const navigate = useNavigate();

  useEffect(() => {
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
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get shop name from localStorage on component mount
  useEffect(() => {
    const storedName = localStorage.getItem("shopName");
    if (storedName) setShopName(storedName);
  }, []);

  // Lắng nghe sự kiện cập nhật số lượng tin nhắn từ MessagerShop
  useEffect(() => {
    const handleConversationCountUpdate = (event: Event) => {
      // Ép kiểu event thành CustomEvent để truy cập detail
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setShopMessageCount(customEvent.detail);
      }
    };

    window.addEventListener(
      "messagerShopConversationCountUpdate",
      handleConversationCountUpdate
    );

    // Cleanup listener khi component unmount
    return () => {
      window.removeEventListener(
        "messagerShopConversationCountUpdate",
        handleConversationCountUpdate
      );
    };
  }, []); // Mảng dependency rỗng để chỉ chạy một lần khi mount và cleanup khi unmount

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/loginShop");
  };

  const goToShopMessages = () => {
    navigate("/messager_shop"); // Điều hướng đến trang MessagerShop
  };

  return (
    <div className="header_main">
      <div className="header_main_left">
        <div className="header_menu" onClick={() => setOpenSideBar(true)}>
          <img src={IconMenu} alt="icon_menu" className="ic_32" />
        </div>
        <SidebarShop open={openSideBar} onClose={() => setOpenSideBar(false)} />
        <div className="header_search">
          <TextInput
            style="search"
            placeholder="Search here"
            value={search}
            onChange={(value: string) => setSearch(value)}
            suffix={
              <img
                src={IconSearch}
                alt="Search"
                className="ic_32"
                style={{ cursor: "pointer" }}
              />
            }
          />
        </div>
      </div>

      <div className="header_main_right">
        <div className="header_right_left">
          <NotificationDashboard />
          <div
            className="header_right_icon"
            onClick={goToShopMessages}
            style={{ cursor: "pointer" }}
            title="Messages"
          >
            <img src={IconMess} alt="icon_mess" className="ic_24 icon_mess" />
            <span className="quantity_mess">
              {shopMessageCount > 9 ? "9+" : shopMessageCount}
            </span>
          </div>
        </div>
        <div className="separator"></div>
        <div className="header_right_avatar_container" ref={dropdownRef}>
          <div className="header_right_avatar" onClick={toggleDropdown}>
            <p>
              Hello, <i>{shopName}</i>
            </p>
            <img src={ImgAvatar} alt="avatar" />
          </div>
          {showDropdown && (
            <div className="avatar_dropdown">
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
              <div
                className="avatar_dropdown_item logout"
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

export default HeaderDashboard;
