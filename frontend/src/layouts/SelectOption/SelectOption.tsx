import './selectOption.css';
import Background_item from '../../assets/images/imagePNG/Rectangle10.png';
import Background_item1 from '../../assets/images/imagePNG/Rectangle10_2.png';
import Background_item2 from '../../assets/images/imagePNG/Rectangle10_3.png';
import Background_item3 from '../../assets/images/imagePNG/Rectangle10_4.png';
import Icon_save from '../../assets/images/icons/ic_sun.svg';
import ImgFooter_item1 from '../../assets/images/imagePNG/Rectangle11.png';
import ImgFooter_item11 from '../../assets/images/imagePNG/Rectangle12.png';
import ImgFooter_item12 from '../../assets/images/imagePNG/cereal_bag.png';
import ImgFooter_item13 from '../../assets/images/imagePNG/wheat.png';
import Icon_discount from '../../assets/images/icons/ic_discount.svg';
import ImgFooter_item2 from '../../assets/images/imagePNG/Rectangle11.png';
import ImgFooter_item21 from '../../assets/images/imagePNG/Rectangle121.png';
import ImgFooter_item22 from '../../assets/images/imagePNG/cereal_bag1.png';
import ImgFooter_item23 from '../../assets/images/imagePNG/wheat11.png';
import Icon_upto from '../../assets/images/icons/ic_ up_to.svg';
import ImgFooter_item3 from '../../assets/images/imagePNG/Rectangle112.png';
import ImgFooter_item31 from '../../assets/images/imagePNG/Rectangle122.png';
import ImgFooter_item32 from '../../assets/images/imagePNG/cereal_bag2.png';
import ImgFooter_item33 from '../../assets/images/imagePNG/wheat2.png';
import Icon_freeshipping from '../../assets/images/icons/ic_ free_ship.svg';
import ImgFooter_item4 from '../../assets/images/imagePNG/Rectangle113.png';
import ImgFooter_item41 from '../../assets/images/imagePNG/Rectangle123.png';
import ImgFooter_item42 from '../../assets/images/imagePNG/beef 1.png';



function SelectOption() {
    return (
        <div className='select-option'>
            <div className='select-option-item'>
                <img src={Background_item} alt='select-option' className='imgBackground'/>
                <div className='select-option-item-header'>
                    <p>Save</p>
                    <img src={Icon_save} alt='select-option' className='ic_32'/>
                </div>
                <div className='select-option-item-body'>
                    <p>$29</p>
                    <span>Enjoy Discount all types of <br />
                    Grocery & frozen item</span>
                </div>
                <div className='select-option-item-footer'>
                    <img src={ImgFooter_item1} alt='select-option-footer' className='imgFooter1'/>
                    <img src={ImgFooter_item11} alt='select-option-footer' className='imgFooter2'/>
                    <img src={ImgFooter_item13} alt='select-option-footer' className='imgFooter4'/>
                    <img src={ImgFooter_item12} alt='select-option-footer' className='imgFooter3'/>
                </div>
            </div>
            <div className='select-option-item'>
                <img src={Background_item1} alt='select-option' className='imgBackground'/>
                <div className='select-option-item-header'>
                    <p>Discount</p>
                    <img src={Icon_discount} alt='select-option' className='ic_32'/>
                </div>
                <div className='select-option-item-body'>
                    <p>30%</p>
                    <span>Enjoy Discount all types of <br />
                    Grocery & frozen item</span>
                </div>
                <div className='select-option-item-footer'>
                    <img src={ImgFooter_item2} alt='select-option-footer' className='imgFooter1'/>
                    <img src={ImgFooter_item21} alt='select-option-footer' className='imgFooter2'/>
                    <img src={ImgFooter_item23} alt='select-option-footer' className='imgFooter4'/>
                    <img src={ImgFooter_item22} alt='select-option-footer' className='imgFooter3'/>
                </div>
            </div>
            <div className='select-option-item'>
                <img src={Background_item2} alt='select-option' className='imgBackground'/>
                <div className='select-option-item-header'>
                    <p>Up to</p>
                    <img src={Icon_upto} alt='select-option' className='ic_32'/>
                </div>
                <div className='select-option-item-body'>
                    <p>50%</p>
                    <span>Enjoy Discount all types of <br />
                    Grocery & frozen item</span>
                </div>
                <div className='select-option-item-footer'>
                    <img src={ImgFooter_item3} alt='select-option-footer' className='imgFooter1'/>
                    <img src={ImgFooter_item31} alt='select-option-footer' className='imgFooter2'/>
                    <img src={ImgFooter_item33} alt='select-option-footer' className='imgFooter4'/>
                    <img src={ImgFooter_item32} alt='select-option-footer' className='imgFooter3'/>
                </div>
            </div>
            <div className='select-option-item'>
                <img src={Background_item3} alt='select-option' className='imgBackground'/>
                <div className='select-option-item-header'>
                    <p>Free</p>
                    <img src={Icon_freeshipping} alt='select-option' className='ic_32'/>
                </div>
                <div className='select-option-item-body'>
                    <p>SHIP</p>
                    <span>Enjoy Discount all types of <br />
                    Grocery & frozen item</span>
                </div>
                <div className='select-option-item-footer'>
                    <img src={ImgFooter_item4} alt='select-option-footer' className='imgFooter1'/>
                    <img src={ImgFooter_item41} alt='select-option-footer' className='imgFooter2'/>
                    <img src={ImgFooter_item42} alt='select-option-footer' className='imgFooter3'/>
                </div>
            </div>
        </div>
    );
}

export default SelectOption;