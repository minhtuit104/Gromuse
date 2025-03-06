import "./mightNeed.css";
import IconArrowRight from "../../assets/images/icons/ic_ arrow-right.svg";
import ImgItem1 from "../../assets/images/imagePNG/green-broccoli1.png";
import ImgItem2 from "../../assets/images/imagePNG/beef 1.png";
import ImgItem3 from "../../assets/images/imagePNG/avocado 1.png";
import ImgItem4 from "../../assets/images/imagePNG/banana 1.png";
import ImgItem5 from "../../assets/images/imagePNG/carrot.png";
import ImgItem6 from "../../assets/images/imagePNG/radish 1.png";
import ImgItem7 from "../../assets/images/imagePNG/cocacola 1.png";
import ImgItem8 from "../../assets/images/imagePNG/sandwich_bread.png";
import ImgItem9 from "../../assets/images/imagePNG/cabbage 1.png";
import IconPlus from "../../assets/images/icons/ic_add.svg";

function MightNeed() {
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

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem2} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Beef</p>
            <p className="might-need-item-source">(Frozen meal)</p>
            <span className="might-need-item-weight">500g</span>
            <span className="might-need-item-price">17.29 $</span>
          </div>
          <div className="might-need-item-footer">
            <button className="might-need-item-button">
              <img src={IconPlus} alt="img-plus" />
            </button>
          </div>
        </div>

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem3} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Avocado</p>
            <p className="might-need-item-source">(Chemical free)</p>
            <span className="might-need-item-weight">500g</span>
            <span className="might-need-item-price">17.29 $</span>
          </div>
          <div className="might-need-item-footer">
            <button className="might-need-item-button">
              <img src={IconPlus} alt="img-plus" />
            </button>
          </div>
        </div>

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem4} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Banana</p>
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

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem5} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Carrot</p>
            <p className="might-need-item-source">(Chemical free)</p>
            <span className="might-need-item-weight">500g</span>
            <span className="might-need-item-price">17.29 $</span>
          </div>
          <div className="might-need-item-footer">
            <button className="might-need-item-button">
              <img src={IconPlus} alt="img-plus" />
            </button>
          </div>
        </div>

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem6} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Radish</p>
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

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem7} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Coca-Cola</p>
            <p className="might-need-item-source">(Processe food)</p>
            <span className="might-need-item-weight">500g</span>
            <span className="might-need-item-price">17.29 $</span>
          </div>
          <div className="might-need-item-footer">
            <button className="might-need-item-button">
              <img src={IconPlus} alt="img-plus" />
            </button>
          </div>
        </div>

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem8} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Sandwich bread</p>
            <p className="might-need-item-source">(In store delivery)</p>
            <span className="might-need-item-weight">500g</span>
            <span className="might-need-item-price">17.29 $</span>
          </div>
          <div className="might-need-item-footer">
            <button className="might-need-item-button">
              <img src={IconPlus} alt="img-plus" />
            </button>
          </div>
        </div>

        <div className="might-need-item">
          <div className="might-need-item-header">
            <img src={ImgItem9} alt="img-item" />
          </div>
          <div className="might-need-item-body">
            <p className="might-need-item-name">Cabbage</p>
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
