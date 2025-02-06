import React, { useState } from "react";
import "./paymentPage.css";
import IconVoucher from "../../assets/images/icons/ic_ voucher.svg";
import usePayment from "./usePayment";
import PaymentItem from "./paymentItem";
import AddressPayment from "./addressPayment";
import Header from "../../layouts/Header/Header";
import TextInput from "../../components/TextInput/TextInput";
import * as yup from "yup";
import { Formik, FormikHelpers, FormikProps, FormikValues } from "formik";

interface PaymentProps {
  vourcher: string;
}

export const PaymentPage = () => {
  const [isItemsVisible1, setIsItemsVisible1] = useState(false);
  const paymentState = usePayment();
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
            address={{
              name: "Delivery to",
              phone: "123-456-7890",
              address: "55 Giai Phong, Hai Ba Trung, Ha Noi, Viet Nam",
            }}
            onEdit={() => {
              console.log("Chỉnh sửa địa chỉ");
            }}
          />
          <div className="payment_left_detail">
            <div className="payment_left_detail_name">Review item by store</div>
            <div className="payment_left_detail_line"></div>

            {paymentState?.data?.map((item: any) => (
              <PaymentItem
                item={item}
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
            <div className="payment-method">
              <label>
                <input type="radio" name="payment" checked />
                <span>Online Payment</span>
              </label>
              <label>
                <input type="radio" name="payment" />
                <span>Cash on delivery</span>
              </label>
            </div>
            <div className="voucher-input">
              <div className="icon">
                <img src={IconVoucher} alt="" className="ic_40" />
              </div>
              <input type="text" placeholder="Enter voucher code ..." />
              <button className="view-button">View</button>
            </div>
            <Formik
              initialValues={{ vourcher: "" }}
              validationSchema={schema}
              onSubmit={(values) => console.log("submit")}
            >
              {(formikProps: FormikProps<{ vourcher: string }>) => (
                <TextInput
                  label="Điền đi"
                  required
                  placeholder={"Enter voucher code ..."}
                  prefix={<img src={IconVoucher} alt="" className="ic_40" />}
                  suffix={<button className="view-button" onClick={() => formikProps.handleSubmit()}>View</button>}
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

            <div className="voucher">
              <span>Vourcher code is invalid!</span>
            </div>

            <div className="order-details">
              <div className="detail">
                <span className="span1">Subtotal</span>
                <span className="span2">$ 35.75</span>
              </div>
              <div className="detail">
                <span className="span1">Delivery fee</span>
                <span className="span2">
                  <p>$ 25.00</p>$ 15.00
                </span>
              </div>
              <div className="detail">
                <span className="span1">Coupon Discount</span>
                <span className="span2">-$ 10.75</span>
              </div>
              <div className="payment_right_line_4"></div>
              <div className="total">
                <span className="span3">Total</span>
                <span className="span3">$ 10.0</span>
              </div>
            </div>
            <div className="actions">
              <button className="btn-confirm">Confirm Order</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
