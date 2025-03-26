import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./paymentPage.css";
import IconVoucher from "../../assets/images/icons/ic_ voucher.svg";
import usePayment from "./usePayment";
import PaymentItem from "./paymentItem";
import AddressPayment from "./addressPayment";
import Header from "../../layouts/Header/Header";
import TextInput from "../../components/TextInput/TextInput";
import * as yup from "yup";
import { Formik, FormikProps, Form } from "formik";
import RadioGroup from "../../components/Radio/radio";
import OrderDetails from "./orderDetail";
import ModalVoucher from "./modalVourcher";
import UpdateAddressModal from "./modalUpdateAddress";
import { AddressDto } from "../../dtos/address.dto";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const PaymentPage = () => {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [isUpdateAddressModalOpen, setIsUpdateAddressModalOpen] =
    useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isCartRemoved, setIsCartRemoved] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [address, setAddress] = useState<AddressDto>({
    name: "Delivery to",
    phone: "0912345678",
    address: "55 Giai Phong, Hai Ba Trung, Ha Noi, Viet Nam",
  });
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const deliveryFee = { original: 25.0, discounted: 15.0 };

  const paymentState = usePayment();
  const { data, loading, error, handleUpdatePrice, vouchers } = paymentState;

  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const allProducts = data.flatMap((shop) => shop.products);

    const shop1 = {
      id: 1,
      name: "Lay's Việt Nam",
      avatar: data[0]?.avatar || "../../assets/images/imagePNG/Avatar.png",
      deliveryInfo: "Delivery in 15 minutes ago",
      productIcons: true,
      products: allProducts.slice(0, 2),
    };

    const shop2 = {
      id: 2,
      name: "Lay's Việt Nam",
      avatar: data[0]?.avatar || "../../assets/images/imagePNG/Avatar.png",
      deliveryInfo: "Delivery in 15 minutes ago",
      productIcons: true,
      products: allProducts.slice(2),
    };

    return [shop1, ...(shop2.products.length > 0 ? [shop2] : [])];
  }, [data]);

  const calculatePrices = useCallback(() => {
    if (!processedData || processedData.length === 0) {
      setSubtotal(0);
      setTotal(15);
      setCouponDiscount(0);
      return;
    }
    // Tính tổng tiền dựa trên số lượng và giá của từng sản phẩm
    const newSubtotal = processedData.reduce(
      (sum, shop) =>
        sum +
        shop.products.reduce(
          (prodSum, prod) =>
            prodSum + (Number(prod.price) || 0) * (Number(prod.amount) || 1),
          0
        ),
      0
    );
    console.log("Tổng tiền tạm tính:", newSubtotal);
    setSubtotal(newSubtotal);

    // Tính giảm giá từ voucher
    let discount = 0;
    if (selectedVoucher) {
      const voucher = vouchers.find((v) => v.code === selectedVoucher);
      if (voucher) {
        if (voucher.type === "Free Ship") {
          discount = Math.min(
            voucher.maxDiscountValue || 20,
            deliveryFee.discounted
          );
        } else if (
          voucher.type === "Discount" &&
          newSubtotal >= (voucher.minOrderValue || 0)
        ) {
          discount = (newSubtotal * (voucher.maxDiscountValue || 10)) / 100;
        }
      }
    }
    setCouponDiscount(discount);

    const newTotal = newSubtotal + deliveryFee.discounted - discount;
    setTotal(Math.max(newTotal, 0));
  }, [processedData, selectedVoucher, vouchers, deliveryFee]);

  useEffect(() => {
    calculatePrices();
  }, [processedData, selectedVoucher, calculatePrices, data]);

  const handleUpdateProductPrice = useCallback(
    async (productId: string, newAmount: number) => {
      if (isCartRemoved || !localStorage.getItem("cartId")) {
        console.log("Giỏ hàng đã bị xóa hoặc không tồn tại, bỏ qua cập nhật");
        return;
      }

      try {
        const updateResult = await handleUpdatePrice(productId, newAmount);

        if (updateResult) {
          calculatePrices();
        }
      } catch (error) {
        console.error("Không thể cập nhật giá sản phẩm:", error);
      }
    },
    [handleUpdatePrice, calculatePrices, isCartRemoved]
  );

  useEffect(() => {
    const paymentSuccessful = localStorage.getItem("paymentSuccessful");
    const isBuyNow = localStorage.getItem("isBuyNow");

    if (isBuyNow === "true") {
      localStorage.removeItem("isBuyNow");
    }

    if (paymentSuccessful === "true") {
      localStorage.removeItem("paymentSuccessful");
      navigate("/");
      return;
    }

    const cartUpdated = localStorage.getItem("cartUpdated");
    if (cartUpdated === "true") {
      console.log("Cart was updated, refreshing data");
      localStorage.removeItem("cartUpdated");
    }
  }, [navigate]);

  const handleOpenUpdateAddressModal = () => {
    setIsUpdateAddressModalOpen(true);
  };

  const handleUpdateAddress = (newAddress: {
    name: string;
    phone: string;
    address: string;
  }) => {
    setAddress(newAddress);
    setIsUpdateAddressModalOpen(false);
  };

  const schema = yup.object().shape({
    vourcher: yup.string(),
  });

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus("");

      const cartId = localStorage.getItem("cartId");
      if (!cartId) {
        throw new Error("Không tìm thấy ID giỏ hàng");
      }

      if (
        !processedData ||
        processedData.length === 0 ||
        !processedData.some((shop) => shop.products && shop.products.length > 0)
      ) {
        throw new Error("Giỏ hàng trống, không có sản phẩm để thanh toán");
      }

      const paymentData = {
        paymentMethod: selectedPayment === 0 ? "online" : "cod",
        subtotal: subtotal,
        deliveryFeeOriginal: deliveryFee.original,
        deliveryFeeDiscounted: deliveryFee.discounted,
        couponDiscount: couponDiscount,
        total: total,
        address: {
          name: address.name,
          phone: formatPhoneNumber(address.phone).replace(/[^\d]/g, ""),
          address: address.address,
        },
        voucherCodes: selectedVoucher ? [selectedVoucher] : [],
        shops: processedData.map((shop) => ({
          id: shop.id,
          avatar: shop.avatar || "../../assets/images/imagePNG/Avatar.png",
          name: shop.name,
          deliveryInfo: shop.deliveryInfo,
          productIcons: shop.productIcons || true,
          products: shop.products.map((product) => ({
            id: Number(product.id),
            name: product.name,
            img: product.img,
            title: product.title,
            weight: Number(product.weight),
            price: Number(product.price),
            amount: Number(product.amount),
          })),
        })),
      };

      // Log để kiểm tra dữ liệu trước khi gửi
      console.log("cartId trước khi gửi:", cartId);
      console.log(
        "Dữ liệu sản phẩm cần cập nhật:",
        processedData.flatMap((shop) =>
          shop.products.map((product) => ({
            id: Number(product.id),
            quantity: Number(product.amount),
          }))
        )
      );

      const updateCartItemsResponse = await fetch(
        `http://localhost:3000/cart/${cartId}/update-cart-items-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isPaid: true,
            products: processedData.flatMap((shop) =>
              shop.products.map((product) => ({
                id: Number(product.id),
                quantity: Number(product.amount),
              }))
            ),
          }),
          credentials: "include",
        }
      );

      // Kiểm tra phản hồi và xử lý kết quả
      if (!updateCartItemsResponse.ok) {
        const errorResponse = await updateCartItemsResponse.json();
        console.error("Lỗi khi cập nhật isPaid:", errorResponse);
        throw new Error(
          errorResponse.message ||
            `Không thể cập nhật trạng thái: ${updateCartItemsResponse.status}`
        );
      }

      const updateCartResult = await updateCartItemsResponse.json();
      console.log("Kết quả cập nhật isPaid:", updateCartResult);

      if (!updateCartItemsResponse.ok) {
        console.error(
          "Không thể cập nhật trạng thái CartItem và số lượng Product:",
          updateCartResult
        );
      } else {
        console.log(
          "Đã cập nhật trạng thái CartItem và số lượng Product thành công:",
          updateCartResult
        );
      }

      const response = await fetch(
        `http://localhost:3000/payment/create-from-cart/${cartId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Lỗi API thanh toán:", errorResponse);
        throw new Error(
          errorResponse.message || `Không thể tạo đơn hàng: ${response.status}`
        );
      }

      const responseData = await response.json();
      console.log("Kết quả API tạo đơn hàng:", responseData);

      if (!responseData.data) {
        throw new Error(
          responseData.message || `Không thể tạo đơn hàng: Dữ liệu không hợp lệ`
        );
      }

      const paymentId = responseData.data.id;
      if (!paymentId) {
        throw new Error("Không nhận được paymentId từ server");
      }

      const confirmResponse = await fetch(
        `http://localhost:3000/payment/${paymentId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!confirmResponse.ok) {
        const confirmError = await confirmResponse.json();
        throw new Error(
          confirmError.message ||
            `Không thể xác nhận thanh toán: ${confirmResponse.status}`
        );
      }

      const confirmData = await confirmResponse.json();
      if (!confirmData.data) {
        throw new Error(`Không nhận được dữ liệu xác nhận thanh toán`);
      }

      // Khi thanh toán thành công
      setIsPaymentComplete(true);
      setIsCartRemoved(true);

      localStorage.setItem("paymentComplete", "true");
      localStorage.setItem("tempPaymentSuccess", "true");
      localStorage.removeItem("cartId");

      toast.success("Đặt hàng thành công!");

      setTimeout(() => {
        navigate("/", { replace: true });
        setTimeout(() => {
          localStorage.removeItem("tempPaymentSuccess");
        }, 3500);
      }, 3500);
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      setPaymentStatus(
        `Có lỗi khi thanh toán! ${
          error instanceof Error ? error.message : "Vui lòng thử lại."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    const numberOnly = phone.replace(/\D/g, "");
    if (numberOnly.length < 10) {
      throw new Error("Số điện thoại phải có ít nhất 10 chữ số");
    }
    const validPrefixes = ["03", "05", "07", "08", "09"];
    const prefix = numberOnly.startsWith("0")
      ? numberOnly.slice(0, 2)
      : `0${numberOnly.slice(0, 1)}`;

    if (!validPrefixes.includes(prefix)) {
      throw new Error("Đầu số điện thoại không hợp lệ");
    }
    return numberOnly.startsWith("0") ? numberOnly : `0${numberOnly}`;
  };

  if (loading) {
    return (
      <div className="payment-page">
        <Header />
        <div className="payment_container">
          <div className="loading-message">
            <h2>Đang tải thông tin giỏ hàng...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (
    !localStorage.getItem("cartId") &&
    !localStorage.getItem("tempPaymentSuccess")
  ) {
    return (
      <div className="payment-page">
        <Header />
        <div className="payment_container">
          <div className="error-message">
            <h2>Lỗi: {error || paymentState.error}</h2>
            <p>Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
            <a href="/">Quay lại trang chủ</a>
          </div>
        </div>
      </div>
    );
  }

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
            {processedData.map((shop, index) => (
              <PaymentItem
                key={shop.id}
                item={shop}
                isExpandable={true}
                onUpdateAmount={handleUpdateProductPrice} // Sử dụng function mới
                index={index}
                isSecondShop={index === 1}
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
              initialValues={{ vourcher: selectedVoucher }}
              validationSchema={schema}
              onSubmit={handleSubmit}
            >
              {(formikProps: FormikProps<{ vourcher: string }>) => (
                <Form>
                  <TextInput
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
                        type="button"
                        onClick={() => setIsVoucherModalOpen(true)}
                      >
                        View
                      </button>
                    }
                    onChange={(value: string) => {
                      formikProps.setFieldValue("vourcher", value);
                      setSelectedVoucher(value);
                    }}
                    value={formikProps.values.vourcher || selectedVoucher}
                    error={
                      formikProps.touched.vourcher
                        ? formikProps.errors.vourcher ?? ""
                        : ""
                    }
                  />

                  <OrderDetails
                    subtotal={subtotal}
                    deliveryFee={deliveryFee}
                    couponDiscount={couponDiscount}
                    total={total}
                  />

                  {paymentStatus && (
                    <div
                      className={`payment-status ${
                        paymentStatus.includes("thành công")
                          ? "success"
                          : "error"
                      }`}
                    >
                      {paymentStatus}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-confirm"
                    disabled={isLoading || isPaymentComplete}
                  >
                    {isLoading
                      ? "Đang xử lý..."
                      : isPaymentComplete
                      ? "Đã thanh toán"
                      : "Confirm Order"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
      <UpdateAddressModal
        isOpen={isUpdateAddressModalOpen}
        onClose={() => setIsUpdateAddressModalOpen(false)}
        onConfirm={handleUpdateAddress}
      />
      <ModalVoucher
        open={isVoucherModalOpen}
        setOpen={setIsVoucherModalOpen}
        onSelectVoucher={setSelectedVoucher}
      />
      {/* Thêm ToastContainer ở đây */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default PaymentPage;
