// src/pages/PaymentPages/index.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./paymentPage.css";
import IconVoucher from "../../assets/images/icons/ic_ voucher.svg";
import usePayment from "./usePayment";
import PaymentItem, { Shop, Product } from "./paymentItem";
import AddressPayment from "./addressPayment";
import Header from "../../layouts/Header/Header";
import TextInput from "../../components/TextInput/TextInput";
import * as yup from "yup";
import { Formik, FormikProps, Form } from "formik";
import RadioGroup from "../../components/Radio/radio";
import OrderDetails from "./orderDetail";
import ModalVoucher from "./modalVourcher";
import UpdateAddressModal from "./modalUpdateAddress";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { confirmPaymentAndUpdateBackend } from "../../Service/OrderService";
import { updateUserProfile } from "../../Service/UserService";

export const PaymentPage = () => {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState(0);
  const [isUpdateAddressModalOpen, setIsUpdateAddressModalOpen] =
    useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");
  const deliveryFee = { original: 25.0, discounted: 15.0 };

  const {
    data,
    loading,
    error,
    handleUpdatePrice,
    vouchers,
    refetchCart,
    userAddress,
    userLoading,
    userError,
    refetchUser,
  } = usePayment();

  // State để lưu trữ dữ liệu giỏ hàng đã xử lý để hiển thị
  const [processedData, setProcessedData] = useState<Shop[]>([]);
  // State để lưu cartId hiệu lực
  const [cartId, setCartId] = useState<string | null>(null);

  // Lấy và đồng bộ cartId khi component mount
  useEffect(() => {
    const buyNowCartId = localStorage.getItem("buyNowCartId");
    const currentCartId = localStorage.getItem("currentCartId");
    // Ưu tiên buyNowCartId, sau đó đến currentCartId
    const effectiveCartId = buyNowCartId || currentCartId;

    console.log("[PaymentPage] buyNowCartId:", buyNowCartId);
    console.log("[PaymentPage] currentCartId:", currentCartId);
    console.log("[PaymentPage] Effective cartId:", effectiveCartId);

    setCartId(effectiveCartId); // Cập nhật state cartId

    // Đồng bộ cartId hiệu lực vào các key liên quan trong localStorage
    if (effectiveCartId) {
      localStorage.setItem("cartId", effectiveCartId); // Key chung nếu cần
      localStorage.setItem("currentCartId", effectiveCartId); // Đảm bảo currentCartId đúng
    } else {
      // Nếu không có cartId nào, xóa các key cũ để tránh lỗi
      localStorage.removeItem("cartId");
      localStorage.removeItem("currentCartId");
      localStorage.removeItem("buyNowCartId");
    }
  }, []); // Chỉ chạy 1 lần khi mount

  // Cập nhật processedData khi data từ usePayment thay đổi
  useEffect(() => {
    if (!data || data.length === 0) {
      setProcessedData([]); // Nếu không có data, đặt processedData là mảng rỗng
      return;
    }
    // Logic chia sản phẩm vào các shop (giữ nguyên hoặc tùy chỉnh)
    const allProducts = data.flatMap((shop) => shop.products);
    const shop1 = {
      ...data[0], // Lấy thông tin shop đầu tiên từ data
      products: allProducts.slice(0, 2), // Ví dụ: 2 sản phẩm đầu
    };
    const shop2 = {
      ...data[0], // Giả sử cùng shop hoặc lấy shop thứ 2 nếu có
      id: data[0].id + 1 || 2, // ID khác
      products: allProducts.slice(2), // Các sản phẩm còn lại
    };
    setProcessedData([shop1, ...(shop2.products.length > 0 ? [shop2] : [])]);
  }, [data]); // Chạy lại khi data thay đổi

  // Hàm cập nhật số lượng sản phẩm (gọi hàm từ usePayment)
  const handleUpdateProductPrice = async (
    productId: string,
    newQuantity: number
  ) => {
    try {
      const updateResult = await handleUpdatePrice(productId, newQuantity);
      if (updateResult) {
        // Cập nhật state processedData để UI thay đổi ngay lập tức
        setProcessedData((prevData) =>
          prevData.map((shop) => ({
            ...shop,
            // Giờ đây kiểu Product đã nhất quán
            products: shop.products.map((product: Product) =>
              product.id.toString() === productId
                ? { ...product, quantity: newQuantity }
                : product
            ),
          }))
        );
      } else {
        toast.error("Cập nhật số lượng thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi khi gọi handleUpdatePrice:", error);
      toast.error("Có lỗi xảy ra khi cập nhật số lượng.");
    }
  };

  // Tính toán giá trị đơn hàng
  const calculatedValues = useMemo(() => {
    const newSubtotal = processedData.reduce(
      (sum, shop) =>
        sum +
        shop.products.reduce(
          (prodSum: number, prod: Product) =>
            prodSum + (Number(prod.price) || 0) * (Number(prod.quantity) || 1),
          0
        ),
      0
    );

    let discount = 0;
    let deliveryDiscount = 0; // Giảm giá phí ship riêng
    const selectedVoucherData = vouchers.find(
      (v) => v.code === selectedVoucher
    );

    if (selectedVoucherData) {
      if (selectedVoucherData.type === "Free Ship") {
        // Giả sử voucher free ship giảm tối đa phí ship hiện tại
        deliveryDiscount = deliveryFee.discounted; // Hoặc giá trị tối đa của voucher
      } else if (selectedVoucherData.type === "Discount") {
        // Giả sử voucher giảm giá theo % hoặc số tiền cố định
        // Cần thêm logic tính discount dựa trên thông tin chi tiết của voucher
        discount = 10; // Ví dụ giảm 10$
      }
    }

    // Phí ship cuối cùng sau khi áp dụng voucher free ship
    const finalDeliveryFee = Math.max(
      0,
      deliveryFee.discounted - deliveryDiscount
    );
    // Tổng tiền cuối cùng
    const newTotal = newSubtotal + finalDeliveryFee - discount;

    return {
      subtotal: newSubtotal,
      couponDiscount: discount, // Giảm giá từ voucher discount
      deliveryDiscount: deliveryDiscount, // Giảm giá phí ship
      finalDeliveryFee: finalDeliveryFee, // Phí ship cuối cùng
      total: Math.max(newTotal, 0), // Tổng tiền không âm
    };
  }, [processedData, selectedVoucher, vouchers, deliveryFee]);

  // Xử lý khi thanh toán thành công hoặc quay lại từ trang khác
  useEffect(() => {
    const paymentSuccessful = localStorage.getItem("paymentSuccessful");
    const isBuyNow = localStorage.getItem("isBuyNow"); // Kiểm tra nếu là luồng buy now

    if (isBuyNow === "true") {
      // Xóa đánh dấu buy now sau khi đã vào trang payment
      localStorage.removeItem("isBuyNow");
    }

    if (paymentSuccessful === "true") {
      localStorage.removeItem("paymentSuccessful");
      // Có thể chuyển hướng đến trang lịch sử đơn hàng thay vì trang chủ
      // navigate("/order-history");
      // navigate("/"); // Tạm thời về trang chủ
      return;
    }

    // Logic kiểm tra cartUpdated đã chuyển vào usePayment
  }, [navigate]);

  // Mở modal cập nhật địa chỉ
  const handleOpenUpdateAddressModal = () => {
    setIsUpdateAddressModalOpen(true);
  };

  // *** START: CẬP NHẬT HÀM handleUpdateAddress ***
  const handleUpdateAddress = async (newAddressData: {
    name: string;
    phone: string;
    address: string;
  }) => {    
    setIsUpdateAddressModalOpen(false); // Đóng modal
    setIsLoading(true); // Hiển thị loading (có thể dùng state loading riêng)
    try {
      // Chuẩn bị dữ liệu gửi lên API
      const updateData = {
        name: newAddressData.name,
        phoneNumber: newAddressData.phone, // Khớp với backend DTO
        address: newAddressData.address,
        // Không cần gửi email, birthday nếu không thay đổi
      };
      
      // Gọi API cập nhật profile từ UserService
      await updateUserProfile(updateData);

      toast.success("Cập nhật địa chỉ thành công!");

      // Gọi hàm refetchUser từ hook usePayment để lấy dữ liệu mới nhất
      if (refetchUser) {
        refetchUser(); // Fetch lại thông tin user để cập nhật UI
      }
    } catch (error) {
      console.error("Lỗi cập nhật địa chỉ:", error);
      toast.error(
        "Lỗi cập nhật địa chỉ: " +
          (error instanceof Error ? error.message : "Vui lòng thử lại")
      );
    } finally {
      setIsLoading(false); // Tắt loading
    }
  };
  // *** END: CẬP NHẬT HÀM handleUpdateAddress ***

  // Schema validation cho voucher (nếu cần)
  const schema = yup.object().shape({
    vourcher: yup.string(), // Đổi tên thành voucher nếu muốn
  });

  // *** START: CẬP NHẬT HÀM handleSubmit ***
  const handleSubmit = async () => {
    console.log("[handleSubmit] Bắt đầu chạy...");
    // Sử dụng cartId từ state đã được cập nhật
    const cartIdToProcess = cartId;
    console.log("[handleSubmit] cartIdToProcess từ state:", cartIdToProcess);

    if (!cartIdToProcess) {
      toast.error("Lỗi: Không tìm thấy ID giỏ hàng hợp lệ để thanh toán.");
      console.error("[PaymentPage] Invalid or missing cartId for payment.");
      return;
    }
    const cartIdValue = parseInt(cartIdToProcess);
    if (isNaN(cartIdValue)) {
      toast.error("Lỗi: ID giỏ hàng không hợp lệ.");
      console.error("[PaymentPage] Invalid cartId format:", cartIdToProcess);
      return;
    }

    // --- Lấy thông tin địa chỉ từ state userAddress ---
    if (!userAddress) {
      toast.error(
        "Không thể lấy thông tin địa chỉ người dùng. Đang tải lại..."
      );
      console.error("[PaymentPage] userAddress is null. Attempting refetch...");
      if (refetchUser) refetchUser(); // Thử fetch lại user nếu chưa có
      return;
    }
    // -------------------------------------------------

    // Kiểm tra giỏ hàng trống
    if (
      !processedData ||
      processedData.length === 0 ||
      !processedData.some((shop) => shop.products && shop.products.length > 0)
    ) {
      toast.error("Giỏ hàng trống, không thể thanh toán.");
      console.error("[PaymentPage] Cart is empty.");
      return;
    }

    setIsLoading(true); // Bắt đầu loading cho quá trình thanh toán
    setPaymentStatus(""); // Reset trạng thái thanh toán

    try {
      // Chuẩn bị dữ liệu gửi lên API /payment/create
      const paymentData = {
        paymentMethod: selectedPayment === 0 ? "online" : "cod", // Phương thức thanh toán
        subtotal: calculatedValues.subtotal,
        deliveryFeeOriginal: deliveryFee.original,
        deliveryFeeDiscounted: calculatedValues.finalDeliveryFee, // Phí ship cuối cùng
        couponDiscount:
          calculatedValues.couponDiscount + calculatedValues.deliveryDiscount, // Tổng giảm giá
        total: calculatedValues.total,
        // --- Sử dụng userAddress từ state ---
        address: {
          name: userAddress.name,
          phone: userAddress.phone.replace(/[^\d]/g, ""), // Chỉ lấy số
          address: userAddress.address,
        },
        // -----------------------------------
        voucherCodes: selectedVoucher ? [selectedVoucher] : [], // Mã voucher đã chọn
        // Dữ liệu shops và products (đảm bảo đúng cấu trúc backend yêu cầu)
        shops: processedData.map((shop) => ({
          id: shop.id, // ID của shop
          products: shop.products.map((product: Product) => ({
            id: Number(product.id), // ID sản phẩm (number)
            quantity: Number(product.quantity) || 1, // Số lượng (number)
            price: Number(product.price) || 0, // Giá tại thời điểm mua (number)
            // Thêm các thông tin khác nếu backend cần
            name: product.name,
            img: product.img,
          })),
        })),
        cartId: cartIdValue, // ID của giỏ hàng đang thanh toán
      };

      console.log(
        "[PaymentPage] Calling API: POST /payment/create with data:",
        paymentData
      );
      // Gọi API tạo đơn hàng
      const response = await fetch(`http://localhost:3000/payment/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
        // credentials: "include", // Bỏ nếu không dùng cookie phức tạp
      });

      if (!response.ok) {
        const errorResponse = await response
          .json()
          .catch(() => ({ message: `HTTP Error ${response.status}` }));
        console.error(
          "[PaymentPage] Payment creation API error:",
          errorResponse
        );
        throw new Error(
          errorResponse.message || `Không thể tạo đơn hàng: ${response.status}`
        );
      }
      const responseData = await response.json();
      console.log("[PaymentPage] Payment creation API success:", responseData);

      // Lấy paymentId từ response (đảm bảo cấu trúc response đúng)
      const paymentId = responseData.data?.id || responseData.id; // Kiểm tra cả hai cấu trúc có thể
      if (!paymentId) {
        throw new Error(
          "Không nhận được paymentId từ server sau khi tạo đơn hàng."
        );
      }

      console.log(
        `[PaymentPage] Calling API: POST /payment/${paymentId}/confirm`
      );
      // Gọi API xác nhận thanh toán
      const confirmResponse = await fetch(
        `http://localhost:3000/payment/${paymentId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // credentials: "include",
        }
      );

      if (!confirmResponse.ok) {
        const confirmError = await confirmResponse
          .json()
          .catch(() => ({ message: `HTTP Error ${confirmResponse.status}` }));
        console.error(
          "[PaymentPage] Payment confirmation API error:",
          confirmError
        );
        throw new Error(
          confirmError.message ||
            `Không thể xác nhận thanh toán: ${confirmResponse.status}`
        );
      }
      const confirmData = await confirmResponse.json();
      console.log(
        "[PaymentPage] Payment confirmation API success:",
        confirmData
      );
      // Kiểm tra dữ liệu trả về từ API confirm nếu cần
      // if (!confirmData.data) {
      //   throw new Error(`Không nhận được dữ liệu xác nhận thanh toán`);
      // }

      console.log(
        `[PaymentPage] Calling confirmPaymentAndUpdateBackend for cartId: ${cartIdValue}`
      );
      // Chuẩn bị danh sách sản phẩm đã thanh toán để cập nhật backend
      const paidItems = processedData.flatMap((shop) =>
        shop.products.map((product: Product) => ({
          id: Number(product.id),
          quantity: Number(product.quantity) || 1,
        }))
      );

      // Gọi hàm cập nhật trạng thái isPaid và số lượng sold
      const updateAndSyncSuccess = await confirmPaymentAndUpdateBackend(
        cartIdValue,
        paidItems
      );

      if (!updateAndSyncSuccess) {
        console.error("[PaymentPage] confirmPaymentAndUpdateBackend failed.");
        // Vẫn coi là thành công nhưng cảnh báo
        toast.warn(
          "Thanh toán thành công nhưng cập nhật trạng thái đơn hàng có lỗi."
        );
      } else {
        console.log("[PaymentPage] confirmPaymentAndUpdateBackend successful.");
        toast.success("Đặt hàng và cập nhật trạng thái thành công!");
      }

      setIsPaymentComplete(true); // Đánh dấu thanh toán hoàn tất
      setPaymentStatus("Thanh toán thành công!"); // Cập nhật trạng thái

      // Lưu trạng thái vào localStorage để xử lý chuyển hướng nếu cần
      localStorage.setItem("paymentComplete", "true");
      localStorage.setItem("tempPaymentSuccess", "true"); // Dùng để kiểm tra khi quay lại trang

      // Lưu cartId vừa thanh toán nếu cần cho trang lịch sử
      localStorage.setItem("lastPaidCartId", cartIdValue.toString());

      // --- Xóa các cartId đã dùng khỏi localStorage ---
      localStorage.removeItem("currentCartId");
      localStorage.removeItem("buyNowCartId");
      localStorage.removeItem("cartId"); // Xóa cả key chung
      // ---------------------------------------------

      // Chuyển hướng người dùng sau một khoảng thời gian
      setTimeout(() => {
        navigate("/", { replace: true }); // Chuyển về trang chủ
        // Xóa cờ tạm sau khi đã chuyển hướng
        setTimeout(() => {
          localStorage.removeItem("tempPaymentSuccess");
        }, 500); // Xóa sau 0.5s
      }, 1500); // Chuyển hướng sau 1.5s
    } catch (error) {
      // Xử lý lỗi trong quá trình thanh toán
      console.error("[PaymentPage] Error during payment process:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Vui lòng thử lại.";
      setPaymentStatus(`Có lỗi khi thanh toán! ${errorMessage}`);
      toast.error(`Lỗi thanh toán: ${errorMessage}`);
      setIsPaymentComplete(false); // Đảm bảo trạng thái chưa hoàn tất nếu lỗi
    } finally {
      setIsLoading(false); // Kết thúc loading
    }
  };
  // *** END: CẬP NHẬT HÀM handleSubmit ***

  // Hàm định dạng số điện thoại (giữ nguyên)
  const formatPhoneNumber = (phone: string): string => {
    const numberOnly = phone.replace(/\D/g, "");
    if (numberOnly.length < 10) {
      console.warn("Số điện thoại không đủ 10 chữ số:", phone);
      return phone; // Trả về chuỗi gốc
    }
    return phone;
  };

  if (loading || userLoading) {
    return (
      <div className="payment-page">
        <Header />
        <div className="payment_container">
          <div className="loading-message">
            <h2>Đang tải dữ liệu...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Ưu tiên hiển thị lỗi user nếu có
  if (userError) {
    return (
      <div className="payment-page">
        <Header />
        <div className="payment_container">
          <div className="error-message">
            <h2>Lỗi tải thông tin người dùng:</h2>
            <p>{userError}</p>
            {/* Nút thử lại gọi refetchUser */}
            <button
              onClick={() =>
                refetchUser ? refetchUser() : window.location.reload()
              }
            >
              Thử lại
            </button>
            {/* Có thể thêm nút đăng xuất */}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi cart nếu có (sau khi đã chắc chắn không có lỗi user)
  if (error) {
    return (
      <div className="payment-page">
        <Header />
        <div className="payment_container">
          <div className="error-message">
            <h2>Lỗi tải giỏ hàng:</h2>
            <p>{error}</p>
            {/* Nút thử lại gọi refetchCart */}
            <button
              onClick={() =>
                refetchCart ? refetchCart() : window.location.reload()
              }
            >
              Thử lại
            </button>
            <a href="/">Quay lại trang chủ</a>
          </div>
        </div>
      </div>
    );
  }

  if (
    !loading &&
    (!processedData ||
      processedData.length === 0 ||
      !processedData.some((shop) => shop.products && shop.products.length > 0))
  ) {
    return (
      <div className="payment-page">
        <Header />
        <div className="payment_container">
          <div className="empty-cart-message">
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy thêm sản phẩm vào giỏ trước khi thanh toán nhé!</p>
            <a href="/">Tiếp tục mua sắm</a>
          </div>
        </div>
      </div>
    );
  }

  // --- Phần Render JSX ---
  return (
    <div className="payment-page">
      <Header />
      <div className="payment_container">
        <div className="payment_left">
          <AddressPayment
            address={
              userAddress || {
                name: "Loading...",
                phone: "...",
                address: "...",
              }
            }
            onEdit={handleOpenUpdateAddressModal}
          />

          <div className="payment_left_detail">
            <div className="payment_left_detail_name">Review item by store</div>
            <div className="payment_left_detail_line"></div>
            {/* Render các shop và sản phẩm từ processedData */}
            {processedData.map((shop, index) => (
              <PaymentItem
                key={`${shop.id}-${index}`} // Key duy nhất hơn
                item={shop}
                isExpandable={true} // Luôn mở rộng?
                onUpdateAmount={handleUpdateProductPrice}
                index={index}
                isSecondShop={index === 1} // Đánh dấu shop thứ 2 nếu cần logic riêng
              />
            ))}
          </div>
        </div>

        <div className="payment_right">
          <div className="order-summary">
            <h2 className="order-summary-name">Order summary</h2>
            <div className="payment_right_line_1"></div>

            {/* Phần chọn phương thức thanh toán */}
            <RadioGroup
              options={[
                { value: 0, label: "Online Payment" }, // Dùng number cho value
                { value: 1, label: "Cash on delivery" },
              ]}
              optionSelected={selectedPayment}
              onSelect={(value) => setSelectedPayment(Number(value))} // Ép kiểu về number
              labelStyle="font-size: 14px"
            />

            {/* Formik cho voucher và nút submit */}
            <Formik
              initialValues={{ vourcher: selectedVoucher }} // Đổi tên thành voucher nếu muốn
              validationSchema={schema}
              onSubmit={handleSubmit} // Submit form sẽ gọi hàm handleSubmit đã định nghĩa
              enableReinitialize // Cho phép cập nhật initialValues nếu selectedVoucher thay đổi từ modal
            >
              {(formikProps: FormikProps<{ vourcher: string }>) => (
                <Form>
                  {/* Input nhập/hiển thị voucher */}
                  <TextInput
                    placeholder={"Enter voucher code ..."}
                    prefix={
                      <img
                        src={IconVoucher}
                        alt="voucher icon"
                        className="ic_40 filtered-img" // Kiểm tra class CSS này
                      />
                    }
                    suffix={
                      <button
                        className="view-button"
                        type="button" // Quan trọng: type="button" để không submit form
                        onClick={() => setIsVoucherModalOpen(true)}
                      >
                        View
                      </button>
                    }
                    // Sử dụng value từ state selectedVoucher để hiển thị mã đã chọn từ modal
                    value={selectedVoucher || formikProps.values.vourcher}
                    // Cho phép nhập tay và cập nhật state selectedVoucher
                    onChange={(value: string) => {
                      formikProps.setFieldValue("vourcher", value);
                      setSelectedVoucher(value);
                    }}
                    // name="vourcher" // Thêm name để Formik quản lý
                    error={
                      formikProps.touched.vourcher
                        ? formikProps.errors.vourcher ?? ""
                        : ""
                    }
                  />

                  {/* Hiển thị chi tiết đơn hàng */}
                  <OrderDetails
                    subtotal={calculatedValues.subtotal}
                    deliveryFee={{
                      original: deliveryFee.original,
                      discounted: calculatedValues.finalDeliveryFee,
                    }} // Truyền phí ship cuối cùng
                    couponDiscount={
                      calculatedValues.couponDiscount +
                      calculatedValues.deliveryDiscount
                    } // Tổng giảm giá
                    total={calculatedValues.total}
                  />

                  {/* Hiển thị trạng thái thanh toán */}
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

                  {/* Nút xác nhận đơn hàng */}
                  <button
                    type="submit" // type="submit" để kích hoạt onSubmit của Formik
                    className="btn-confirm"
                    disabled={
                      isLoading ||
                      isPaymentComplete ||
                      userLoading ||
                      !userAddress
                    } // Disable khi đang load, đã hoàn tất, user đang load hoặc chưa có địa chỉ
                  >
                    {isLoading
                      ? "Đang xử lý..."
                      : isPaymentComplete
                      ? "Đã đặt hàng"
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
        initialData={userAddress}
      />

      {/* Modal chọn voucher */}
      <ModalVoucher
        open={isVoucherModalOpen}
        setOpen={setIsVoucherModalOpen}
        onSelectVoucher={setSelectedVoucher}
      />

      {/* Container cho Toastify */}
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
