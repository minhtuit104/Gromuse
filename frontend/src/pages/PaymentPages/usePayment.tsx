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

interface Voucher {
  id: string;
  type: string;
  code: string;
  description: string;
  remaining: number;
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
          title: "Snack Lays khoai tây tươi giòn rụm số 1 thế giới",
          weight: 500,
          price: 15.25,
          amount: 2,
          created_at: "28282",
        },
        {
          img: "string",
          title: "Snack vị BBQ đậm đà",
          weight: 400,
          price: 10.5,
          amount: 5,
          created_at: "28282",
        },
      ],
    },
    {
      avatar:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7zEEISvcs1XuhHOPNI0aUElsa46Fmv5NLDg&s",
      name: "Lay's Việt Nam",
      products: [
        {
          img: "string",
          title: "Snack Lays khoai tây tươi giòn rụm số 1 thế giới",
          weight: 500,
          price: 15.25,
          amount: 2,
          created_at: "28282",
        },
        {
          img: "string",
          title: "Snack vị BBQ đậm đà",
          weight: 400,
          price: 10.5,
          amount: 5,
          created_at: "28282",
        },
        {
          img: "string",
          title: "Snack vị BBQ đậm đà giòn rụm số 1 thế giới",
          weight: 300,
          price: 10.5,
          amount: 5,
          created_at: "28282",
        },
      ],
    },
  ];

  const vouchers: Voucher[] = [
    {
      id: "1",
      type: "Free Ship",
      code: "#FREE20",
      description: "Free ship up to 20$",
      remaining: 10,
    },
    {
      id: "2",
      type: "Discount",
      code: "#DISCOUNT10",
      description: "Discount 10% for orders above 100$",
      remaining: 5,
    },
    {
      id: "3",
      type: "Free Ship",
      code: "#FREESHIP5",
      description: "Free ship up to 5$",
      remaining: 20,
    },
    {
      id: "4",
      type: "Discount",
      code: "#DISCOUNT20",
      description: "Discount 20% for first-time buyers",
      remaining: 2,
    },
    {
      id: "5",
      type: "Discount",
      code: "#DISCOUNT20",
      description: "Discount 20% for first-time buyers",
      remaining: 9,
    },
    {
      id: "6",
      type: "Discount",
      code: "#DISCOUNT20",
      description: "Discount 20% for first-time buyers",
      remaining: 2,
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
    vouchers,
    handleUpdatePrice,
  };
};
export default usePayment;
