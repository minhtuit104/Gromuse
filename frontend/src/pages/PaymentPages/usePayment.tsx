import { useState, useEffect } from "react";
import { Shop } from "./paymentItem";

export interface Voucher {
  id: string | number;
  type: string;
  code: string;
  description: string;
  remaining: number;
}

const usePayment = () => {
  const [data, setData] = useState<Shop[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const cartId = localStorage.getItem("cartId");
      if (!cartId) {
        setError("Cart ID không tồn tại. Vui lòng thêm sản phẩm vào giỏ hàng.");
        setData([]);
        return;
      }

      const response = await fetch(`http://localhost:3000/cart/${cartId}`);
      if (!response.ok) {
        throw new Error(`API thất bại: ${response.status}`);
      }

      const cartItems = await response.json();
      if (!cartItems || cartItems.length === 0) {
        setData([]);
        setError("Giỏ hàng trống.");
        return;
      }

      const shopsMap: Record<string, Shop> = {};
      cartItems.forEach((item: any, index: number) => {
        if (!item.product) {
          console.warn(`Item ${index} thiếu product:`, item);
          return; // Bỏ qua item không hợp lệ
        }
        const shop = item.product.shop || {
          id: "default-" + index,
          name: "Lay's Việt Nam",
          avatar: "",
        };

        const shopId = shop.id?.toString() || `default-${index}`;

        if (!shopsMap[shopId]) {
          shopsMap[shopId] = {
            id: shopId,
            avatar: shop.avatar || "",
            name: shop.name || "Lay's Việt Nam",
            deliveryInfo: shop.deliveryInfo || "Delivery in 15 minutes ago",
            productIcons: shop.productIcons || false,
            products: [],
          };
        }

        shopsMap[shopId].products.push({
          id: item.product.id.toString(),
          name: item.product.name,
          img: item.product.img || "",
          title: item.product.name,
          weight: item.product.weight || 0,
          price: item.product.price || 0,
          amount: item.quantity || 1,
          isPaid: item.isPaid || false,
          created_at: item.product.createdAt || new Date().toISOString(),
        });
      });

      const shopsArray = Object.values(shopsMap);
      setData(shopsArray);
      setError(null);
    } catch (error) {
      console.error("Error fetching cart data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Không thể lấy dữ liệu giỏ hàng."
      );
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();

    const fetchVouchers = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/payment/vouchers/available"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Thêm log chi tiết để kiểm tra
        console.log("Raw voucher data:", data);
        console.log("Voucher data type:", typeof data);
        console.log("Is array?", Array.isArray(data));

        const formattedVouchers: Voucher[] = data.map((voucher: any) => ({
          id: voucher.id,
          type: voucher.type,
          code: voucher.code,
          description: voucher.description,
          remaining: voucher.remaining,
        }));

        console.log("Formatted vouchers:", formattedVouchers);

        setVouchers(formattedVouchers);
        setLoading(false);
      } catch (error) {
        console.error("Detailed error fetching vouchers:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const updateProductAmount = async (productId: string, newAmount: number) => {
    try {
      const cartId = localStorage.getItem("cartId");
      if (!cartId) {
        console.error("Không tìm thấy cartId trong localStorage");
        return false;
      }

      console.log(
        `Đang cập nhật sản phẩm ${productId} với số lượng ${newAmount}`
      );

      const response = await fetch(
        `http://localhost:3000/cart/${cartId}/items/${productId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity: newAmount }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Lỗi khi cập nhật số lượng sản phẩm: ${response.status}`,
          errorText
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Lỗi cập nhật số lượng sản phẩm:", error);
      return false;
    }
  };

  return {
    data,
    setData,
    vouchers,
    error,
    loading,
    handleUpdatePrice: updateProductAmount,
  };
};

export default usePayment;
