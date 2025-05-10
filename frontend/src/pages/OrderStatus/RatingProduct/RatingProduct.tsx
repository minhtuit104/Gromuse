import React, { useState, useEffect } from "react";
import Header from "../../../layouts/Header/Header";
import "./RatingProduct.css";
import ImgProductDefault from "../../../assets/images/imagePNG/beef 1.png";
import ImgStore from "../../../assets/images/icons/ic_ shop.svg";
import iconStarFill from "../../../assets/images/icons/ic_star_fill.svg";
import iconStarEmpty from "../../../assets/images/icons/ic_star_orange.svg";
import ImgLoad from "../../../assets/images/icons/ic_add_image.svg";
import IcEye from "../../../assets/images/icons/ic_eye.svg";
import { Modal } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const loadSupabaseClient = async () => {
  const module = await import("../../../lib/supabaseClient");
  return module.createSupabaseClient();
};

interface RatingLocationState {
  cartItemId?: number;
  productId?: number;
  productName?: string;
  productImg?: string;
  weight?: number;
  quantity?: number;
  price?: number;
  shopName?: string; // <<< THÊM DÒNG NÀY
}

const RatingProduct = () => {
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [localPreviewImages, setLocalPreviewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const {
    cartItemId,
    productId,
    productName,
    productImg,
    weight,
    quantity,
    price,
    shopName, // <<< LẤY shopName TỪ STATE
  } = (location.state as RatingLocationState) || {};

  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    try {
      const supabase = await loadSupabaseClient();
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Vui lòng chỉ chọn các tệp hình ảnh");
        }
        const fileExt = file.name.split(".").pop();
        const fileName = `rating_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;
        const { data, error } = await supabase.storage
          .from("ImgGromuse")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });
        if (error) {
          console.error("Upload error:", error);
          throw error;
        }
        const { data: publicUrlData } = supabase.storage
          .from("ImgGromuse")
          .getPublicUrl(filePath);
        return publicUrlData.publicUrl;
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error("Error in uploadImagesToSupabase:", error);
      throw error;
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const remainingSlots = 5 - localPreviewImages.length;
      if (remainingSlots <= 0) {
        toast.warn("Bạn chỉ có thể tải lên tối đa 5 ảnh");
        return;
      }
      const newFiles = Array.from(event.target.files).slice(0, remainingSlots);
      const invalidFiles = newFiles.filter(
        (file) => !file.type.startsWith("image/")
      );
      if (invalidFiles.length > 0) {
        toast.warn("Vui lòng chỉ chọn các tệp hình ảnh");
        return;
      }
      setImagesToUpload((prevFiles) => [...prevFiles, ...newFiles]);
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
      setLocalPreviewImages((prevUrls) => [...prevUrls, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(localPreviewImages[index]);
    setImagesToUpload((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setLocalPreviewImages((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const handlePreview = (image: string) => {
    setPreviewImage(image);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setPreviewImage(null);
  };

  // Hàm xử lý khi click chọn sao
  const handleStarClick = (ratingValue: number) => {
    console.log("Selected rating:", ratingValue);
    setStarRating(ratingValue);
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1:
        return "Terrible";
      case 2:
        return "Poor";
      case 3:
        return "Fair";
      case 4:
        return "Good";
      case 5:
        return "Amazing";
      default:
        return "";
    }
  };

  const handleSubmitRating = async () => {
    // 1. Validate dữ liệu cơ bản
    if (!productId || !cartItemId) {
      toast.error("Lỗi: Thiếu thông tin sản phẩm hoặc đơn hàng để đánh giá.");
      console.error("Missing productId or cartItemId:", {
        productId,
        cartItemId,
      });
      return;
    }
    if (starRating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá.");
      return;
    }

    setLoading(true); // Bắt đầu loading
    try {
      // 2. Upload ảnh (nếu có)
      let uploadedImageUrls: string[] = [];
      if (imagesToUpload.length > 0) {
        console.log("Uploading images...");
        uploadedImageUrls = await uploadImagesToSupabase(imagesToUpload);
        console.log("Uploaded image URLs:", uploadedImageUrls);
      }

      // 3. Chuẩn bị dữ liệu gửi đi
      const ratingData = {
        productId: Number(productId),
        cartItemId: Number(cartItemId),
        rating: starRating,
        comment: reviewText.trim() || null, // Gửi null nếu comment rỗng
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null, // Gửi null nếu không có ảnh
      };
      console.log("Submitting rating data:", ratingData);

      // 4. Lấy token xác thực
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để gửi đánh giá.");
        setLoading(false);
        navigate("/login"); // Chuyển hướng đăng nhập
        return;
      }

      // 5. Gọi API backend
      const apiURL = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Sử dụng biến môi trường nếu có
      const response = await fetch(`${apiURL}/api/ratings`, {
        // Endpoint API mới
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Gửi token xác thực
        },
        body: JSON.stringify(ratingData),
      });

      // 6. Xử lý kết quả API
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // Nếu không parse được JSON, dùng statusText
          throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
        }
        console.error("API Error:", errorData);
        // Hiển thị lỗi cụ thể từ backend nếu có
        throw new Error(
          errorData.message || `Lỗi ${response.status} khi gửi đánh giá`
        );
      }

      // Thành công
      toast.success("Đánh giá sản phẩm thành công!");

      // 7. Reset form và chuyển hướng (tùy chọn)
      setReviewText("");
      setLocalPreviewImages([]);
      setImagesToUpload([]);
      setStarRating(0);
      // Giải phóng Object URL sau khi reset
      localPreviewImages.forEach((url) => URL.revokeObjectURL(url));

      setTimeout(() => {
        navigate("/order_status");
      }, 1500);
    } catch (error) {
      console.error("Error submitting rating:", error);
      // Hiển thị lỗi cho người dùng
      toast.error(
        `Có lỗi xảy ra: ${
          error instanceof Error ? error.message : "Vui lòng thử lại."
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      localPreviewImages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [localPreviewImages]); // Thêm dependency để chạy lại nếu localPreviewImages thay đổi (dù không cần thiết lắm ở đây)

  return (
    <div className="rating-container">
      <Header />
      <div className="review-container">
        {/* Phần Header của đánh giá - Hiển thị thông tin sản phẩm */}
        <div className="rating-header">
          <div className="rating-information">
            <div className="rating-image">
              {/* Sử dụng productImg từ state, fallback về ảnh mặc định */}
              <img
                src={productImg || ImgProductDefault}
                alt={productName || "Product Image"}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite loop
                  target.src = ImgProductDefault;
                }}
              />
            </div>
            <div className="rating-info">
              <div className="rating-title-product">
                {productName || "Tên sản phẩm"}
              </div>
              {weight && weight > 0 && (
                <div className="rating-weight">{weight}g</div>
              )}
              {quantity && <div className="rating-quantity">x{quantity}</div>}
            </div>
            {price !== undefined && price !== null && (
              <div className="rating-price">${price.toFixed(2)}</div>
            )}
          </div>

          {/* Tên cửa hàng (có thể lấy từ state nếu được truyền) */}
          <div className="store-name">
            <img src={ImgStore} alt="ImgStore" />
            {shopName || "Cửa hàng"} {/* <<< SỬ DỤNG shopName */}
          </div>
        </div>

        {/* Phần chọn sao */}
        <div className="rating-section">
          <div className="rating-section-title">
            <span className="name-product-quality">Product Quality: </span>
            <div className="stars">
              {/* Tạo 5 ngôi sao, click để chọn */}
              {[1, 2, 3, 4, 5].map((starValue) => (
                <img
                  key={starValue}
                  src={starValue <= starRating ? iconStarFill : iconStarEmpty}
                  alt={`Star ${starValue}`}
                  className="ic_28 star-selectable" // Thêm class để dễ style cursor pointer
                  onClick={() => handleStarClick(starValue)}
                />
              ))}
              {/* Hiển thị text tương ứng với số sao đã chọn */}
              {starRating > 0 && (
                <span className="rating-text">{getRatingText(starRating)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Phần nhập feedback và upload ảnh */}
        <div className="feedback">
          <div className="form-group">
            <label className="form-label">
              Your rate: <span className="required">*</span>
            </label>
            <textarea
              placeholder="Share more thoughts on the product to help other buyers"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">
              Image (max 5): <span className="required">*</span>
            </label>
            <div className="image-upload-container">
              <div className="image-list">
                {localPreviewImages.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img
                      src={image}
                      alt={`Preview ${index}`}
                      className="preview-image"
                    />
                    <div
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </div>
                    <div
                      className="image-hover"
                      onClick={() => handlePreview(image)}
                    >
                      <img src={IcEye} alt="View" className="ic_20" />
                    </div>
                  </div>
                ))}
                {localPreviewImages.length < 5 && (
                  <div
                    className="image-upload"
                    onClick={() =>
                      document.getElementById("rating-file-input")?.click()
                    }
                  >
                    <img src={ImgLoad} alt="Thêm ảnh" />
                  </div>
                )}
              </div>
              <input
                id="rating-file-input"
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
              {/* Modal xem trước ảnh */}
              <Modal
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                centered
                styles={{ body: { padding: 0, textAlign: "center" } }}
              >
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="modal-preview-image"
                  />
                )}
              </Modal>
            </div>
          </div>
        </div>

        {/* Nút bấm */}
        <div className="form-actions-rating">
          <button
            className="btn-cancel-rating"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-submit-rating"
            onClick={handleSubmitRating}
            disabled={loading || starRating === 0}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </div>
      {/* Container cho toast */}
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

export default RatingProduct;
