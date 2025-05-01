import "./mightNeed.css";
import IconArrowRight from "../../assets/images/icons/ic_ arrow-right.svg";
import MightNeedItem from "./MightNeedItem/MightNeedItem";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTopSellingProducts } from "../../Service/ProductService";

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

function MightNeed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSeeMoreClick = () => {
    navigate("/list_product_User");
  };

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error
        console.log("Fetching top selling products (MightNeed)...");

        // Call service function to get top 10 products
        const response = await getTopSellingProducts(10);
        console.log("API response received (MightNeed):", response);

        // Check if we have valid data
        if (response && Array.isArray(response.data)) {
          setProducts(response.data);
          console.log(
            "State updated with product data (MightNeed):",
            response.data
          );
        } else if (response && Array.isArray(response)) {
          // Handle case where response itself might be the array
          setProducts(response);
          console.log(
            "State updated with direct product array (MightNeed):",
            response
          );
        } else {
          console.log("Data returned from service is not an array (MightNeed)");
          setError("No products found");
          setProducts([]); // Ensure state is empty array
        }
      } catch (err) {
        console.error("Error fetching top selling products (MightNeed):", err);
        setError("Unable to load product data");
        setProducts([]); // Ensure state is empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellingProducts();
  }, []);

  console.log("Current products state:", products);
  console.log("Loading state:", loading);
  console.log("Error state:", error);

  return (
    <div className="might-need">
      <div className="might-need-header">
        <h2>You might need</h2>
        <span onClick={handleSeeMoreClick} style={{ cursor: "pointer" }}>
          See more <img src={IconArrowRight} alt="img-arrow-right" />
        </span>
      </div>
      <div className="might-need-list">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <MightNeedItem key={product.id} product={product} />
          ))
        ) : (
          <div>No products available</div>
        )}
      </div>
    </div>
  );
}

export default MightNeed;
