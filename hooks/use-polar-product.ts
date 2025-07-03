import { useState, useEffect } from "react";
import { useIsAuthenticated } from "@/hooks/use-is-authenticated";

export interface PolarProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  recurringInterval: string;
}

export function usePolarProduct() {
  const { isAuthenticated } = useIsAuthenticated();
  const [productData, setProductData] = useState<PolarProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/polar-product");
        
        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            setError(data.message || "Failed to load product information");
          } else if (data.id && data.price !== undefined) {
            setProductData(data);
          } else {
            setError("Product pricing information is not available");
          }
        } else {
          setError("Unable to load product information");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product information");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isAuthenticated]);

  return { productData, loading, error };
}