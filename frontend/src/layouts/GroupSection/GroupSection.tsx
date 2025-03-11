import "./groupSection.css";
import ImgVegetable_1 from "../../assets/images/imagePNG/vegetables_icon 1.png";
import ImgBread_1 from "../../assets/images/imagePNG/bread_icon 1.png";
import ImgFruit_1 from "../../assets/images/imagePNG/fruits_icon 1.png";
import ImgMeat_1 from "../../assets/images/imagePNG/meats_icon 1.png";
import ImgMilk_1 from "../../assets/images/imagePNG/milks_icon 1.png";

function GroupSection() {
  return (
    <div className="group-section">
      <div className="group-section-item">
        <div className="group-section-item-text">
          <h3>Vegetable</h3>
          <span>Local market</span>
        </div>
        <div className="group-section-item-img">
          <img src={ImgVegetable_1} alt="img-banner" />
        </div>
      </div>

      <div className="group-section-item">
        <div className="group-section-item-text">
          <h3>Breads</h3>
          <span>In store delivery</span>
        </div>
        <div className="group-section-item-img">
          <img src={ImgBread_1} alt="img-bread" />
        </div>
      </div>

      <div className="group-section-item">
        <div className="group-section-item-text">
          <h3>Fruits</h3>
          <span>Chemical free</span>
        </div>
        <div className="group-section-item-img">
          <img src={ImgFruit_1} alt="img-fruit" />
        </div>
      </div>

      <div className="group-section-item">
        <div className="group-section-item-text">
          <h3>Meats</h3>
          <span>Frozen meal</span>
        </div>
        <div className="group-section-item-img">
          <img src={ImgMeat_1} alt="img-meat" />
        </div>
      </div>

      <div className="group-section-item">
        <div className="group-section-item-text">
          <h3>Milks & drinks</h3>
          <span>Process food</span>
        </div>
        <div className="group-section-item-img">
          <img src={ImgMilk_1} alt="img-milk" />
        </div>
      </div>
    </div>
  );
}

export default GroupSection;
