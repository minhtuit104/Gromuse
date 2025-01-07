import './header.css';
import IconList from '../../assets/images/icons/ic_ list.svg';
import IconSearch from '../../assets/images/icons/ic_ search.svg';
import IconCart from '../../assets/images/icons/ic_ cart.svg';
import ImgAvatar from '../../assets/images/hihih.jpg';

function Header() {
    return (
        <div className="header">
            <div className="header-left">
                <img src={IconList} alt="icon-list" className="ic_40" />
                <span>Gromuse</span>
            </div>
            <div className="header-middle">
                <input type="text" placeholder="Search for Grocery, Stores, Vegetables or Meat" />
                <img src={IconSearch} alt="icon-search" className="ic_32" />
            </div>
            <div className="header-right">
                <div className="header-right-cart">
                    <img src={IconCart} alt="icon-cart" className="ic_24" />
                    <span className="quantity">9+</span>
                </div>
                <div className="header-right-avatar">
                    <img src={ImgAvatar} alt="img-avatar" />
                </div>
            </div>
        </div>
    );
}

export default Header;