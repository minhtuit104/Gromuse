import { useState, useRef, useEffect } from "react";
import "./headerDashboard.css";
import TextInput from "../../../components/TextInput/TextInput";
import IconMenu from "../../../assets/images/icons/ic_menu.svg";
import IconSearch from "../../../assets/images/icons/ic_ search.svg";
import IconMess from "../../../assets/images/icons/ic_message.svg";
import ImgAvatar from "../../../assets/images/imagePNG/Avatar.png";
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
            <span className="quantity_mess">20</span>
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
              <div className="avatar_dropdown_item">Profile</div>
              <div className="avatar_dropdown_item">Settings</div>
              <div
                className="avatar_dropdown_item logout"
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

export default HeaderDashboard;
