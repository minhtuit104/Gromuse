import React from "react";
import { Modal } from "antd";
import "./paymentPage.css";
import ImgFreeShip from "../../assets/images/icons/ic_ free_ship.svg";
import usePayment from "./usePayment";

interface ModalVoucherProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface Voucher {
  id: string;
  type: "Free Ship" | "Discount";
  code: string;
  description: string;
  remaining: number;
}

const ModalVoucher: React.FC<ModalVoucherProps> = ({ open, setOpen }) => {
  const { vouchers } = usePayment();

  const renderVoucherList = (type: "Free Ship" | "Discount") => {
    return vouchers
      .filter((voucher) => voucher?.type === type)
      .map((voucher) => (
        <div className="voucher-item" key={voucher?.id}>
          <div className="voucher-iconfreeship">
            <img
              src={ImgFreeShip}
              alt="ImgFreeShip"
              className="ic_24 iconfreeship"
            />
            <span className="text-freeship">{voucher?.type}</span>
          </div>
          <div className="voucher-information">
            <span className="span1">{voucher?.code}</span>
            <span className="span2">{voucher?.description}</span>
            <span className="span3">
              Remaining: <p className="number">{voucher?.remaining}</p>
            </span>
          </div>
        </div>
      ));
  };

  return (
    <Modal
      title="Choose Voucher"
      centered
      open={open}
      onOk={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      width={1000}
      okText="Confirm"
      cancelText="Back"
    >
      <div className="voucher-line"></div>
      <div className="voucher-container">
        <h3>Free shipping code</h3>
        <div className="voucher-list">{renderVoucherList("Free Ship")}</div>

        <div className="voucher-line"></div>
        <h3>Discount code</h3>
        <div className="voucher-list">{renderVoucherList("Discount")}</div>
      </div>
    </Modal>
  );
};

export default ModalVoucher;
