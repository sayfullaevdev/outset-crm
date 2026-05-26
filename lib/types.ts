import type { DEFAULT_SETTINGS, ORDER_STATUSES, PRODUCT_CATEGORIES } from "@/lib/constants";

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Product = {
  id: string;
  name: string;
  link: string;
  priceCny: number;
  category: ProductCategory;
  estimatedWeightKg: number;
  markupMultiplier: number;
  photoUrl: string;
  galleryUrls: string[];
  notes: string;
  sizes: string;
  colors: string;
  deliveryEstimate: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  clientName: string;
  telegramUsername: string;
  productId: string;
  productName: string;
  salePriceUsd: number;
  salePriceUzs: number;
  totalCostUsd: number;
  profitUsd: number;
  weightKg: number;
  prepaymentReceived: boolean;
  prepaymentDate: string;
  orderedOnPinduoduo: boolean;
  orderedDate: string;
  inTransit: boolean;
  arrived: boolean;
  arrivedDate: string;
  finalPaymentReceived: boolean;
  finalPaymentDate: string;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  cargoRatePerKg: number;
  usdToCnyRate: number;
  usdToUzsRate: number;
  defaultMarkup: number;
  telegramBotToken: string;
  telegramChannelId: string;
  telegramOrderUsername: string;
  deliveryEstimate: string;
  googleSheetId: string;
};

export type SettingsKey = keyof Settings;
export type DefaultSettings = typeof DEFAULT_SETTINGS;

export type PricingInput = {
  priceCny: number;
  usdToCnyRate: number;
  cargoRatePerKg: number;
  usdToUzsRate: number;
  weightKg: number;
  markupMultiplier: number;
};

export type PricingBreakdown = {
  itemCostUsd: number;
  itemCostUzs: number;
  cargoCostUsd: number;
  cargoCostUzs: number;
  totalCostUsd: number;
  totalCostUzs: number;
  productSalePriceUsd: number;
  productSalePriceUzs: number;
  salePriceUsd: number;
  salePriceUzs: number;
  prepaymentUsd: number;
  prepaymentUzs: number;
  finalPaymentUsd: number;
  finalPaymentUzs: number;
  profitUsd: number;
  profitUzs: number;
  prepaymentCoversCost: boolean;
};
