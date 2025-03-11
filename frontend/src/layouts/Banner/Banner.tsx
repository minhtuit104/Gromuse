import "./banner.css";
import ImgVegetable from "../../assets/images/imagePNG/vegetable line 1.png";
import ImgVegetable_bag from "../../assets/images/imagePNG/vegetable_bag.png";

function Banner() {
  return (
    <div className="banner">
      <div className="banner-content">
        <div className="banner-content-left">
          <div className="banner-content-left-title">
            <span>We bring the store to your door</span>
          </div>
          <div className="banner-content-left-description">
            <span>
              Get organic produce and sustainably sourced groceries delivery at
              up to 4% off grocery.
            </span>
          </div>
          <button>Shop Now</button>
        </div>
        <div className="banner-content-right">
          <img src={ImgVegetable_bag} alt="img-banner" />
        </div>
      </div>
      <div className="banner-footer-img">
        <img src={ImgVegetable} alt="img-banner" />
      </div>
    </div>
  );
}

export default Banner;
