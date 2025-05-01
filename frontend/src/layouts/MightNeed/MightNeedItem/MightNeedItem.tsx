// d:\ProjectDATN\Gromuse\frontend\src\layouts\MightNeed\MightNeedItem\MightNeedItem.tsx
import { useState, useEffect, useRef } from "react";
import ImgItem1 from "../../../assets/images/imagePNG/green-broccoli1.png";
import IconPlus from "../../../assets/images/icons/ic_add.svg";
import "./MightNeedItem.css";
import Counter from "../../../components/CountBtn/CountBtn";
import { useNavigate } from "react-router-dom";
import IconStarF from "../../../assets/images/icons/ic_star_fill.svg";
import { addToCart } from "../../../Service/ProductService";
import { jwtDecode } from "jwt-decode"; // <-- Import jwt-decode
import { toast, ToastContainer } from "react-toastify"; // <-- Import react-toastify
import "react-toastify/dist/ReactToastify.css"; // <-- Import CSS if not already global

// Define the expected structure of the decoded token
interface DecodedToken {
  idAccount: number;
  idUser: number; // <-- We need this
  email: string;
  phoneNumber: string;
  role: number;
  iat: number;
  exp: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  weight: number;
  tag: string;
  img?: string;
  sold?: number;
  averageRating: number;
  category?: {
    name?: string;
  };
}

const MightNeedItem = ({ product }: { product: Product }) => {
  const [isCounterActive, setIsCounterActive] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentToastId = useRef<string | number | null>(null);
  const navigate = useNavigate();

  const getUserIdFromToken = (): number | null => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("MightNeedItem: No token found in localStorage.");
      return null;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        console.error("MightNeedItem: Token expired.");
        // Optional: Clear expired token and related data
        localStorage.removeItem("token");
        localStorage.removeItem("currentCartId");
        // ... other cleanup
        return null;
      }
      if (typeof decoded.idUser !== "number") {
        console.error("MightNeedItem: Token payload missing valid idUser.");
        localStorage.removeItem("token"); // Remove invalid token
        return null;
      }
      return decoded.idUser;
    } catch (error) {
      console.error("MightNeedItem: Error decoding token:", error);
      localStorage.removeItem("token"); // Remove invalid token
      return null;
    }
  };
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering product navigation
    const userId = getUserIdFromToken();
    if (userId === null) {
      toast.info("Please log in to add items to your cart.");
      navigate("/login"); // Redirect to login if not logged in
      return;
    }
    setIsCounterActive(true);
    setCurrentQuantity(1);
    startDebouncedCartUpdate(1, userId); // Pass userId
  };

  const startDebouncedCartUpdate = (
    newQuantity: number,
    userId: number | null
  ) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (currentToastId.current) {
      toast.dismiss(currentToastId.current);
      currentToastId.current = null;
    }
    if (userId === null) {
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      const toastMessage =
        newQuantity > 0 ? "Updating cart..." : "Removing item...";
      const newToastId = toast.loading(toastMessage);
      currentToastId.current = newToastId;
      updateCart(newQuantity, userId);
      debounceTimerRef.current = null;
    }, 1500); // 1.5 seconds delay
  };

  const handleCountChange = (newCount: number) => {
    const userId = getUserIdFromToken();
    if (userId === null && newCount > 0) {
      toast.info("Please log in to change item quantity.");
      navigate("/login");
      return;
    }

    setCurrentQuantity(newCount);

    if (newCount <= 0) {
      setIsCounterActive(false);
      if (currentToastId.current) {
        toast.dismiss(currentToastId.current);
        currentToastId.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (userId !== null) {
        startDebouncedCartUpdate(0, userId);
      }
    } else if (userId !== null) {
      startDebouncedCartUpdate(newCount, userId);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Dismiss any active toast on unmount
      if (currentToastId.current) {
        toast.dismiss(currentToastId.current);
      }
    };
  }, []);

  const updateCart = async (quantity: number, userId: number | null) => {
    const operationToastId = currentToastId.current;

    if (userId === null) {
      if (operationToastId) toast.dismiss(operationToastId);
      if (currentToastId.current === operationToastId)
        currentToastId.current = null;
      toast.error("User session expired. Please log in again.");
      navigate("/login");
      return; // Exit function
    }

    console.log(
      `MightNeedItem: Sending request - Product ID: ${product.id}, Quantity: ${quantity}, User ID: ${userId}`
    );

    try {
      const response = await addToCart(product.id, quantity, userId);
      console.log("MightNeedItem: Add to cart response:", response);

      let returnedCartId: number | undefined = undefined;
      if (response?.cart?.id) {
        returnedCartId = response.cart.id;
      } else if (response?.cartId) {
        returnedCartId = response.cartId;
      }
      if (returnedCartId) {
        localStorage.setItem("currentCartId", returnedCartId.toString());
        console.log(
          `MightNeedItem: Cart ID ${returnedCartId} saved to localStorage`
        );
      }
      if (operationToastId) {
        toast.update(operationToastId, {
          render:
            quantity > 0 ? "Item updated in cart!" : "Item removed from cart!",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
      } else {
        toast.success(
          quantity > 0 ? "Item updated in cart!" : "Item removed from cart!",
          { autoClose: 2000 }
        );
      }
    } catch (error: any) {
      console.error("MightNeedItem: Error updating cart:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update cart";

      if (operationToastId) {
        toast.update(operationToastId, {
          render: `Error: ${errorMessage}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.error(`Error: ${errorMessage}`, { autoClose: 3000 });
      }
    } finally {
      if (currentToastId.current === operationToastId) {
        currentToastId.current = null;
      }
    }
  };

  const handleProductClick = () => {
    navigate(`/product/${product.id}`, {
      state: {
        quantity: isCounterActive && currentQuantity > 0 ? currentQuantity : 1,
      },
    });
  };

  const renderStarRating = (rating: number) => {
    const roundedRating = Math.round(rating * 2) / 2;
    return (
      <div className="star-rating">
        {roundedRating}
        <img src={IconStarF} alt="img-star" className="ic_16" />
      </div>
    );
  };

  return (
    <div className="might-need-item-component" onClick={handleProductClick}>
      <div className="might-need-item">
        <div className="might-need-item-header">
          <img src={product.img || ImgItem1} alt={product.name} />
          {product.averageRating > 0 && (
            <div className="rating-badge">
              {renderStarRating(product.averageRating)}
            </div>
          )}
        </div>
        <div className="might-need-item-body">
          <p className="might-need-item-name">{product.name}</p>
          <p className="might-need-item-source">
            ({product.category?.name || product.tag})
          </p>
          <span className="might-need-item-weight">{product.weight}g</span>
          <span className="might-need-item-price">
            {product.price.toFixed(2)} $
          </span>
        </div>
        <div
          className="might-need-item-footer"
          onClick={(e) => e.stopPropagation()}
        >
          {!isCounterActive ? (
            <button className="might-need-item-button" onClick={handleAddClick}>
              <img src={IconPlus} alt="img-plus" />
            </button>
          ) : (
            <div className="might-need-item-counter">
              <Counter
                initialCount={currentQuantity}
                onChange={handleCountChange}
                allowZero={true}
              />
            </div>
          )}
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default MightNeedItem;
