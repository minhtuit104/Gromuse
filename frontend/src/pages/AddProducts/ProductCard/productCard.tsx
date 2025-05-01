import React from "react";
import "./productCard.css";
import ImgPlaceholder from "../../../assets/images/imagePNG/green-broccoli-levitating-white-background 1.png";
import ImgAdd from "../../../assets/images/icons/ic_add.svg";
import ImgStar from "../../../assets/images/icons/ic_star_fill.svg";

export interface Product {
  id: number;
  name: string;
  img: string;
  tag: string;
  weight: number;
  price: number;
  backgroundColor?: string;
  active?: boolean;
  category?: { id: string; name: string };
  discount?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  averageRating?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
  style?: React.CSSProperties;
}

// Hàm kiểm tra độ sáng của màu
const isLightColor = (color: string): boolean => {
  // Loại bỏ ký tự '#' nếu có
  color = color.replace("#", "");

  // Chuyển hex thành RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Tính độ sáng
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Nếu độ sáng > 125, coi là màu sáng
  return brightness > 125;
};

// Hàm kiểm tra xem màu chữ có đủ tương phản với màu nền không
const isReadable = (textColor: string, backgroundColor: string): boolean => {
  // Chuyển hex thành RGB
  const getRGB = (color: string) => {
    color = color.replace("#", "");
    return {
      r: parseInt(color.substr(0, 2), 16),
      g: parseInt(color.substr(2, 2), 16),
      b: parseInt(color.substr(4, 2), 16),
    };
  };

  const bgRGB = getRGB(backgroundColor);
  const textRGB = getRGB(textColor);

  // Công thức tương phản (WCAG Level AA)
  const luminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };

  const bgLum = luminance(bgRGB.r, bgRGB.g, bgRGB.b);
  const textLum = luminance(textRGB.r, textRGB.g, textRGB.b);
  const contrastRatio =
    textLum > bgLum
      ? (textLum + 0.05) / (bgLum + 0.05)
      : (bgLum + 0.05) / (textLum + 0.05);

  // Yêu cầu tương phản tối thiểu (4.5:1 cho WCAG AA)
  return contrastRatio >= 4.5;
};

// Format rating to display with one decimal place if needed
const formatRating = (rating: number | undefined): string => {
  if (rating === undefined || rating === null) return "0.0";
  return rating % 1 === 0 ? rating.toString() : rating.toFixed(1);
};

const ProductCard: React.FC<ProductCardProps> = ({ product, style }) => {
  // Thêm xử lý cho URL hình ảnh
  const imageUrl =
    product.img && product.img.length > 0
      ? product.img // Sử dụng URL hình ảnh nếu có
      : ImgPlaceholder; // Sử dụng ảnh mặc định nếu không

  // Xác định màu nền từ style hoặc mặc định là #FFFFFF
  const backgroundColor = style?.backgroundColor || "#FFFFFF";

  // Xác định màu chữ mặc định dựa trên độ sáng của màu nền
  const defaultTextColor = isLightColor(backgroundColor)
    ? "#000000"
    : "#FFFFFF";

  // Định nghĩa màu chữ cố định theo yêu cầu
  const nameTagColor = "#085D4A"; // Màu cho {Name} và ({tag})
  const weightColor = "#7C7C7C"; // Màu cho {weight}g
  const priceColor = "#085D4A"; // Màu cho {price} $

  // Kiểm tra và điều chỉnh màu chữ nếu không đủ tương phản với màu nền
  const adjustedNameTagColor = isReadable(nameTagColor, backgroundColor)
    ? nameTagColor
    : defaultTextColor;
  const adjustedWeightColor = isReadable(weightColor, backgroundColor)
    ? weightColor
    : defaultTextColor;
  const adjustedPriceColor = isReadable(priceColor, backgroundColor)
    ? priceColor
    : defaultTextColor;

  // Format the rating to display
  const displayRating = formatRating(product.averageRating);

  return (
    <div
      className="add-product-card"
      style={{
        ...style,
        color: defaultTextColor, // Màu chữ mặc định cho toàn bộ card (nếu cần)
      }}
    >
      <div className="add-product-image-container">
        <img src={imageUrl} alt={product.name} className="add-product-image" />
        <div className="rating">
          <span style={{ color: adjustedNameTagColor, fontWeight: "700" }}>
            {displayRating}
          </span>
          <img src={ImgStar} alt="Star" className="ic_20 " />
        </div>
      </div>
      <div className="add-product-info">
        <h2 className="add-product-name">
          <span style={{ color: adjustedNameTagColor, fontWeight: "bold" }}>
            {product.name}
          </span>{" "}
          <span
            className="add-product-tag"
            style={{ color: adjustedNameTagColor }}
          >
            ({product.tag})
          </span>
        </h2>
        <p
          className="add-product-weight"
          style={{ color: adjustedWeightColor }}
        >
          {product.weight}g
        </p>
        <p className="add-product-price" style={{ color: adjustedPriceColor }}>
          {product.price} $
        </p>
      </div>
      <div className="add-to-cart-button">
        <img src={ImgAdd} alt="Add Icon" className="ic_20" />
      </div>
    </div>
  );
};

export default ProductCard;
