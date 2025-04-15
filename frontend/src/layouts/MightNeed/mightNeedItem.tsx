import { useState } from "react";
import IconPlus from "../../assets/images/icons/ic_add.svg";

export interface Shop {
  idShop: string;
  name: string;
  avatar: string;
}

export interface Product {
  id: string;
  name: string;
  img: string;
  title: string;
  source: string;
  weight: number;
  price: number;
  amount: number;
  created_at: string;
  shop: Shop;
}
export interface mightNeedItemProps {
  product: Product;
  onClick: () => void;
}

export const mightNeedItem = ({ product, onClick }: mightNeedItemProps) => {
  return (
    <div>
      <div
        className="might-need-item"
        key={`product-${product.id}`}
        onClick={onClick}
      >
        <div className="might-need-item-header">
          <img src={product?.img} alt="img-item" />
        </div>
        <div className="might-need-item-body">
          <p className="might-need-item-name">{product?.name}</p>
          <p className="might-need-item-source">{product?.source}</p>
          <span className="might-need-item-weight">{product?.weight}</span>
          <span className="might-need-item-price">{product?.price}</span>
        </div>
        <div className="might-need-item-footer">
          <button className="might-need-item-button">
            <img src={IconPlus} alt="img-plus" />
          </button>
        </div>
      </div>
    </div>
  );
};
