export interface PolarPrice {
  createdAt: string;
  modifiedAt: string | null;
  id: string;
  amountType: string;
  isArchived: boolean;
  productId: string;
  type: string;
  recurringInterval: string;
  priceCurrency: string;
  priceAmount: number;
}

export interface PolarProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  recurringInterval: string;
}

export interface PolarDebugResponse {
  success: boolean;
  configuredProductId: string | null;
  configuredProductIdSource: string;
  products: PolarProduct[];
  specificProduct: PolarProduct | null;
  organization: unknown;
  totalProducts: number;
  polarServer: string;
  timestamp: string;
  error?: string;
  message?: string;
}