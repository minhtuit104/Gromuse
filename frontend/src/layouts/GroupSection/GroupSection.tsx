import { useState, useEffect } from "react";
import "./groupSection.css";
import IconArrowRight from "../../assets/images/icons/ic_ arrow-right.svg";
import { getAllCategories } from "../../Service/ProductService";
import Img1 from "../../assets/images/imagePNG/vegetables_icon 1.png";
import Img2 from "../../assets/images/imagePNG/meats_icon 1.png";
import Img3 from "../../assets/images/imagePNG/fruits_icon 1.png";
import Img4 from "../../assets/images/imagePNG/Dairy & Eggs.png";
import Img5 from "../../assets/images/imagePNG/milks_icon 1.png";
import { useNavigate } from "react-router-dom";

interface Category {
  key: string;
  displayName: string;
  tag: string;
  imageUrl: string | null;
}

function GroupSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSeeMoreClick = () => {
    navigate("/list_product_User");
  };

  // Map category keys to fallback images
  const fallbackImages: Record<string, string> = {
    Vegetables: Img1,
    Fruits: Img3,
    MeatsAndSeafood: Img2,
    DairyAndEggs: Img4,
    MilksAndDrinks: Img5,
    default: Img1,
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getAllCategories();
      console.log("Categories API response:", response);

      // Handle different response structures
      let categoriesData;
      if (response && response.data) {
        categoriesData = response.data;
      } else {
        categoriesData = response;
      }

      if (!Array.isArray(categoriesData)) {
        console.error("Categories data is not an array:", categoriesData);
        categoriesData = [];
      }

      // Only take the first 5 categories
      const firstFiveCategories = categoriesData.slice(0, 5);
      console.log("First five categories:", firstFiveCategories);
      setCategories(firstFiveCategories);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Failed to load categories. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Get image for a category
  const getCategoryImage = (category: Category): string => {
    if (category.imageUrl && category.imageUrl.startsWith("/")) {
      return category.imageUrl.replace(/ /g, "%20");
    }

    console.warn(
      `Using fallback image for category: ${category.displayName} (imageUrl from API: ${category.imageUrl})`
    );
    return fallbackImages[category.key] || fallbackImages.default;
  };

  // Get category subtitle (tag text without the emoji)
  const getCategorySubtitle = (tag: string): string => {
    return tag ? tag.replace("🏷️ ", "") : "Local market";
  };

  // Handle category click - Navigate to list product page with category filter
  const handleCategoryClick = (categoryKey: string) => {
    setActiveCategory(categoryKey);
    console.log(`Category selected: ${categoryKey}`);
    // Navigate to the list product page with selected category as query parameter
    navigate(`/list_product_User?category=${categoryKey}`);
  };

  if (loading) {
    return (
      <div className="group-section-container">
        <p>Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-section-container">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="group-section-container">
      <div className="see-more-category">
        <span onClick={handleSeeMoreClick} style={{ cursor: "pointer" }}>
          See more <img src={IconArrowRight} alt="img-arrow-right" />
        </span>
      </div>
      <div className="group-section">
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <div
              key={category.key || index}
              className={`group-section-item ${
                activeCategory === category.key ? "active" : ""
              }`}
              onClick={() => handleCategoryClick(category.key)}
            >
              <div className="group-section-item-text">
                <h3>{category.displayName}</h3>
                <span>{getCategorySubtitle(category.tag)}</span>
              </div>
              <div className="group-section-item-img">
                <img
                  src={getCategoryImage(category)}
                  alt={`${category.displayName}`}
                  onError={(e) => {
                    console.log(
                      `Image failed to load for ${
                        category.displayName
                      }, URL was: ${(e.target as HTMLImageElement).src}`
                    );
                    (e.target as HTMLImageElement).src = fallbackImages.default;
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p>No categories found.</p>
        )}
      </div>
    </div>
  );
}

export default GroupSection;
