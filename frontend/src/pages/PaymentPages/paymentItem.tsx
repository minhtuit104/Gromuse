import React, { useState } from "react";
import "./paymentPage.css";
import ImgDetailLays from "../../assets/images/imagePNG/Avatar.png";
import IconUp from "../../assets/images/icons/ic_ up.svg";
import IconTrash from "../../assets/images/icons/ic_trash.svg";
import Counter from "../../components/CountBtn/CountBtn";
import { Modal, Button } from "antd";

export interface Product {
  id: string;
  name: string;
  img: string;
  title: string;
  weight: number;
  price: number;
  quantity: number;
  created_at: string;
  isPaid: boolean;
}

export interface Shop {
  id: number;
  avatar: string;
  name: string;
  products: Product[];
  deliveryInfo?: string;
  productIcons?: boolean;
}

interface PaymentItemProps {
  item: Shop;
  isExpandable: boolean;
  onUpdateAmount: (id: string, quantity: number) => void;
  index: number;
  isSecondShop?: boolean;
}

export const PaymentItem = ({
  item,
  onUpdateAmount,
  isSecondShop = false,
}: PaymentItemProps) => {
  const [isItemsVisible, setIsItemsVisible] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const toggleItems = () => {
    setIsItemsVisible(!isItemsVisible);
  };

  const handleSeeMoreProducts = () => {
    setShowAllProducts(true);
  };

  const handleCountChange = (productId: string, newCount: number) => {
    onUpdateAmount(productId, newCount);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onUpdateAmount(productToDelete.id, 0);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const initialProductsToShow = isSecondShop ? 2 : item.products.length;

  // Hiển thị số lượng sản phẩm phù hợp dựa trên trạng thái
  const displayProducts =
    isSecondShop && showAllProducts
      ? item.products
      : item.products.slice(0, initialProductsToShow);

  // Kiểm tra xem có sản phẩm nào cần ẩn không
  const hasMoreProducts =
    isSecondShop && item.products.length > initialProductsToShow;

  return (
    <div className="payment_item" key={item.id}>
      <div className="payment_left_detail_information_top">
        <div className="payment_left_detail_information_top_header">
          <img
            src={item.avatar || ImgDetailLays}
            alt="avt_shop"
            className="img_shop"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = ImgDetailLays;
            }}
          />
          <div className="payment_left_detail_information_shoppers">
            <div className="payment_left_detail_information_shoppers_text">
              <span className="text_1">{item.name || "Lay's Việt Nam"}</span>
              <span className="text_2">{item.deliveryInfo || ""}</span>
            </div>
          </div>
        </div>
        <div className="icon_up" onClick={toggleItems}>
          <img
            src={IconUp}
            alt="icon_up"
            className={`ic_24 ${isItemsVisible ? "rotate" : ""}`}
          />
        </div>
      </div>

      <div
        className={`product-card ${
          isItemsVisible ? "product-card-show" : "product-card-hide"
        }`}
      >
        {displayProducts.map((product, productIndex) => (
          <React.Fragment key={`product-${product.id}-${productIndex}`}>
            <div className="product-card-information">
              <img
                src={
                  product.img && product.img !== "string"
                    ? product.img
                    : ImgDetailLays
                }
                alt={product.name}
                className="product-image-payment"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = ImgDetailLays;
                }}
              />
              <div className="product-info-item">
                <h2 className="product-name">
                  {product.title || product.name}
                </h2>
                <p className="product-weight">
                  {product.weight ? `${product.weight}g` : ""}
                </p>
                <p className="product-price">{`${product.price}$`}</p>
              </div>
              <div className="custom-counter-wrapper">
                <Counter
                  initialCount={product.quantity || 1}
                  onChange={(newCount) =>
                    handleCountChange(product.id, newCount)
                  }
                />
              </div>
              <div
                className="delete-product-btn"
                onClick={() => handleOpenDeleteModal(product)}
              >
                <img src={IconTrash} alt="IconTrash" className="ic_28" />
              </div>
            </div>
            {productIndex !== displayProducts.length - 1 && (
              <div className="product-card-line"></div>
            )}
          </React.Fragment>
        ))}

        {/* Nút "See more..." chỉ hiển thị trong cửa hàng thứ 2 và khi có sản phẩm để hiển thị thêm */}
        {isSecondShop && !showAllProducts && hasMoreProducts && (
          <div className="see-more-container">
            <button className="see-more-btn" onClick={handleSeeMoreProducts}>
              See more...
            </button>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa sản phẩm */}
      {productToDelete && (
        <Modal
          title={
            <>
              <span style={{ color: "#FF424E", fontWeight: "700" }}>Clear</span>
              {": "}
              {productToDelete.title || productToDelete.name}
            </>
          }
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          footer={null}
          centered
          className="delete-product-modal"
          destroyOnClose
        >
          <div className="product-card-line"></div>
          <div className="clear-all-content">
            <p>Do you really want to clear this item?</p>
            <div className="clear-all-buttons">
              <Button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-back"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="btn-confirm-clear"
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PaymentItem;
