import "./footer.css";
import imgFooter1 from "../../assets/images/imagePNG/Img_Footer1.png";
import imgFooter2 from "../../assets/images/imagePNG/Img_Footer2.png";
import imgFooter3 from "../../assets/images/imagePNG/Img_Footer3.png";
import imgFooter4 from "../../assets/images/imagePNG/Img_Footer4.png";

const Footer = () => {
  return (
    <div className="footer">
      <div className="footer-content">
        <div className="footer-header">
          <h2 className="footer-title">We always provide</h2>
          <h3 className="footer-subtitle">you the best in town</h3>
          <p className="footer-description">
            Since 2007 we have been delivering excellence in product
            development,
            <br />
            support & updates for frictionless shopping experiences.
          </p>
        </div>

        <div className="footer-services">
          <div className="service-card">
            <h4 className="service-title">
              Present a<br />
              Gift card
            </h4>
            <div className="service-image">
              <img src={imgFooter1} alt="Gift card" />
            </div>
          </div>

          <div className="service-card">
            <h4 className="service-title">
              Gromuse
              <br />
              Gift vouchers
            </h4>
            <div className="service-image">
              <img src={imgFooter2} alt="Gift card" />
            </div>
          </div>

          <div className="service-card">
            <h4 className="service-title">
              Pay your
              <br />
              tabby invoice
            </h4>
            <div className="service-image">
              <img src={imgFooter3} alt="Gift card" />
            </div>
          </div>

          <div className="service-card">
            <h4 className="service-title">
              Order
              <br />
              and Collect
            </h4>
            <div className="service-image">
              <img src={imgFooter4} alt="Gift card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
