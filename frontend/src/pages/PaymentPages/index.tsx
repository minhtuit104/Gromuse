import { useState } from "react";
import "./paymentPage.css";
import IconVoucher from "../../assets/images/icons/ic_ voucher.svg";
import usePayment from "./usePayment";
import PaymentItem from "./paymentItem";
import AddressPayment from "./addressPayment";
import Header from "../../layouts/Header/Header";
import TextInput from "../../components/TextInput/TextInput";
import * as yup from "yup";
import { Formik, FormikProps } from "formik";
import RadioGroup from "../../components/Radio/radio";
import OrderDetails from "./orderDetail";
import ModalVoucher from "./modalVourcher";
import UpdateAddressModal from "./modalUpdateAddress";

export const PaymentPage = () => {
  const [isItemsVisible1, setIsItemsVisible1] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [isUpdateAddressModalOpen, setIsUpdateAddressModalOpen] =
    useState(false); // Trạng thái cho UpdateAddressModal
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false); // Trạng thái cho ModalVoucher
  const [address, setAddress] = useState({
    name: "Delivery to",
    phone: "123-456-7890",
    address: "55 Giai Phong, Hai Ba Trung, Ha Noi, Viet Nam",
  });

  const paymentState = usePayment();

  const handleOpenUpdateAddressModal = () => {
    setIsUpdateAddressModalOpen(true); // Mở modal UpdateAddress
  };

  const handleUpdateAddress = (newAddress: {
    name: string;
    phone: string;
    address: string;
  }) => {
    setAddress(newAddress); // Cập nhật thông tin địa chỉ
    setIsUpdateAddressModalOpen(false); // Đóng modal sau khi cập nhật
  };

  const handleUpdatePrice = (id: string, newAmount: number) => {
    console.log(`Updated product ${id} with new amount ${newAmount}`);
  };

  const toggleItems1 = () => {
    setIsItemsVisible1(!isItemsVisible1);
  };

  const schema = yup.object().shape({
    vourcher: yup.string().required("Bắt buộc"),
  });

  return (
    <div className="payment-page">
      <Header />
      <div className="payment_container">
        <div className="payment_left">
          <AddressPayment
            address={address}
            onEdit={handleOpenUpdateAddressModal}
          />
          <div className="payment_left_detail">
            <div className="payment_left_detail_name">Review item by store</div>
            <div className="payment_left_detail_line"></div>

            {paymentState?.data?.map((item: any, index: number) => (
              <PaymentItem
                key={item.id || index}
                item={item}
                isExpandable={index === paymentState.data.length - 1}
                onUpdateAmount={(id: string, newAmount: number) =>
                  handleUpdatePrice(id, newAmount)
                }
              />
            ))}
          </div>
        </div>

        <div className="payment_right">
          <div className="order-summary">
            <h2 className="order-summary-name">Order summary</h2>
            <div className="payment_right_line_1"></div>

            <RadioGroup
              options={[
                { value: "online", label: "Online Payment" },
                { value: "cod", label: "Cash on delivery" },
              ]}
              optionSelected={selectedPayment}
              onSelect={(value) => setSelectedPayment(Number(value))}
              labelStyle="font-size: 14px"
            />
            <Formik
              initialValues={{ vourcher: "" }}
              validationSchema={schema}
              onSubmit={(values) => console.log("submit")}
            >
              {(formikProps: FormikProps<{ vourcher: string }>) => (
                <TextInput
                  label="Voucher"
                  required
                  placeholder={"Enter voucher code ..."}
                  prefix={
                    <img
                      src={IconVoucher}
                      alt=""
                      className="ic_40 filtered-img"
                    />
                  }
                  suffix={
                    <button
                      className="view-button"
                      onClick={() => setIsVoucherModalOpen(true)} // Mở modal Voucher
                    >
                      View
                    </button>
                  }
                  onChange={formikProps.handleChange("vourcher")}
                  onBlur={formikProps.handleBlur("vourcher")}
                  value={formikProps.values.vourcher}
                  error={
                    formikProps.touched.vourcher
                      ? formikProps.errors.vourcher ?? ""
                      : ""
                  }
                />
              )}
            </Formik>

            <OrderDetails
              subtotal={35.75}
              deliveryFee={{
                original: 25.0,
                discounted: 15.0,
              }}
              couponDiscount={10.75}
              total={10.0}
            />
            <div className="actions">
              <button className="btn-confirm">Confirm Order</button>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Update Address */}
      <UpdateAddressModal
        isOpen={isUpdateAddressModalOpen}
        onClose={() => setIsUpdateAddressModalOpen(false)}
        onConfirm={handleUpdateAddress}
      />

      {/* Modal Voucher */}
      <ModalVoucher open={isVoucherModalOpen} setOpen={setIsVoucherModalOpen} />
    </div>
  );
};

export default PaymentPage;
