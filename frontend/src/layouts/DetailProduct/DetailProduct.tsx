import "./detailProduct.css";
import Img1 from "../../assets/images/imagePNG/lays_1 1.png";
import Img2 from "../../assets/images/imagePNG/lays_2.png";
import Img3 from "../../assets/images/imagePNG/lays_3.png";
import Img4 from "../../assets/images/imagePNG/lays_4.png";
import IconClock from "../../assets/images/icons/ic_ clock.svg";
import IconCart from "../../assets/images/icons/ic_ cart.svg";
import IconSold from "../../assets/images/icons/ic_ flame.svg";

const DetailProduct = () => {
  return (
    <>
      <div className="detail-home-product">
        <div className="detail-home-product-image">
          <div className="detail-home-product-image-parrent">
            <div className="sale-home">
              <p>70%</p>
              <span>Discount</span>
            </div>
            <img src={Img1} alt="product1" />
          </div>
          <div className="detail-home-product-image-options">
            <div className="product-option-item-home">
              <img src={Img2} alt="product" />
            </div>
            <div className="product-option-item-home">
              <img src={Img3} alt="product" />
            </div>
            <div className="product-option-item-home">
              <img src={Img4} alt="product" />
            </div>
          </div>
        </div>
        <div className="detail-home-product-info">
          <div className="detail-home-product-info-time">
            <img src={IconClock} alt="time" className="ic_28" />
            <span>18 : 00 : 25</span>
          </div>

          <div className="detail-home-product-info-content">
            <span className="brand-home">Lay's Việt Nam</span>
            <span className="name-home">
              Snack Lays khoai tây tươi giòn rụm số 1 thế giới{" "}
            </span>
            <span className="price-home">0.5 $</span>
            <span className="description-home">
              Snack khoai tây Lay's MAX 100% khoai tây tươi cắt lát giòn cực
              thích với lát dày siêu lượn sóng. Hương vị đẳng cấp và thời thượng
              cực đậm đà trong từng lát khoai. Mùi thơm cực hấp dẫn không thể
              cưỡng lại ngay từ khi mở gói.
            </span>
          </div>
          <span className="line-home"></span>
          <div className="detail-home-product-info-btn">
            <button className="btn-home-add-cart">
              <img src={IconCart} alt="add cart" className="ic_28" />
              Add to bucket
            </button>
            <button className="btn-buy-now-home">Buy now</button>
          </div>

          <div className="detail-home-product-info-footer">
            <div className="sold-home">
              <img src={IconSold} alt="sold" className="ic_28" />
              <p>100 sold in last 35 hours</p>
            </div>
            <p className="categories-home">
              Categories: Fruits, Breads, Vegetables
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetailProduct;
