import React from "react";
import { Drawer } from "antd";
import ImgAvatar from "../../../assets/images/imagePNG/Avatar.png";
import IconDash from "../../../assets/images/icons/ic_dashboard.svg";
import IconProduct from "../../../assets/images/icons/ic_food.svg";
import IconDiscount from "../../../assets/images/icons/ic_discount_bold.svg";
import IconPhone from "../../../assets/images/icons/ic_phone.svg";
import "./sideBarShop.css";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const SidebarShop: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <Drawer
      placement="left"
      closable={true}
      onClose={onClose}
      open={open}
      width={340}
    >
      {/* User Info */}
      <div className="sidebar_header">
        <img src={ImgAvatar} alt="User Avatar" />
        <div className="sidebar_header_info">
          <h3>Ashfak Sayem</h3>
          <p>ashfaksayem@gmail.com</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="sidebar_body">
        <ul>
          <li>
            <img src={IconDash} alt="dashboard" className="ic_24" /> Dashboard
          </li>
          <li>
            <img src={IconProduct} alt="product" className="ic_24" /> Products
          </li>
          <li>
            <img src={IconDiscount} alt="discount" className="ic_24" />{" "}
            Discounts
          </li>
          <li>
            <img src={IconPhone} alt="phone" className="ic_24" /> Support
          </li>
        </ul>
      </div>
    </Drawer>
  );
};

export default SidebarShop;
