import { DEFAULT_SETTINGS } from "@/lib/constants";
import { getRows, getSettingsMap } from "@/lib/google-sheets";
import type { Order, Product, Settings } from "@/lib/types";
import { fromBooleanString, round2 } from "@/lib/utils";

function parseGalleryUrls(rawValue?: string, photoUrl?: string) {
  if (!rawValue) {
    return photoUrl ? [photoUrl] : [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === "string" && value.length > 0);
    }
  } catch {
    return rawValue
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return photoUrl ? [photoUrl] : [];
}

function normalizeTelegramOrderUsername(value?: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return DEFAULT_SETTINGS.telegramOrderUsername;
  }

  const normalizedValue = trimmedValue.startsWith("@") ? trimmedValue : `@${trimmedValue}`;

  if (normalizedValue.toLowerCase() === "@outset") {
    return DEFAULT_SETTINGS.telegramOrderUsername;
  }

  return normalizedValue;
}

export async function getSettings(): Promise<Settings> {
  try {
    const map = await getSettingsMap();

    return {
      cargoRatePerKg: Number(map.cargoRatePerKg || DEFAULT_SETTINGS.cargoRatePerKg),
      usdToCnyRate: Number(map.usdToCnyRate || DEFAULT_SETTINGS.usdToCnyRate),
      usdToUzsRate: Number(map.usdToUzsRate || DEFAULT_SETTINGS.usdToUzsRate),
      defaultMarkup: Number(map.defaultMarkup || DEFAULT_SETTINGS.defaultMarkup),
      telegramBotToken: map.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "",
      telegramChannelId: map.telegramChannelId || process.env.TELEGRAM_CHANNEL_ID || "",
      telegramOrderUsername: normalizeTelegramOrderUsername(map.telegramOrderUsername),
      deliveryEstimate: map.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
      googleSheetId: map.googleSheetId || process.env.GOOGLE_SHEET_ID || "",
    };
  } catch {
    return {
      cargoRatePerKg: DEFAULT_SETTINGS.cargoRatePerKg,
      usdToCnyRate: DEFAULT_SETTINGS.usdToCnyRate,
      usdToUzsRate: DEFAULT_SETTINGS.usdToUzsRate,
      defaultMarkup: DEFAULT_SETTINGS.defaultMarkup,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
      telegramChannelId: process.env.TELEGRAM_CHANNEL_ID || "",
      telegramOrderUsername: DEFAULT_SETTINGS.telegramOrderUsername,
      deliveryEstimate: DEFAULT_SETTINGS.deliveryEstimate,
      googleSheetId: process.env.GOOGLE_SHEET_ID || "",
    };
  }
}

export async function getProducts(): Promise<Product[]> {
  let rows: Record<string, string>[] = [];

  try {
    rows = await getRows<Record<string, string>>("products");
  } catch {
    rows = [];
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    link: row.link,
    priceCny: Number(row.priceCny || 0),
    category: row.category as Product["category"],
    estimatedWeightKg: Number(row.estimatedWeightKg || 0),
    markupMultiplier: Number(row.markupMultiplier || 0),
    photoUrl: row.photoUrl,
    galleryUrls: parseGalleryUrls(row.galleryUrls, row.photoUrl),
    notes: row.notes,
    sizes: row.sizes,
    colors: row.colors,
    deliveryEstimate: row.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
    status: (row.status as Product["status"]) || "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getProductById(id: string) {
  const products = await getProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function getOrders(): Promise<Order[]> {
  let rows: Record<string, string>[] = [];

  try {
    rows = await getRows<Record<string, string>>("orders");
  } catch {
    rows = [];
  }

  return rows.map((row) => ({
    id: row.id,
    clientName: row.clientName,
    telegramUsername: row.telegramUsername,
    productId: row.productId,
    productName: row.productName,
    salePriceUsd: round2(Number(row.salePriceUsd || 0)),
    salePriceUzs: round2(Number(row.salePriceUzs || 0)),
    totalCostUsd: round2(Number(row.totalCostUsd || 0)),
    profitUsd: round2(Number(row.profitUsd || 0)),
    weightKg: round2(Number(row.weightKg || 0)),
    prepaymentReceived: fromBooleanString(row.prepaymentReceived),
    prepaymentDate: row.prepaymentDate,
    orderedOnPinduoduo: fromBooleanString(row.orderedOnPinduoduo),
    orderedDate: row.orderedDate,
    inTransit: fromBooleanString(row.inTransit),
    arrived: fromBooleanString(row.arrived),
    arrivedDate: row.arrivedDate,
    finalPaymentReceived: fromBooleanString(row.finalPaymentReceived),
    finalPaymentDate: row.finalPaymentDate,
    status: row.status as Order["status"],
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}
