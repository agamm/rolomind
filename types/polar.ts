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
  createdAt: string;
  modifiedAt: string;
  id: string;
  name: string;
  description: string;
  recurringInterval: string;
  isRecurring: boolean;
  isArchived: boolean;
  organizationId: string;
  metadata: Record<string, unknown>;
  prices: PolarPrice[];
  benefits: unknown[];
  medias: unknown[];
  attachedCustomFields: unknown[];
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