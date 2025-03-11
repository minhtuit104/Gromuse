import "./paymentPage.css";

interface OrderDetailsProps {
  subtotal: number;
  deliveryFee: { original: number; discounted: number };
  couponDiscount: number;
  total: number;
}

const OrderDetails = ({
  subtotal,
  deliveryFee,
  couponDiscount,
  total,
}: OrderDetailsProps) => {
  return (
    <div className="order-details">
      <div className="detail">
        <span className="span1">Subtotal</span>
        <span className="span2">${subtotal.toFixed(2)}</span>
      </div>
      <div className="detail">
        <span className="span1">Delivery fee</span>
        <span className="span2">
          <p>${deliveryFee.original.toFixed(2)}</p>$
          {deliveryFee.discounted.toFixed(2)}
        </span>
      </div>
      <div className="detail">
        <span className="span1">Coupon Discount</span>
        <span className="span2">-${couponDiscount.toFixed(2)}</span>
      </div>
      <div className="payment_right_line_4"></div>
      <div className="total">
        <span className="span3">Total</span>
        <span className="span3">${total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default OrderDetails;
