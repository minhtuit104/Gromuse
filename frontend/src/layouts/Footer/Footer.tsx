import './footer.css';
import ImgFooter from '../../assets/images/imagePNG/backgroudFooter.png';

const Footer = () => {
    return (
        <div className='footer'>
            <img src={ImgFooter} alt='footer' className='imgFooter'/>
        </div>
    );
};

export default Footer;