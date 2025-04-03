import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./addProduct.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import HeaderDashboard from "../../pages/DashboardPage/Header/HeaderDashboard";
import ImgAddImg from "../../assets/images/icons/ic_add_image.svg";
import ImgColor from "../../assets/images/icons/ic_color.svg";
import IcEye from "../../assets/images/icons/ic_eye.svg";
import SwitchButton from "../../components/SwitchBtn/SwitchButton";
import ProductCard from "./ProductCard/productCard";
import TextInput from "../../components/TextInput/TextInput";
import { useFormik } from "formik";
import * as Yup from "yup";
import { DatePicker, Modal } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import moment from "moment";

const loadSupabaseClient = async () => {
  const module = await import("../../lib/supabaseClient");
  return module.createSupabaseClient();
};

interface Product {
  id: number;
  name: string;
  img: string;
  tag: string;
  weight: number;
  price: number;
  backgroundColor?: string;
  active?: boolean;
  category?: { id: string; name: string };
  amount?: number;
  discount?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface FormValues {
  name: string;
  price: string;
  amount: string;
  discount: string;
  weight: string;
  startDate: string;
  endDate: string;
  category: string;
  tag: string;
  backgroundColor: string;
  description: string;
  active: boolean;
  img: string;
}

const AddProduct = () => {
  const { id } = useParams<{ id: string }>(); // Lấy id từ URL params
  const navigate = useNavigate(); // Để redirect sau khi edit/add thành công
  const location = useLocation();
  const isEditMode = !!id; // Kiểm tra xem có phải chế độ edit không

  // Thêm state để lưu trữ file hình ảnh
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [localPreviewImages, setLocalPreviewImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const formik = useFormik({
    initialValues: {
      name: "",
      price: "",
      amount: "",
      discount: "",
      weight: "",
      startDate: "",
      endDate: "",
      category: "",
      tag: "",
      backgroundColor: "#FFFFFF",
      description: "",
      active: true,
      img: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      price: Yup.number().required("Price is required"),
      amount: Yup.number().required("Amount is required"),
      weight: Yup.number().required("Weight is required"),
      category: Yup.string().required("Category is required"),
    }),
    // Trong phần onSubmit của formik, cập nhật lại cách lưu ảnh:
    onSubmit: async (values: FormValues) => {
      // Upload images first, then add/update product
      let uploadedImageUrls: string[] = [...existingImages]; // Start with existing images

      if (imagesToUpload.length > 0) {
        try {
          setLoading(true);
          const newUploadedUrls = await uploadImagesToSupabase(imagesToUpload);
          uploadedImageUrls = [...existingImages, ...newUploadedUrls];
          setLoading(false);
        } catch (error) {
          console.error("Error uploading images:", error);
          alert("Failed to upload images. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Use the first image as the main image, but save all images
      const mainImageUrl =
        uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : "";

      const productData = {
        ...values,
        weight: parseInt(values.weight, 10),
        price: parseFloat(values.price),
        amount: parseInt(values.amount, 10),
        discount: parseInt(values.discount || "0", 10),
        startDate: values.startDate
          ? moment(values.startDate).toISOString()
          : null,
        endDate: values.endDate ? moment(values.endDate).toISOString() : null,
        img: mainImageUrl, // Giữ lại cho tương thích ngược
        images: uploadedImageUrls, // Lưu tất cả các URL hình ảnh
      };

      if (isEditMode) {
        updateProduct(productData);
      } else {
        addProductToAPI(productData);
      }
    },
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Function to upload images to Supabase
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
        const fileName = `${Date.now()}_${Math.random()
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

  useEffect(() => {
    // Fetch tất cả sản phẩm cho danh sách hiển thị
    fetch("http://localhost:3000/api/products")
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));

    // Nếu là chế độ edit, fetch sản phẩm theo id
    if (isEditMode && id) {
      fetchProductById(parseInt(id, 10));
    }
  }, [id, isEditMode]);

  const fetchProductById = async (productId: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/products/${productId}`
      );
      if (!response.ok) throw new Error("Failed to fetch product");
      const product = await response.json();

      formik.setValues({
        name: product.name,
        price: product.price.toString(),
        amount: product.amount.toString(),
        discount: product.discount?.toString() || "",
        weight: product.weight.toString(),
        startDate: product.startDate
          ? moment(product.startDate).format("YYYY-MM-DD")
          : "",
        endDate: product.endDate
          ? moment(product.endDate).format("YYYY-MM-DD")
          : "",
        category: product.category?.name || "",
        tag: product.tag || "",
        backgroundColor: product.backgroundColor || "#FFFFFF",
        description: product.description || "",
        active: product.active || true,
        img: product.img || "",
      });

      // Xử lý các hình ảnh đã tồn tại
      if (product.images && product.images.length > 0) {
        setExistingImages(product.images);
        setLocalPreviewImages(product.images);
      } else if (product.img) {
        // Xử lý trường hợp có img nhưng không có images (cho tương thích ngược)
        setExistingImages([product.img]);
        setLocalPreviewImages([product.img]);
      } else {
        const ImgPlaceholder =
          "../../../assets/images/imagePNG/green-broccoli-levitating-white-background 1.png";
        setLocalPreviewImages([ImgPlaceholder]);
      }
    } catch (error: unknown) {
      console.error("Error fetching product:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch product";
      alert(`Error: ${errorMessage}`);
    }
  };

  const addProductToAPI = async (productData: any) => {
    setLoading(true);
    console.log("Starting addProductToAPI with data:", productData);

    try {
      const response = await fetch("http://localhost:3000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      console.log("Response received:", response.status, response.statusText);

      const responseData = await response.json().catch((err) => {
        console.error("Failed to parse response JSON:", err);
        return { message: "Invalid response from server" };
      });

      if (response.ok) {
        console.log("Product added successfully:", responseData);
        alert("Product added successfully!");
        setProducts((prev) => [...prev, responseData]);
        formik.resetForm();
        setLocalPreviewImages([]);
        setImagesToUpload([]);
        setExistingImages([]);
      } else {
        console.error("API error response:", responseData);
        throw new Error(responseData.message || "Failed to add product");
      }
    } catch (error: unknown) {
      console.error("Error in addProductToAPI:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add product";
      alert(`Error: ${errorMessage}`);
    } finally {
      console.log("Resetting loading state...");
      setLoading(false); // Luôn reset loading state
    }
  };

  const updateProduct = async (productData: any) => {
    setLoading(true);
    console.log("Starting updateProduct with data:", productData);

    try {
      if (!id) throw new Error("No product ID provided for update");
      const numericId = parseInt(id, 10);

      const response = await fetch(
        `http://localhost:3000/api/products/${numericId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        }
      );
      console.log("Response received:", response.status, response.statusText);

      const responseData = await response.json().catch((err) => {
        console.error("Failed to parse response JSON:", err);
        return { message: "Invalid response from server" };
      });

      if (response.ok) {
        console.log("Product updated successfully:", responseData);
        alert("Product updated successfully!");
        setProducts((prev) =>
          prev.map((p) => (p.id === numericId ? responseData : p))
        );
      } else {
        console.error("API error response:", responseData);
        throw new Error(responseData.message || "Failed to update product");
      }
    } catch (error: unknown) {
      console.error("Error in updateProduct:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update product";
      alert(`Error: ${errorMessage}`);
    } finally {
      console.log("Resetting loading state...");
      setLoading(false); // Luôn reset loading state
    }
  };

  const handleAddToCart = (productId: string) => {
    fetch("http://localhost:3000/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    })
      .then(async (response) => {
        if (response.ok) {
          alert("Product added to cart!");
        } else {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          alert(
            `Failed to add product to cart: ${errorText || "Failed to fetch"}`
          );
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        alert("Failed to add product to cart due to network error.");
      });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Convert FileList to Array and limit to 5 images
      const newFiles = Array.from(event.target.files).slice(0, 5);

      // Validate file types
      const invalidFiles = newFiles.filter(
        (file) => !file.type.startsWith("image/")
      );
      if (invalidFiles.length > 0) {
        alert("Vui lòng chỉ chọn các tệp hình ảnh");
        return;
      }

      // Update the list of files to upload
      setImagesToUpload((prevFiles) => {
        // Limit total files to 10
        const updatedFiles = [...prevFiles, ...newFiles].slice(
          0,
          10 - existingImages.length
        );
        return updatedFiles;
      });

      // Create local preview URLs
      const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));

      setLocalPreviewImages((prevUrls) => {
        // Limit total previews to 10
        const combinedUrls = [...prevUrls, ...newPreviewUrls].slice(0, 10);
        return combinedUrls;
      });
    }
  };

  const removeImage = (index: number) => {
    // Check if it's an existing image or a local preview
    if (index < existingImages.length) {
      // It's an existing image
      setExistingImages((prevImages) =>
        prevImages.filter((_, i) => i !== index)
      );
    } else {
      // It's a local preview - adjust index for the imagesToUpload array
      const adjustedIndex = index - existingImages.length;
      setImagesToUpload((prevFiles) =>
        prevFiles.filter((_, i) => i !== adjustedIndex)
      );

      // Also remove the preview URL
      URL.revokeObjectURL(localPreviewImages[index]); // Clean up object URL
    }

    // Update the preview images list
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

  const [formData, setFormData] = useState({
    active: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prevData) => ({ ...prevData, [field]: value }));
  };

  const sampleProduct: Product = {
    id: isEditMode && id ? parseInt(id, 10) : 1,
    name: formik.values.name || "Sample Product",
    // Sử dụng hình ảnh đầu tiên từ localPreviewImages nếu có
    img:
      localPreviewImages.length > 0
        ? localPreviewImages[0]
        : formik.values.img || "",
    tag: formik.values.tag || "Eco-Friendly",
    weight: parseInt(formik.values.weight || "0", 10),
    price: parseFloat(formik.values.price || "0"),
    amount: parseInt(formik.values.amount || "0", 10),
    discount: parseInt(formik.values.discount || "0", 10),
    backgroundColor: formik.values.backgroundColor || "#FFFFFF",
    active: formik.values.active || true,
    category: formik.values.category
      ? { id: formik.values.category, name: formik.values.category }
      : undefined,
  };

  const categoryMapping: Record<string, string> = {
    "Vegetables (Rau củ)": "Vegetables",
    "Fruits (Trái cây)": "Fruits",
    "Meats & Seafood (Thịt & Hải sản)": "MeatsAndSeafood",
    "Dairy & Eggs (Sữa & Trứng)": "DairyAndEggs",
    "Milks & Drinks (Sữa & Đồ uống)": "MilksAndDrinks",
    "Bakery & Snacks (Bánh & Đồ ăn vặt)": "BakeryAndSnacks",
    "Grains & Cereals (Ngũ cốc & Gạo)": "GrainsAndCereals",
    "Spices & Condiments (Gia vị & Nước sốt)": "SpicesAndCondiments",
    "Frozen Foods (Thực phẩm đông lạnh)": "FrozenFoods",
    "Organic & Healthy Foods (Thực phẩm hữu cơ & Tốt cho sức khỏe)":
      "OrganicAndHealthyFoods",
    "Canned & Preserved Foods (Thực phẩm đóng hộp & Bảo quản)":
      "CannedAndPreservedFoods",
    "Nuts & Seeds (Hạt & Đậu)": "NutsAndSeeds",
    "Oils & Vinegars (Dầu ăn & Giấm)": "OilsAndVinegars",
    "Ready-to-Eat Meals (Thực phẩm chế biến sẵn)": "ReadyToEatMeals",
    "Beverages & Juices (Nước giải khát & Nước ép)": "BeveragesAndJuices",
    "Herbs & Mushrooms (Thảo mộc & Nấm)": "HerbsAndMushrooms",
  };

  const categoryToTagMap: Record<string, string> = {
    Vegetables: "🏷️ Local Market",
    Fruits: "🏷️ Chemical Free",
    MeatsAndSeafood: "🏷️ Premium Quality",
    DairyAndEggs: "🏷️ Farm Fresh",
    MilksAndDrinks: "🏷️ Energy Boost",
    BakeryAndSnacks: "🏷️ In Store Delivery",
    GrainsAndCereals: "🏷️ Whole Nutrition",
    SpicesAndCondiments: "🏷️ Authentic Taste",
    FrozenFoods: "🏷️ Quick & Easy",
    OrganicAndHealthyFoods: "🏷️ Eco-Friendly",
    CannedAndPreservedFoods: "🏷️ Long Shelf Life",
    NutsAndSeeds: "🏷️ Superfood",
    OilsAndVinegars: "🏷️ Cold Pressed",
    ReadyToEatMeals: "🏷️ Convenience",
    BeveragesAndJuices: "🏷️ Refreshing",
    HerbsAndMushrooms: "🏷️ Medicinal Benefits",
  };

  const handleCategoryChange = (value: string) => {
    const englishCategory = categoryMapping[value] || "";
    console.log("Selected category:", englishCategory); // Debug
    formik.setFieldValue("category", englishCategory);
    formik.setFieldValue("tag", categoryToTagMap[englishCategory] || "");
  };

  const handleTextInputChange = (value: string, field: string) => {
    if (field === "name") {
      const lettersOnly = value.replace(/[^a-zA-Z\u00C0-\u1EF9\s]/g, "");
      formik.setFieldValue(field, lettersOnly);
    } else if (["price", "amount", "discount"].includes(field)) {
      const numbersOnly = value.replace(/[^0-9]/g, "");
      formik.setFieldValue(field, numbersOnly);
    } else {
      formik.setFieldValue(field, value);
    }
  };

  const quillRef = useRef<ReactQuill>(null);

  // Tùy chỉnh toolbar của ReactQuill để thêm nút upload hình ảnh
  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ script: "sub" }, { script: "super" }],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["link", "image", "video"],
        ["clean"],
      ],
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
    "color",
    "background",
  ];

  // Cleanup function for object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all created object URLs to prevent memory leaks
      localPreviewImages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="add-product">
      <HeaderDashboard />
      <div className="add-product-container">
        <h1 className="add-product-header">
          {isEditMode ? "Edit Product" : "Add New Product"}
        </h1>
        <div className="add-product-line"></div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            formik.handleSubmit(e); // Sử dụng formik.handleSubmit để xử lý validation
          }}
        >
          <div className="form-grid">
            {/* Name and Price */}
            <div className="form-group-row">
              <TextInput
                label="Name"
                required
                placeholder="Enter name"
                value={formik.values.name}
                onChange={(value) => handleTextInputChange(value, "name")}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.name && formik.errors.name
                    ? formik.errors.name
                    : undefined
                }
              />
              <TextInput
                label="Price ($)"
                required
                placeholder="Enter price"
                value={formik.values.price}
                onChange={(value) => handleTextInputChange(value, "price")}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.price && formik.errors.price
                    ? formik.errors.price
                    : undefined
                }
              />
            </div>

            {/* Amount and Weight */}
            <div className="form-group-row">
              <TextInput
                label="Amount"
                required
                placeholder="Enter amount"
                value={formik.values.amount}
                onChange={(value) => formik.setFieldValue("amount", value)}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.amount && formik.errors.amount
                    ? formik.errors.amount
                    : undefined
                }
              />
              <TextInput
                label="Weight (g)"
                required
                placeholder="Enter weight"
                value={formik.values.weight}
                onChange={(value) => formik.setFieldValue("weight", value)}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.weight && formik.errors.weight
                    ? formik.errors.weight
                    : undefined
                }
              />
            </div>

            {/* Discount and Dates */}
            <div className="form-group-row">
              <TextInput
                label="Discount (%)"
                placeholder="Enter discount"
                value={formik.values.discount}
                onChange={(value) => formik.setFieldValue("discount", value)}
              />
              <div className="form-group add-product-date">
                <div className="date-picker-wrapper">
                  <label className="form-label">Start Date</label>
                  <DatePicker
                    placeholder="Select start date"
                    value={
                      formik.values.startDate
                        ? moment(formik.values.startDate)
                        : null
                    }
                    onChange={(date, dateString) =>
                      formik.setFieldValue("startDate", dateString)
                    }
                    suffixIcon={<CalendarOutlined />}
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="date-picker-wrapper">
                  <label className="form-label">End Date</label>
                  <DatePicker
                    placeholder="Select end date"
                    value={
                      formik.values.endDate
                        ? moment(formik.values.endDate)
                        : null
                    }
                    onChange={(date, dateString) =>
                      formik.setFieldValue("endDate", dateString)
                    }
                    suffixIcon={<CalendarOutlined />}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* Category, Tag, and Background Color */}
            <div className="form-group-row four-div">
              <div className="form-group-row three-div">
                <div className="image-upload-container">
                  <label className="form-label">
                    Image <span className="required-asterisk">*</span>
                  </label>
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
                        {index === 0 && (
                          <div className="main-image-badge"></div>
                        )}
                      </div>
                    ))}
                    {localPreviewImages.length < 10 && (
                      <div
                        className="image-icon"
                        onClick={() =>
                          document.getElementById("file-input")?.click()
                        }
                      >
                        <img src={ImgAddImg} alt="Add Icon" className="ic_28" />
                      </div>
                    )}
                  </div>

                  <input
                    id="file-input"
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

                <div className="form-category">
                  <label className="form-label">
                    Category <span className="required-asterisk">*</span>
                  </label>
                  <select
                    name="category"
                    value={
                      formik.values.category
                        ? Object.keys(categoryMapping).find(
                            (key) =>
                              categoryMapping[key] === formik.values.category
                          ) || ""
                        : ""
                    }
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="select-field"
                    required
                  >
                    <option value="">Select category</option>
                    {Object.keys(categoryMapping).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </div>

                <TextInput
                  label="Tag"
                  placeholder=""
                  value={formik.values.tag}
                  disabled
                />

                <div className="color-picker-wrapper">
                  <label className="form-label">Background color</label>
                  <div className="color-input-wrapper">
                    <input
                      type="text"
                      name="backgroundColor"
                      value={formik.values.backgroundColor}
                      onChange={(e) =>
                        formik.setFieldValue("backgroundColor", e.target.value)
                      }
                      placeholder="#FFFFFF"
                      className="text-input color-text-input"
                    />
                    <img
                      src={ImgColor}
                      alt="Color Picker"
                      className="color-picker-icon"
                      onClick={() =>
                        document.getElementById("colorPicker")?.click()
                      }
                    />
                    <input
                      type="color"
                      name="colorPicker"
                      value={formik.values.backgroundColor}
                      onChange={(e) =>
                        formik.setFieldValue("backgroundColor", e.target.value)
                      }
                      className="color-picker-hidden"
                      id="colorPicker"
                    />
                  </div>
                </div>
              </div>
              <div className="product-preview">
                <div className="product-label-preview">
                  <label className="form-label">Preview</label>
                </div>
                <div className="product-preview-text">
                  <p className="text-p">
                    The item will be displayed outside the homepage.
                  </p>
                </div>
                <div className="product-preview-image">
                  <ProductCard
                    product={sampleProduct}
                    onAddToCart={(id) => handleAddToCart(id)}
                    style={{
                      backgroundColor: formik.values.backgroundColor,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-group mt-4">
              <label className="form-label">
                Description <span className="required-asterisk">*</span>
              </label>
              <ReactQuill
                ref={quillRef}
                value={formik.values.description || ""} // Đảm bảo giá trị không undefined
                onChange={(value: string) =>
                  formik.setFieldValue("description", value)
                }
                theme="snow"
                placeholder="Enter description"
                modules={modules}
                formats={formats}
              />
            </div>

            {/* Active Toggle */}
            <div className="checkbox-container">
              <SwitchButton
                label="Active"
                checked={formData.active}
                onChange={(checked) => handleInputChange("active", checked)}
                onColor="#4CAF50"
                offColor="#D9534F"
                height={20}
                width={48}
              />
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  navigate(isEditMode ? `/add_product/${id}` : "/add_product")
                }
              >
                Cancel
              </button>
              <button type="submit" className="add-button" disabled={loading}>
                {loading
                  ? isEditMode
                    ? "Updating..."
                    : "Adding..."
                  : isEditMode
                  ? "Update"
                  : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
