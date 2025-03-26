import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import "./paymentPage.css";
import ImgFreeShip from "../../assets/images/icons/ic_ free_ship.svg";

export interface Voucher {
  id: string | number;
  type: string;
  code: string;
  description: string;
  remaining: number;
}

interface ModalVoucherProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelectVoucher: (code: string) => void;
}

const ModalVoucher: React.FC<ModalVoucherProps> = ({
  open,
  setOpen,
  onSelectVoucher,
}) => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/payment/vouchers/available"
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Vouchers fetched:", data);

        // Đảm bảo dữ liệu được chuyển đổi đúng
        const formattedVouchers: Voucher[] = data.map((voucher: any) => ({
          id: voucher.id,
          type: voucher.type,
          code: voucher.code,
          description: voucher.description,
          remaining: voucher.remaining,
        }));

        setVouchers(formattedVouchers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setLoading(false);
      }
    };

    if (open) {
      fetchVouchers();
    }
  }, [open]);

  const renderVoucherList = (type: string) => {
    const filteredVouchers = vouchers.filter(
      (voucher) => voucher.type.toLowerCase() === type.toLowerCase()
    );

    console.log(`Vouchers for type ${type}:`, filteredVouchers);

    if (filteredVouchers.length === 0) {
      return <div>Không có voucher cho loại này</div>;
    }

    return filteredVouchers.map((voucher) => (
      <div
        className="voucher-item"
        key={voucher.id}
        onClick={() => {
          onSelectVoucher(voucher.code);
          setOpen(false);
        }}
      >
        <div className="voucher-iconfreeship">
          <img
            src={ImgFreeShip}
            alt="ImgFreeShip"
            className="ic_24 iconfreeship"
          />
          <span className="text-freeship">{voucher.type}</span>
        </div>
        <div className="voucher-information">
          <span className="span1">{voucher.code}</span>
          <span className="span2">{voucher.description}</span>
          <span className="span3">
            Remaining: <p className="number">{voucher.remaining}</p>
          </span>
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <Modal
        title="Choose Voucher"
        centered
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={1000}
      >
        <div>Đang tải vouchers...</div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal
        title="Choose Voucher"
        centered
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={1000}
      >
        <div>Lỗi: {error}</div>
      </Modal>
    );
  }

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
      <div className="voucher-line"></div>
    </Modal>
  );
};

export default ModalVoucher;
