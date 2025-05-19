import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import IconEditBtn from "../../assets/images/icons/ic_ edit.svg";
import IconAdd from "../../assets/images/icons/ic_add.svg";
import ImgProducts15 from "../../assets/images/imagePNG/Beverages & Juices.png";
import ImgProducts6 from "../../assets/images/imagePNG/bread_icon 1.png";
import ImgProducts11 from "../../assets/images/imagePNG/Canned & Preserved Foods.png";
import ImgProducts4 from "../../assets/images/imagePNG/Dairy & Eggs.png";
import ImgProducts9 from "../../assets/images/imagePNG/Frozen Foods.png";
import ImgProducts2 from "../../assets/images/imagePNG/fruits_icon 1.png";
import ImgProducts7 from "../../assets/images/imagePNG/Grains & Cereals.png";
import ImgProducts16 from "../../assets/images/imagePNG/Herbs & Mushrooms.png";
import ImgProducts3 from "../../assets/images/imagePNG/meats_icon 1.png";
import ImgProducts5 from "../../assets/images/imagePNG/milks_icon 1.png";
import ImgProducts12 from "../../assets/images/imagePNG/Nuts & Seeds.png";
import ImgProducts13 from "../../assets/images/imagePNG/Oils & Vinegars.png";
import ImgProducts10 from "../../assets/images/imagePNG/Organic & Healthy Foods.png";
import ImgProducts14 from "../../assets/images/imagePNG/Ready-to-Eat Meals.png";
import ImgProducts8 from "../../assets/images/imagePNG/Spices & Condiments.png";
import ImgProductsAll from "../../assets/images/imagePNG/vegetable_bag.png";
import ImgProducts1 from "../../assets/images/imagePNG/vegetables_icon 1.png";
import { getAllCategories, getAllProductsShop } from "../../Service/ProductService";
import HeaderDashboard from "../DashboardPage/Header/HeaderDashboard";
import "./ListProduct.css";

interface Product {
  id: number;
  name: string;
  img?: string;
  price: number;
  sold: number;
  category?: {
    name: string;
    id: number;
  } | null;
  shop?: {
    name: string;
  } | null;
  tag?: string;
  discount?: number;
}

interface Category {
  key: string;
  displayName: string;
  tag: string;
  imageUrl: string | null;
}

const ListProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productsPerPage] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const navigate = useNavigate();

  // Map from backend category keys to local imported images
  const categoryImagesMap: Record<string, string> = {
    Vegetables: ImgProducts1,
    Fruits: ImgProducts2,
    MeatsAndSeafood: ImgProducts3,
    DairyAndEggs: ImgProducts4,
    MilksAndDrinks: ImgProducts5,
    BakeryAndSnacks: ImgProducts6,
    GrainsAndCereals: ImgProducts7,
    SpicesAndCondiments: ImgProducts8,
    FrozenFoods: ImgProducts9,
    OrganicAndHealthyFoods: ImgProducts10,
    CannedAndPreservedFoods: ImgProducts11,
    NutsAndSeeds: ImgProducts12,
    OilsAndVinegars: ImgProducts13,
    ReadyToEatMeals: ImgProducts14,
    BeveragesAndJuices: ImgProducts15,
    HerbsAndMushrooms: ImgProducts16,
  };

  // Function to get the correct image for a category
  const getImagePath = (
    imageUrl: string | null | undefined,
    categoryKey: string
  ): string => {
    // First check if we have a local image for this category key
    if (categoryImagesMap[categoryKey]) {
      return categoryImagesMap[categoryKey];
    }
    for (const [key, imgPath] of Object.entries(categoryImagesMap)) {
      if (
        categoryKey.replace(/\s/g, "").includes(key.replace(/\s/g, "")) ||
        key.replace(/\s/g, "").includes(categoryKey.replace(/\s/g, ""))
      ) {
        return imgPath;
      }
    }
    if (imageUrl && imageUrl.startsWith("http")) {
      return imageUrl;
    }
    return ImgProducts1;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesResponse = await getAllCategories();
        console.log("Categories API response:", categoriesResponse);

        // Handle different response structures
        let categoriesData;
        if (categoriesResponse && categoriesResponse.data) {
          categoriesData = categoriesResponse.data;
        } else {
          categoriesData = categoriesResponse;
        }

        if (!Array.isArray(categoriesData)) {
          console.error("Categories data is not an array:", categoriesData);
          categoriesData = [];
        }

        // Log each category to help debug image issues
        categoriesData.forEach((cat: Category) => {
          console.log(
            `Category: ${cat.displayName}, Key: ${cat.key}, Image: ${cat.imageUrl}`
          );
        });

        setCategories(categoriesData);

        // Fetch products
        const productsResponse = await getAllProductsShop();
        console.log("Products API response:", productsResponse);

        // Handle different response structures
        let productsData;
        if (productsResponse && productsResponse.data) {
          productsData = productsResponse.data;
        } else {
          productsData = productsResponse;
        }

        if (!Array.isArray(productsData)) {
          console.error("Products data is not an array:", productsData);
          productsData = [];
        }

        setProducts(productsData);
        setFilteredProducts(productsData); // Show all products initially
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on selected category
  useEffect(() => {
    if (selectedCategory === "ALL") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter((product) => {
        if (!product.category) return false;

        const productCategory = categories.find(
          (cat) => cat.key === product.category?.name
        );

        return productCategory?.displayName === selectedCategory;
      });

      setFilteredProducts(filtered);
    }

    // Reset to first page when changing category
    setCurrentPage(1);
  }, [selectedCategory, products, categories]);

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  // Handle edit product click
  const handleEditProduct = (event: React.MouseEvent, productId: number) => {
    event.stopPropagation();
    console.log(`Editing product with ID: ${productId}`);
    navigate(`/add_product/${productId}`);
  };

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  // Pagination functions
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Product item component
  const ProductItem: React.FC<{ product: Product }> = ({ product }) => {
    const finalPrice = product.discount
      ? product.price * (1 - product.discount / 100)
      : product.price;

    const categoryDisplayName = product.category?.name
      ? categories.find((cat) => cat.key === product.category?.name)
          ?.displayName || product.category.name
      : "No category";

    // Get image for product based on its category
    const productImage =
      product.img ||
      (product.category?.name
        ? getImagePath(null, product.category.name)
        : ImgProducts1);

    return (
      <div
        className="product-card-list-info"
        onClick={() => {
          navigate("/product/" + product.id);
        }}
      >
        <div className="product-image">
          <img
            src={productImage}
            alt={product.name}
            onError={(e) => {
              console.log(`Product image failed to load: ${productImage}`);
              (e.target as HTMLImageElement).src = ImgProducts1;
            }}
          />
        </div>
        <div className="product-details">
          <h3>{product.name}</h3>
          <p>({product.shop?.name || categoryDisplayName})</p>
          <div className="product-price-list">{finalPrice.toFixed(2)} $</div>
          <div className="product-stats">
            Revenue: <span className="orange">{product.sold}</span>
          </div>
          <div
            className="edit-button-list"
            onClick={(e) => handleEditProduct(e, product.id)}
          >
            <img src={IconEditBtn} alt="Edit" className="ic_32" />
          </div>
        </div>
      </div>
    );
  };

  // Pagination component
  const Pagination: React.FC = () => {
    return (
      <div className="pagination">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className={`pagination-button ${currentPage === 1 ? "disabled" : ""}`}
        >
          &laquo;
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`pagination-button ${
              currentPage === number ? "active" : ""
            }`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className={`pagination-button ${
            currentPage === totalPages ? "disabled" : ""
          }`}
        >
          &raquo;
        </button>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="category-container">
        <HeaderDashboard />
        <div className="container-list-product">
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="category-container">
        <HeaderDashboard />
        <div className="container-list-product">
          <p style={{ color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-container">
      <HeaderDashboard />
      <div className="container-list-product">
        <h2 className="category-name">Categories</h2>
        <div className="categories">
          {/* ALL category card */}
          <div
            className={`category-card ${
              selectedCategory === "ALL" ? "active" : ""
            }`}
            onClick={() => handleCategoryClick("ALL")}
          >
            <div className="category-content">
              <h3>ALL</h3>
              <p>All Products</p>
            </div>
            <img src={ImgProductsAll} alt="All Categories" />
          </div>

          {categories.length > 0 ? (
            categories.map((category) => (
              <div
                key={category.key}
                className={`category-card ${
                  selectedCategory === category.displayName ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category.displayName)}
              >
                <div className="category-content">
                  <h3>{category.displayName}</h3>
                  <p>{category.tag ? category.tag.replace("🏷️ ", "") : ""}</p>
                </div>
                <img
                  src={getImagePath(category.imageUrl, category.key)}
                  alt={category.displayName}
                  onError={(e) => {
                    console.log(
                      `Image failed to load for ${category.displayName}: ${category.imageUrl}`
                    );
                    (e.target as HTMLImageElement).src = ImgProducts1;
                  }}
                />
              </div>
            ))
          ) : (
            <p>No categories found.</p>
          )}
        </div>

        <div className="product-header-row">
          <h2 className="name-product">
            Products {selectedCategory !== "ALL" ? `- ${selectedCategory}` : ""}{" "}
            ({filteredProducts.length})
          </h2>
          <button
            className="add-products-btn"
            onClick={() => navigate("/add_product")}
          >
            <img src={IconAdd} alt="Icon Add" className="ic_20" />
            Add
          </button>
        </div>

        {currentProducts.length === 0 && !loading ? (
          <div>
            <p>
              No products found
              {selectedCategory !== "ALL"
                ? ` in category ${selectedCategory}`
                : ""}
              .
            </p>
            <p>Total products: {products.length}</p>
            <p>Filtered products: {filteredProducts.length}</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              <div className="product-card-list">
                {currentProducts.map((product, index) => (
                  <ProductItem
                    key={`product-${product.id || index}`}
                    product={product}
                  />
                ))}
              </div>
            </div>

            {totalPages > 1 && <Pagination />}
          </>
        )}
      </div>
    </div>
  );
};

export default ListProduct;
