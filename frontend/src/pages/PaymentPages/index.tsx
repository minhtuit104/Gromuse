import { useEffect, useMemo, useState } from "react";
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
import { updateUserProfile } from "../../Service/UserService";
import { Modal, Button } from "antd";
import { addPayment } from "../../Service/PaymentService";

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
  const [processedData, setProcessedData] = useState<Shop[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

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
    handleSuccessfulPayment,
  } = usePayment();

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
    let deliveryDiscount = 0;
    const selectedVoucherData = vouchers.find(
      (v) => v.code === selectedVoucher
    );

    if (selectedVoucherData) {
      if (selectedVoucherData.type === "Free Ship") {
        deliveryDiscount = deliveryFee.discounted;
      } else if (selectedVoucherData.type === "Discount") {
        discount = 10;
      }
    }

    const finalDeliveryFee = Math.max(
      0,
      deliveryFee.discounted - deliveryDiscount
    );
    const newTotal = newSubtotal + finalDeliveryFee - discount;

    return {
      subtotal: newSubtotal,
      couponDiscount: discount,
      deliveryDiscount: deliveryDiscount,
      finalDeliveryFee: finalDeliveryFee,
      total: Math.max(newTotal, 0),
    };
  }, [processedData, selectedVoucher, vouchers, deliveryFee]);

  useEffect(() => {
    const paymentSuccessful = localStorage.getItem("paymentSuccessful");
    const isBuyNow = localStorage.getItem("isBuyNow");

    if (isBuyNow === "true") {
      localStorage.removeItem("isBuyNow");
    }

    if (paymentSuccessful === "true") {
      localStorage.removeItem("paymentSuccessful");
      navigate("/"); // Tạm thời về trang chủ
      return;
    }
  }, [navigate]);

  const handleOpenUpdateAddressModal = () => {
    setIsUpdateAddressModalOpen(true);
  };

  const handleUpdateAddress = async (newAddressData: {
    name: string;
    phone: string;
    address: string;
  }) => {
    try {
      setIsLoading(true);

      const updateData = {
        name: newAddressData.name,
        phoneNumber: newAddressData.phone,
        address: newAddressData.address,
      };
      console.log("Sending update to backend:", updateData);
      const backendResponse = await updateUserProfile(updateData);
      if (backendResponse?.status === "success") {
        setIsUpdateAddressModalOpen(false);
        toast.success(
          backendResponse.message || "Cập nhật địa chỉ thành công!"
        );
        if (refetchUser) {
          console.log("Calling refetchUser after successful update...");
          await refetchUser();
          console.log("refetchUser completed.");
        } else {
          console.warn("refetchUser function is not available.");
        }
      } else {
        console.error("Unexpected backend response format:", backendResponse);
        const message =
          backendResponse?.message || "Phản hồi từ server không hợp lệ.";
        toast.error(`Cập nhật địa chỉ thất bại: ${message}`);
      }
    } catch (error) {
      console.error("Error updating address:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      toast.error(`Cập nhật địa chỉ thất bại: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const schema = yup.object().shape({
    vourcher: yup.string(),
  });

  const updateCartCount = () => {
    // Phát sự kiện cập nhật giỏ hàng
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleSubmit = async () => {
    if (
      !userAddress ||
      !userAddress.phone ||
      !userAddress.name ||
      !userAddress.address
    ) {
      toast.error("Vui lòng cập nhật địa chỉ giao hàng trước khi thanh toán.");
      handleOpenUpdateAddressModal();
      return;
    }

    if (
      !processedData ||
      processedData.length === 0 ||
      !processedData.some((shop) => shop.products.length > 0)
    ) {
      toast.error("Giỏ hàng trống, không thể thanh toán.");
      console.error("[PaymentPage] Cart is empty.");
      return;
    }

    setIsLoading(true);
    setPaymentStatus("");

    try {
      // Lấy danh sách cartItemIds từ processedData TRƯỚC khi gọi addPayment
      const paidCartItemIds = processedData
        .flatMap(
          (shop) => shop.products.map((product) => parseInt(product.id, 10)) // product.id bây giờ là cartItemId dạng string
        )
        .filter((id) => !isNaN(id) && id > 0); // Lọc ra các ID hợp lệ
      console.log("[PaymentPage] CartItem IDs to be paid:", paidCartItemIds);

      const paymentData = {
        paymentMethod: selectedPayment === 0 ? "online" : "cod",
        subtotal: calculatedValues.subtotal,
        deliveryFeeOriginal: deliveryFee.original,
        deliveryFeeDiscounted: calculatedValues.finalDeliveryFee,
        couponDiscount:
          calculatedValues.couponDiscount + calculatedValues.deliveryDiscount,
        total: calculatedValues.total,
        voucherCodes: selectedVoucher ? [selectedVoucher] : [],
        phone: userAddress.phone,
        address: userAddress.address || "N/A",
        name: userAddress.name,
      };

      // 1. Gọi API tạo Payment record
      const response = (await addPayment(paymentData)) as any;

      if (response.message === "success") {
        // 2. Gọi hàm cập nhật trạng thái CartItems trên backend (QUAN TRỌNG)
        const currentCartId = localStorage.getItem("currentCartId"); // Lấy cartId hiện tại
        if (currentCartId && paidCartItemIds.length > 0) {
          const updateSuccess = await handleSuccessfulPayment(
            parseInt(currentCartId, 10),
            paidCartItemIds
          );
          if (!updateSuccess) {
            // Xử lý nếu cập nhật trạng thái backend thất bại (ví dụ: hiển thị thông báo)
            console.error(
              "[PaymentPage] Failed to update cart item statuses on backend after payment."
            );
            toast.error(
              "Thanh toán thành công nhưng có lỗi khi cập nhật trạng thái đơn hàng. Vui lòng liên hệ hỗ trợ."
            );
            // Cân nhắc có nên dừng lại ở đây hay không
          } else {
            console.log(
              "[PaymentPage] Successfully updated cart item statuses on backend."
            );
          }
        } else {
          console.warn(
            "[PaymentPage] Missing currentCartId or no items to update status for."
          );
        }

        // 3. Xử lý phía Frontend (giữ nguyên)
        setIsPaymentComplete(true);
        setPaymentStatus("Thanh toán thành công!");
        localStorage.setItem("paymentComplete", "true");
        updateCartCount();
        setTimeout(() => {
          navigate("/order_status", { replace: true });
        }, 1500);
      }
    } catch (error: any) {
      console.error("[PaymentPage] Error during payment process:", error);
      setPaymentStatus(
        `Có lỗi khi thanh toán! ${error.message || "Vui lòng thử lại."}`
      );
      toast.error(`Lỗi thanh toán: ${error.message || "Vui lòng thử lại."}`);
      setIsPaymentComplete(false);
    } finally {
      setIsLoading(false);
    }
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
        <div className="payment_container-message">
          <div className="empty-cart-message">
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy thêm sản phẩm vào giỏ trước khi thanh toán nhé!</p>
            <a href="/">Tiếp tục mua sắm</a>
          </div>
        </div>
      </div>
    );
  }

  const handleOpenClearAllModal = () => {
    setIsClearAllModalOpen(true);
  };

  const handleConfirmClearAll = async () => {
    try {
      // 1. Lấy token để xác thực người dùng
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để xóa giỏ hàng.");
        navigate("/login"); // Chuyển hướng nếu chưa đăng nhập
        return;
      }

      setIsLoading(true);

      // Gọi API xóa toàn bộ cart items chưa thanh toán
      const response = await fetch(
        `http://localhost:3000/api/cart-items/my-cart`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[PaymentPage] Lỗi API xóa giỏ hàng (${response.status}):`,
          errorText
        );
        throw new Error(`Lỗi khi xóa giỏ hàng: ${response.status}`);
      }

      const result = await response.json();
      console.log("[PaymentPage] Đã xóa giỏ hàng:", result);

      // 3. Cập nhật UI và localStorage
      setProcessedData([]); // Xóa dữ liệu hiển thị
      setCartId(null); // Reset cartId state
      localStorage.removeItem("currentCartId"); // Xóa cartId khỏi localStorage
      localStorage.removeItem("buyNowCartId");
      localStorage.removeItem("cartId"); // Xóa key chung nếu có
      setIsClearAllModalOpen(false);
      toast.success("Đã xóa tất cả sản phẩm khỏi giỏ hàng");

      // Phát sự kiện cập nhật giỏ hàng cho Header
      window.dispatchEvent(new Event("cartUpdated"));
      document.dispatchEvent(new Event("cartUpdate"));

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (error) {
      console.error("[PaymentPage] Lỗi khi xóa giỏ hàng:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Vui lòng thử lại.";
      toast.error(`Không thể xóa giỏ hàng: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  interface ClearAllModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }

  const ClearAllModal = ({
    isOpen,
    onClose,
    onConfirm,
  }: ClearAllModalProps) => {
    return (
      <Modal
        title="Clear all"
        open={isOpen}
        onCancel={onClose}
        footer={null}
        centered
        className="clear-all-modal"
        destroyOnClose
      >
        <div className="product-card-line"></div>
        <div className="clear-all-content">
          <p>Do you really want to clear all items?</p>
          <div className="clear-all-buttons">
            <Button onClick={onClose} className="btn-back">
              Back
            </Button>
            <Button onClick={onConfirm} className="btn-confirm-clear">
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  // --- Phần Render JSX ---
  return (
    <div className="payment-page">
      <Header />
      <div className="payment_container">
        <div className="payment_left">
          <AddressPayment
            address={userAddress || null}
            onEdit={handleOpenUpdateAddressModal}
            isLoading={isLoading}
          />

          <div className="payment_left_detail">
            <div className="payment_left_detail_header">
              <div className="payment_left_detail_name">
                Review item by store
              </div>
              <div
                className="payment_left_detail_clear_all"
                onClick={handleOpenClearAllModal}
              >
                Clear all
              </div>
            </div>

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
                    type="submit"
                    className="btn-confirm"
                    disabled={
                      isLoading ||
                      isPaymentComplete ||
                      loading ||
                      userLoading ||
                      !userAddress ||
                      !userAddress.phone ||
                      !userAddress.name
                      // Bỏ kiểm tra userAddress.address nếu không bắt buộc
                    }
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
        onClose={() => {
          if (!isLoading) {
            setIsUpdateAddressModalOpen(false);
          }
        }}
        onConfirm={handleUpdateAddress}
        initialData={userAddress}
        isLoading={isLoading}
      />

      {/* Modal chọn voucher */}
      <ModalVoucher
        open={isVoucherModalOpen}
        setOpen={setIsVoucherModalOpen}
        onSelectVoucher={setSelectedVoucher}
      />

      <ClearAllModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleConfirmClearAll}
      />

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
