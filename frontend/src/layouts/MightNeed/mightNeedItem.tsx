import { useState } from 'react';
import IconPlus from '../../assets/images/icons/ic_add.svg';


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
}

export interface mightNeedItemProps {
    item: Product;
}

export const mightNeedItem = ({item} : mightNeedItemProps) => {
  return (
    <div>
        <div className="might-need-item" key={`product-${item.id}`}>
            <div className="might-need-item-header">
                <img src={item?.img} alt="img-item" />
            </div>
            <div className="might-need-item-body">
                <p className="might-need-item-name">{item?.name}</p>
                <p className="might-need-item-source">{item?.source}</p>
                <span className="might-need-item-weight">{item?.weight}</span>
                <span className="might-need-item-price">{item?.price}</span>
            </div>
            <div className="might-need-item-footer">
                <button className="might-need-item-button"><img src={IconPlus} alt="img-plus"/></button>
            </div>
        </div>
    </div>
  )
}
