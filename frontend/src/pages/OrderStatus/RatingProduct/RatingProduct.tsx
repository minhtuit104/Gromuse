import React, { useState, useEffect } from "react";
import Header from "../../../layouts/Header/Header";
import "./RatingProduct.css";
import ImgProduct from "../../../assets/images/imagePNG/beef 1.png";
import ImgStore from "../../../assets/images/icons/ic_ shop.svg";
import iconStarFill from "../../../assets/images/icons/ic_star_fill.svg";
import iconStar from "../../../assets/images/icons/ic_star_orange.svg";
import ImgLoad from "../../../assets/images/icons/ic_add_image.svg";
import IcEye from "../../../assets/images/icons/ic_eye.svg";
import { Modal } from "antd";

const loadSupabaseClient = async () => {
  const module = await import("../../../lib/supabaseClient");
  return module.createSupabaseClient();
};

const RatingProduct = () => {
  // State cho việc upload ảnh
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [localPreviewImages, setLocalPreviewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // State cho Modal preview ảnh
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // State cho input review text
  const [reviewText, setReviewText] = useState("");

  // Hàm xử lý upload ảnh lên Supabase
  const uploadImagesToSupabase = async (files: File[]): Promise<string[]> => {
    try {
      const supabase = await loadSupabaseClient();

      const uploadPromises = files.map(async (file) => {
        // Kiểm tra loại file
        if (!file.type.startsWith("image/")) {
          throw new Error("Vui lòng chỉ chọn các tệp hình ảnh");
        }

        // Tạo tên file duy nhất
        const fileExt = file.name.split(".").pop();
        const fileName = `rating_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from("ImgGromuse")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          console.error("Upload error:", error);
          throw error;
        }

        // Lấy URL công khai của file từ Supabase
        const { data: publicUrlData } = supabase.storage
          .from("ImgGromuse")
          .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
      });

      // Đợi tất cả các upload hoàn tất
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error) {
      console.error("Error in uploadImagesToSupabase:", error);
      throw error;
    }
  };

  // Xử lý khi chọn file ảnh
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Convert FileList to Array và giới hạn 5 ảnh
      const remainingSlots = 5 - localPreviewImages.length;
      if (remainingSlots <= 0) {
        alert("Bạn chỉ có thể tải lên tối đa 5 ảnh");
        return;
      }

      const newFiles = Array.from(event.target.files).slice(0, remainingSlots);

      // Validate file types
      const invalidFiles = newFiles.filter(
        (file) => !file.type.startsWith("image/")
      );
      if (invalidFiles.length > 0) {
        alert("Vui lòng chỉ chọn các tệp hình ảnh");
        return;
      }

      // Update the list of files to upload
      setImagesToUpload((prevFiles) => [...prevFiles, ...newFiles]);

      // Create local preview URLs
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

      setLocalPreviewImages((prevUrls) => [...prevUrls, ...newPreviewUrls]);
    }
  };

  // Xóa ảnh đã chọn
  const removeImage = (index: number) => {
    // Revoke object URL để tránh rò rỉ bộ nhớ
    URL.revokeObjectURL(localPreviewImages[index]);

    // Xóa file khỏi danh sách upload
    setImagesToUpload((prevFiles) => prevFiles.filter((_, i) => i !== index));

    // Xóa preview
    setLocalPreviewImages((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  // Xem trước ảnh trong modal
  const handlePreview = (image: string) => {
    setPreviewImage(image);
    setIsModalVisible(true);
  };

  // Đóng modal preview
  const closeModal = () => {
    setIsModalVisible(false);
    setPreviewImage(null);
  };

  // Xử lý submit form đánh giá
  const handleSubmitRating = async () => {
    try {
      setLoading(true);

      // Upload ảnh lên Supabase nếu có
      let uploadedImageUrls: string[] = [];
      if (imagesToUpload.length > 0) {
        uploadedImageUrls = await uploadImagesToSupabase(imagesToUpload);
      }

      // Đây là nơi bạn sẽ gửi dữ liệu đánh giá và URL ảnh đến API của bạn
      // Ví dụ:
      // const ratingData = {
      //   productId: "123", // Lấy từ props hoặc state
      //   review: reviewText,
      //   rating: 4, // Giả sử có state để lưu số sao đánh giá
      //   images: uploadedImageUrls
      // };
      //
      // await fetch("http://localhost:3000/api/ratings", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(ratingData),
      // });

      alert("Đánh giá sản phẩm thành công!");

      // Reset form sau khi submit
      setReviewText("");
      setLocalPreviewImages([]);
      setImagesToUpload([]);
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Cleanup function khi unmount component
  useEffect(() => {
    return () => {
      // Revoke tất cả các object URL để tránh rò rỉ bộ nhớ
      localPreviewImages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="rating-container">
      <Header />
      <div className="review-container">
        <div className="rating-header">
          <div className="rating-information">
            <div className="rating-image">
              <img src={ImgProduct} alt="ImgProduct" className="ic_20" />
            </div>
            <div className="rating-info">
              <div className="rating-title-product">
                500g Beef Limited Premium
              </div>
              <div className="rating-weight">500g</div>
              <div className="rating-quantity">x2</div>
            </div>
            <div className="rating-price">69$</div>
          </div>

          <div className="store-name">
            <img src={ImgStore} alt="ImgStore" />
            Lays Việt Nam
          </div>
        </div>

        <div className="rating-section">
          <div className="rating-section-title">
            <span className="name-product-quality">Product Quality:</span>
            <div className="stars">
              <img src={iconStarFill} alt="iconStar" className="ic_28" />
              <img src={iconStarFill} alt="iconStar" className="ic_28" />
              <img src={iconStarFill} alt="iconStar" className="ic_28" />
              <img src={iconStarFill} alt="iconStar" className="ic_28" />
              <img src={iconStar} alt="iconStar" className="ic_28" />
              <span className="rating-text">Good</span>
            </div>
          </div>
        </div>

        <div className="feedback">
          <div className="form-group">
            <label className="form-label">
              Your rate <span className="required">*</span>
            </label>
            <textarea
              placeholder="Share more thoughts on the product to help other buyers"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">
              Image (max 5) <span className="required">*</span>
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
                    <img src={ImgLoad} alt="ImgLoad" />
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

              <Modal
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                centered
                styles={{
                  body: {
                    padding: 0,
                    textAlign: "center",
                  },
                }}
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

        <div className="form-actions-rating">
          <button className="btn-cancel-rating">Cancel</button>
          <button
            className="btn-submit-rating"
            onClick={handleSubmitRating}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingProduct;
