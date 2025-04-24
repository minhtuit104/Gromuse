import { useState, useRef, useEffect } from "react";
import "./NotificationDashboard.css";
import ImgSP from "../../../assets/images/imagePNG/lays_4.png";
import Iconpolygon from "../../../assets/images/icons/ic_polygon.svg";
import IconNotifi from "../../../assets/images/icons/ic_notification.svg";

function NotificationDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="notification-container-dashboard" ref={dropdownRef}>
      <div className="header_right_icon" onClick={toggleDropdown}>
        <img src={IconNotifi} alt="icon_notifi" className="ic_24 icon_notifi" />
        <span className="quantity_notifi">9</span>
      </div>

      {isOpen && (
        <>
          <div className="notification-arrow-dashboard">
            <img
              src={Iconpolygon}
              alt="Iconpolygon"
              className="ic_24 arrow-dashboard"
            />
          </div>
          <div className="notification-dropdown-dashboard">
            <div className="notification-list-dashboard">
              <div className="notification-item-dashboard accepted">
                <div className="notification-icon">
                  <img src={ImgSP} alt="store" />
                </div>
                <div className="notification-content-dashboard">
                  <div className="notification-text-dashboard">
                    <span className="store-name-dashboard">Product Name</span>{" "}
                    set an order.
                  </div>
                </div>
              </div>

              <div className="notification-item-dashboard canceled">
                <div className="notification-icon">
                  <img src={ImgSP} alt="store" />
                </div>
                <div className="notification-content-dashboard">
                  <div className="notification-text-dashboard">
                    <span className="store-name-dashboard">Product Name</span>{" "}
                    canceled an order.
                  </div>
                </div>
              </div>

              <div className="notification-item-dashboard rated">
                <div className="notification-icon">
                  <img src={ImgSP} alt="store" />
                </div>
                <div className="notification-content-dashboard">
                  <div className="notification-text-dashboard">
                    <span className="store-name-dashboard">Product Name</span>{" "}
                    rated about your product.
                  </div>
                </div>
              </div>

              <div className="notification-item-loadding-dashboard">
                <div className="notification-icon-load-dashboard"></div>
                <div className="list-loadding-dashboard">
                  <div className="loadding-item1-dashboard"></div>
                  <div className="loadding-item2-dashboard"></div>
                </div>
              </div>
            </div>
            <div className="notification-header-dashboard">
              <span className="see-all-dashboard">See all</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationDashboard;
