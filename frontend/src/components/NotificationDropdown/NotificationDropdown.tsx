import { useState, useRef, useEffect } from "react";
import "./NotificationDropdown.css";
import ImgSP from "../../assets/images/imagePNG/lays_4.png";
import IconNotification from "../../assets/images/icons/ic_notification.svg";
import Iconpolygon from "../../assets/images/icons/ic_polygon.svg";
import { useNavigate } from "react-router-dom"; // <<< THÊM DÒNG NÀY

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate(); // <<< KHỞI TẠO NAVIGATE

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSeeAllClick = () => {
    navigate("/notification");
    setIsOpen(false);
  };

  return (
    <div className="notification-container-cpn" ref={dropdownRef}>
      <div className="header-right-notification" onClick={toggleDropdown}>
        <img src={IconNotification} alt="icon-notification" className="ic_16" />
        <span className="quantity">21</span>
      </div>

      {isOpen && (
        <>
          <div className="notification-arrow">
            <img src={Iconpolygon} alt="Iconpolygon" className="ic_24 arrow" />
          </div>
          <div className="notification-dropdown">
            <div className="notification-list-cpn">
              <div className="notification-item-cpn accepted">
                <div className="notification-icon">
                  <img src={ImgSP} alt="store" />
                </div>
                <div className="notification-content">
                  <div className="notification-text-cpn">
                    <span className="store-name-cpn">Product Name</span>{" "}
                    accepted your order.
                  </div>
                </div>
              </div>

              <div className="notification-item-cpn canceled">
                <div className="notification-icon">
                  <img src={ImgSP} alt="store" />
                </div>
                <div className="notification-content">
                  <div className="notification-text-cpn">
                    <span className="store-name-cpn">Product Name</span>{" "}
                    canceled your order.
                  </div>
                </div>
              </div>

              <div className="notification-item-loadding">
                <div className="notification-icon-load"></div>
                <div className="list-loadding">
                  <div className="loadding-item1"></div>
                  <div className="loadding-item2"></div>
                </div>
              </div>
            </div>
            <div className="notification-header-cpn">
              <span className="see-all" onClick={handleSeeAllClick}>
                {" "}
                {/* <<< THÊM onClick */}
                See all
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationDropdown;
