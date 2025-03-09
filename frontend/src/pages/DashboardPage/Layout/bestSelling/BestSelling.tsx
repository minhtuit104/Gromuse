import React from 'react';
import ImgBestSelling from '../../../../assets/images/imagePNG/MaskGroup.png';
import IconUpto from '../../../../assets/images/icons/ic_ up_to.svg';
import './bestSelling.css';

const BestSelling: React.FC = () => {

   

  return (
    <div className='bestSelling_container'>
        <div className='bestSelling_header'>
            <h3>Best Selling</h3>
        </div>
        <div className='bestSelling_body'>
            <img src={ImgBestSelling} alt="bestSellingImg" />
            <span>Super Fresh Carrot</span>
        </div>
        <div className="bestSelling_bottom">
            <div className='sell_count'>
                <p>81 Selled</p>
            </div>

            <div className='sell_percent'>
                <img src={IconUpto} alt="iconPercent" className='ic_20' />
                <p>29%</p>
            </div>
        </div>
    </div>
  );
};

export default BestSelling;