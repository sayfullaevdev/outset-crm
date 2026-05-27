import { DEFAULT_SETTINGS } from "@/lib/constants";
import { getRows, getSettingsMap } from "@/lib/google-sheets";
import { parseProductSheetRow } from "@/lib/sheet-columns";
import type { Order, Product, Settings } from "@/lib/types";
import { fromBooleanString, round2 } from "@/lib/utils";

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

  return rows
    .filter((row) => row.id)
    .map((row) => {
      const parsed = parseProductSheetRow(row);

      return {
        id: parsed.id,
        name: parsed.name,
        link: parsed.link,
        priceCny: parsed.priceCny,
        category: parsed.category,
        estimatedWeightKg: parsed.estimatedWeightKg,
        markupMultiplier: parsed.markupMultiplier,
        photoUrl: parsed.photoUrl,
        galleryUrls: parsed.galleryUrls,
        notes: parsed.notes,
        sizes: parsed.sizes,
        colors: parsed.colors,
        deliveryEstimate: parsed.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
        status: parsed.status,
        createdAt: parsed.createdAt,
        updatedAt: parsed.updatedAt,
      };
    });
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
