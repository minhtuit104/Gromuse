import { useEffect, useState } from "react";
import "./mightNeed.css";
import IconArrowRight from "../../assets/images/icons/ic_ arrow-right.svg";
import ImgItem1 from "../../assets/images/imagePNG/green-broccoli1.png";
import IconPlus from "../../assets/images/icons/ic_add.svg";

function MightNeed() {
  const [products, setProducts] = useState<any[]>([]);

  return (
    <div className="might-need">
      <div className="might-need-header">
        <h2>You might need</h2>
        <span>
          See more <img src={IconArrowRight} alt="img-arrow-right" />
        </span>
      </div>
      <div className="might-need-list">
        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem1} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Broccoli</p>
            <p className="might-need-item-source">(Local market)</p>
            <span className="might-need-item-weight">500g</span>
            <span className="might-need-item-price">17.29 $</span>
          </div>
          <div className="might-need-item-footer">
            <button className="might-need-item-button">
              <img src={IconPlus} alt="img-plus" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MightNeed;
