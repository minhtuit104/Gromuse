import { useState } from "react";
interface Product {
  img: string;
  title: string;
  weight: number;
  price: number;
  amount: number;
  created_at: string;
}

interface Shop {
  avatar: string;
  name: string;
  products: Product[];
}
const usePayment = () => {
  const initialValues = {
    totalPrice: 0,
  };
  const datas: Shop[] = [
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7zEEISvcs1XuhHOPNI0aUElsa46Fmv5NLDg&s",
      name: "Lay's Việt Nam",
      products: [
        {
          img: "string",
          title: "string",
          weight: 500,
          price: 15.25,
          amount: 2,
          created_at: "28282",
        },
      ],
    },
  ];
  const [data, setData] = useState(datas);
  const handleGetAdressData = () => {};
  const handleGetItemData = () => {};
  const handleUpdatePrice = (price: number, type: string) => {
    if (type === "plus") {
      initialValues.totalPrice += price;
    } else {
      initialValues.totalPrice -= price;
    }
  };
  return {
    handleGetAdressData,
    handleGetItemData,
    data,
    setData,
    handleUpdatePrice,
  };
};
export default usePayment;
