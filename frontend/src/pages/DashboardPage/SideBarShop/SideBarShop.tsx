import React, { useEffect, useState } from "react";
import { Drawer } from "antd";
import { useNavigate } from "react-router-dom";
import ImgAvatar from "../../../assets/images/imagePNG/Avatar.png";
import IconDash from "../../../assets/images/icons/ic_dashboard.svg";
import IconProduct from "../../../assets/images/icons/ic_food.svg";
import IconDiscount from "../../../assets/images/icons/ic_discount_bold.svg";
import IconPhone from "../../../assets/images/icons/ic_phone.svg";
import IconOrder from "../../../assets/images/icons/ic_order.svg";
import "./sideBarShop.css";

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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarShop: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState<string>("Shop Owner");
  const [shopEmail, setShopEmail] = useState<string>("shop@example.com");

  useEffect(() => {
    const storedName = localStorage.getItem("shopName");
    const storedEmail = localStorage.getItem("shopEmail");
    if (storedName) setShopName(storedName);
    if (storedEmail) setShopEmail(storedEmail);
  }, [open]); // Re-check when 'open' state changes

  // Hàm xử lý chuyển trang
  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Đóng sidebar sau khi chuyển trang
  };

  return (
    <Drawer
      placement="left"
      closable={true}
      onClose={onClose}
      open={open}
      width={340}
    >
      {/* Shop Info */}
      <div className="sidebar_header">
        <img src={ImgAvatar} alt="User Avatar" />
        <div className="sidebar_header_info">
          <h3 title={shopName}>{shopName}</h3>
          <p title={shopEmail}>{shopEmail}</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="sidebar_body">
        <ul>
          <li onClick={() => handleNavigation("/dashboard")}>
            <img src={IconDash} alt="dashboard" className="ic_24" /> Dashboard
          </li>
          <li onClick={() => handleNavigation("/list_product_Shop")}>
            <img src={IconProduct} alt="product" className="ic_24" /> Products
          </li>
          <li onClick={() => handleNavigation("/order_shop")}>
            <img src={IconOrder} alt="IconOrder" className="ic_24 order" />{" "}
            Orders
          </li>
          <li onClick={() => handleNavigation("/discounts")}>
            <img src={IconDiscount} alt="discount" className="ic_24" />{" "}
            Discounts
          </li>
          <li onClick={() => handleNavigation("/support")}>
            <img src={IconPhone} alt="phone" className="ic_24" /> Support
          </li>
        </ul>
      </div>
    </Drawer>
  );
};

export default SidebarShop;
