import Banner from "../../layouts/Banner/Banner";
import DetailProduct from "../../layouts/DetailProduct/DetailProduct";
import Footer from "../../layouts/Footer/Footer";
import GroupSection from "../../layouts/GroupSection/GroupSection";
import Header from "../../layouts/Header/Header";
import MightNeed from "../../layouts/MightNeed/MightNeed";
import SelectOption from "../../layouts/SelectOption/SelectOption";
import "./homePage.css";
import { toast } from "react-toastify";
import { useEffect } from "react";

function HomePage() {
  useEffect(() => {
    const paymentComplete = localStorage.getItem("paymentComplete");
    if (paymentComplete === "true") {
      localStorage.removeItem("paymentComplete");
      toast.success("Cảm ơn bạn đã mua hàng!");
    }
  }, []);
  return (
    <div className="home-page">
      <Header />
      <Banner />
      <GroupSection />
      <MightNeed />
      <DetailProduct />
      <SelectOption />
      <Footer />
    </div>
  );
}

export default HomePage;
