import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Header from "../../layouts/Header/Header";
import "./ListProductUser.css";
import filterIcon from "../../assets/images/icons/ic_filter.svg";
import IconArrow from "../../assets/images/icons/ic_ up.svg";
import { getAllProducts, getAllCategories } from "../../Service/ProductService";
import MightNeedItem from "../../layouts/MightNeed/MightNeedItem/MightNeedItem";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import IconReset from "../../assets/images/icons/ic_refresh.svg";

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
    id?: number;
    name?: string;
  };
  displayCategoryName?: string;
  discount?: number;
  active?: boolean;
  shop?: { name?: string };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface Category {
  key: string;
  displayName: string;
  tag: string;
  imageUrl: string | null;
}

type SortOption = "newest" | "oldest" | "highToLow" | "lowToHigh" | "";

function ListProductUser() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFromUrl = queryParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productsPerPage] = useState<number>(10);
  const [showFilterPopup, setShowFilterPopup] = useState<boolean>(false);
  const [sortByTime, setSortByTime] = useState<SortOption>("");
  const [sortByPrice, setSortByPrice] = useState<SortOption>("");
  const [tempSortByTime, setTempSortByTime] = useState<SortOption>("");
  const [tempSortByPrice, setTempSortByPrice] = useState<SortOption>("");

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories
      const categoriesResponse = await getAllCategories();
      let categoriesData: Category[] = [];
      if (
        categoriesResponse?.data &&
        Array.isArray(categoriesResponse.data)
      ) {
        categoriesData = categoriesResponse.data;
      } else if (Array.isArray(categoriesResponse)) {
        categoriesData = categoriesResponse;
      } else {
        console.error(
          "Unexpected categories data format:",
          categoriesResponse
        );
        toast.warn("Could not load categories properly.");
      }
      setCategories(categoriesData);
      console.log("Fetched Categories:", categoriesData);

      // Fetch products
      const productsResponse = await getAllProducts();
      let productsData: Product[] = [];
      if (productsResponse?.data && Array.isArray(productsResponse.data)) {
        productsData = productsResponse.data.map((p) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        }));
        // Debug output to verify date conversion
        console.log(
          "Sample product date:",
          productsData.length > 0
            ? productsData[0].createdAt instanceof Date
              ? productsData[0].createdAt.toISOString()
              : "Not a date object"
            : "No products"
        );
      } else if (Array.isArray(productsResponse)) {
        productsData = productsResponse.map((p) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        }));
      } else {
        console.error("Unexpected products data format:", productsResponse);
        toast.error("Could not load products properly.");
      }
      setProducts(productsData);
      console.log("Fetched Products:", productsData);

      setLoading(false);
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load data. Please try again later.";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  // Set selected category from URL parameter when data is loaded and categories are available
  useEffect(() => {
    if (categoryFromUrl && categories.length > 0) {
      const foundCategory = categories.find(
        (cat) => cat.key === categoryFromUrl
      );
      if (foundCategory) {
        setSelectedCategoryKey(categoryFromUrl);
        console.log(`Setting category from URL: ${categoryFromUrl}`);
      } else {
        console.warn(
          `Category from URL not found in loaded categories: ${categoryFromUrl}`
        );
      }
    }
  }, [categoryFromUrl, categories]);

  const filteredAndSortedProducts = useMemo(() => {
    let processedProducts = [...products];

    // Debug sorting before operations
    console.log(
      "Products before sorting:",
      processedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt:
          p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      }))
    );

    // 1. Filter by Category
    if (selectedCategoryKey !== "ALL") {
      processedProducts = processedProducts.filter(
        (product) => product.category?.name === selectedCategoryKey
      );
    }

    // 2. Sort by Time
    if (sortByTime === "newest") {
      console.log("Sorting by newest first");
      processedProducts.sort((a, b) => {
        // More robust date handling
        const dateA =
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : typeof a.createdAt === "string"
            ? new Date(a.createdAt).getTime()
            : 0;
        const dateB =
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : typeof b.createdAt === "string"
            ? new Date(b.createdAt).getTime()
            : 0;

        // Debug output for date comparison
        if (dateA === 0 || dateB === 0) {
          console.log(`Missing date for product: ${a.id} or ${b.id}`);
        }

        return dateB - dateA; // Newest first
      });
    } else if (sortByTime === "oldest") {
      console.log("Sorting by oldest first");
      processedProducts.sort((a, b) => {
        // More robust date handling
        const dateA =
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : typeof a.createdAt === "string"
            ? new Date(a.createdAt).getTime()
            : 0;
        const dateB =
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : typeof b.createdAt === "string"
            ? new Date(b.createdAt).getTime()
            : 0;

        return dateA - dateB; // Oldest first
      });
    }

    // 3. Sort by Price (applied after time sort if both are selected)
    if (sortByPrice === "highToLow") {
      processedProducts.sort((a, b) => b.price - a.price);
    } else if (sortByPrice === "lowToHigh") {
      processedProducts.sort((a, b) => a.price - b.price);
    }

    // Debug sorting after operations
    console.log(
      "Products after sorting:",
      processedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt:
          p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      }))
    );

    return processedProducts;
  }, [products, selectedCategoryKey, sortByTime, sortByPrice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryKey, sortByTime, sortByPrice]);

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    // Update URL without reloading the page
    const newUrl =
      categoryKey === "ALL"
        ? window.location.pathname
        : `${window.location.pathname}?category=${categoryKey}`;

    window.history.pushState({}, "", newUrl);
    // Optionally reset sort when category changes? Or keep it? User preference.
    // setSortByTime("");
    // setSortByPrice("");
  };

  // Handle filter button click
  const handleFilterClick = () => {
    setTempSortByTime(sortByTime);
    setTempSortByPrice(sortByPrice);
    setShowFilterPopup(true);
  };

  // Handle confirming filter settings
  const handleConfirmFilter = () => {
    // Apply the temporary selections as the actual filters
    setSortByTime(tempSortByTime);
    setSortByPrice(tempSortByPrice);
    setShowFilterPopup(false);
  };

  // Handle closing filter popup without applying changes
  const handleCloseFilter = () => {
    // Discard temporary changes
    setShowFilterPopup(false);
  };

  // Handle resetting all filters *within the popup*
  const handleResetFilters = () => {
    // Reset only the temporary selections in the popup
    setTempSortByTime("");
    setTempSortByPrice("");
  };

  // --- Pagination Logic ---
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  // Use the memoized filteredAndSortedProducts for display
  const currentProducts = filteredAndSortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / productsPerPage
  );

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

  const Pagination: React.FC = () => {
    if (totalPages <= 1) return null;

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

  const FilterPopup: React.FC = () => {
    if (!showFilterPopup) return null;

    return (
      <div className="filter-popup-overlay" onClick={handleCloseFilter}>
        {" "}
        {/* Close on overlay click */}
        <div className="filter-popup" onClick={(e) => e.stopPropagation()}>
          {" "}
          {/* Prevent closing when clicking inside popup */}
          <div className="filter-header">
            <h2>Filter</h2>
            <button className="reset-button" onClick={handleResetFilters}>
              Reset all <img src={IconReset} alt="reset" className="ic_36" />
            </button>
          </div>
          {/* Sort by Time Section */}
          <div className="filter-section">
            <h3>Sort by Time</h3>
            <div className="select-wrapper">
              <select
                value={tempSortByTime}
                onChange={(e) =>
                  setTempSortByTime(e.target.value as SortOption)
                }
                className="filter-select"
              >
                <option value="">Select</option>
                <option value="newest">Latest</option>{" "}
                <option value="oldest">Oldest</option>
              </select>
              <img src={IconArrow} alt="arrow" className="ic_24 select-arrow" />
            </div>
          </div>
          {/* Sort by Price Section */}
          <div className="filter-section">
            <h3>Sort by Price</h3>
            <div className="select-wrapper">
              <select
                value={tempSortByPrice}
                onChange={(e) =>
                  setTempSortByPrice(e.target.value as SortOption)
                }
                className="filter-select"
              >
                <option value="">Select</option>
                <option value="highToLow">High to low</option>
                <option value="lowToHigh">Low to high</option>
              </select>
              <img src={IconArrow} alt="arrow" className="ic_24 select-arrow" />
            </div>
          </div>
          {/* Action Buttons */}
          <div className="filter-actions">
            <button className="back-button" onClick={handleCloseFilter}>
              Back
            </button>
            <button className="confirm-button" onClick={handleConfirmFilter}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="list-product-user-container">
      <Header />
      <div className="list-product-user-info">
        {/* Category Section */}
        <div className="category-section">
          <h2 className="category-title">Category</h2>
          <div className="category-buttons-container">
            <div className="category-buttons">
              {/* "All" Button */}
              <button
                className={`category-btn ${
                  selectedCategoryKey === "ALL" ? "active" : ""
                }`}
                onClick={() => handleCategoryClick("ALL")}
              >
                All
              </button>

              {/* Dynamic Category Buttons */}
              {categories.length > 0
                ? categories.map((category) => (
                    <button
                      key={category.key}
                      className={`category-btn ${
                        selectedCategoryKey === category.key ? "active" : ""
                      }`}
                      onClick={() => handleCategoryClick(category.key)}
                    >
                      {category.displayName}
                    </button>
                  ))
                : !loading && <p>No categories found.</p>}
            </div>

            {/* Filter Button */}
            <button className="category-filter-btn" onClick={handleFilterClick}>
              <img src={filterIcon} alt="filter" className="ic_24" />
            </button>
          </div>
        </div>

        {/* Product List Section */}
        <div className="list-product-user">
          {loading ? (
            <p>Loading products...</p>
          ) : error ? (
            <p style={{ color: "red" }}>Error: {error}</p>
          ) : filteredAndSortedProducts.length > 0 ? ( // Use the derived state
            <>
              <div className="might-need-list">
                {/* Map over currentProducts for pagination */}
                {currentProducts.map((product) => (
                  <MightNeedItem key={product.id} product={product} />
                ))}
              </div>
              <Pagination /> {/* Render pagination */}
            </>
          ) : (
            <p>
              No products found
              {selectedCategoryKey !== "ALL"
                ? ` in category "${
                    categories.find((c) => c.key === selectedCategoryKey)
                      ?.displayName || selectedCategoryKey
                  }"`
                : ""}
              .
            </p>
          )}
        </div>
      </div>

      {/* Render Filter Popup */}
      <FilterPopup />
    </div>
  );
}

export default ListProductUser;
