import React from "react";
import "./paymentPage.css";
import IconLocation from "../../assets/images/icons/ic_location.svg";
import IconEdit from "../../assets/images/icons/ic_ edit.svg";
import ImgMap from "../../assets/images/imagePNG/city_map_vector.png";
import { AddressDto } from "../../dtos/address.dto";

interface AddressPaymentProps {
  address: AddressDto | null;
  onEdit: () => void;
  isLoading?: boolean;
}

const AddressPayment: React.FC<AddressPaymentProps> = ({
  address,
  onEdit,
  isLoading = false,
}) => {
  const displayName = address?.name || "Đang tải...";
  const displayPhone = address?.phone || "...";
  const displayAddress = address?.address || "...";

  return (
    <div className="payment_left_location">
      <div className="payment_left_location_top">
        <h1 className="payment_left_location_name">Delivery information</h1>
        <div className="payment_left_location_icon" onClick={onEdit}>
          <img src={IconEdit} alt="Edit Icon" className="ic_28" />
          <button className="edit-button" disabled={isLoading} onClick={onEdit}>
            {isLoading ? "Updating..." : "Edit"}
          </button>
        </div>
      </div>
      <div className="payment_left_line"></div>
      <div className="payment_left_location_bottom">
        <div className="payment_left_location_bottom_address">
          <img src={ImgMap} alt="Map Vector" className="map_image" />
          <div className="payment_left_location_bottom_ellipse">
            <img src={IconLocation} alt="Location Icon" className="ic_24" />
          </div>
        </div>
        <div className="payment_left_location_bottom_information">
          <h2 className="payment_left_location_bottom_information_name">
            {displayName}
          </h2>
          <div className="payment_left_location_bottom_information_address">
            <span>Phone: {displayPhone}</span>
            <span>Address: {displayAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressPayment;
