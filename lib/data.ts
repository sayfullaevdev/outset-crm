import { DEFAULT_SETTINGS } from "@/lib/constants";
import { getLiveExchangeRates } from "@/lib/currency";
import { getRows, getSettingsMap } from "@/lib/google-sheets";
import { parseProductSheetRow } from "@/lib/sheet-columns";
import type { Order, Product, Settings } from "@/lib/types";
import { fromBooleanString, parseSheetNumber, round2 } from "@/lib/utils";

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

function buildSettingsFromMap(map: Record<string, string>): Settings {
  const autoExchangeRates = map.autoExchangeRates !== "false";

  const base: Settings = {
    cargoRatePerKg: parseSheetNumber(map.cargoRatePerKg, DEFAULT_SETTINGS.cargoRatePerKg),
    usdToCnyRate: parseSheetNumber(map.usdToCnyRate, DEFAULT_SETTINGS.usdToCnyRate),
    usdToUzsRate: parseSheetNumber(map.usdToUzsRate, DEFAULT_SETTINGS.usdToUzsRate),
    cnyToUzsRate: parseSheetNumber(
      map.cnyToUzsRate,
      round2(DEFAULT_SETTINGS.usdToUzsRate * DEFAULT_SETTINGS.usdToCnyRate),
    ),
    defaultMarkup: parseSheetNumber(map.defaultMarkup, DEFAULT_SETTINGS.defaultMarkup),
    autoExchangeRates,
    ratesUpdatedAt: map.ratesUpdatedAt || "",
    ratesSource: map.ratesSource || "",
    telegramBotToken: map.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || "",
    telegramChannelId: map.telegramChannelId || process.env.TELEGRAM_CHANNEL_ID || "",
    telegramOrderUsername: normalizeTelegramOrderUsername(map.telegramOrderUsername),
    deliveryEstimate: map.deliveryEstimate || DEFAULT_SETTINGS.deliveryEstimate,
    googleSheetId: map.googleSheetId || process.env.GOOGLE_SHEET_ID || "",
  };

  return base;
}

export async function getSettings(): Promise<Settings> {
  try {
    const map = await getSettingsMap();
    const base = buildSettingsFromMap(map);

    if (!base.autoExchangeRates) {
      return base;
    }

    const live = await getLiveExchangeRates();

    return {
      ...base,
      usdToUzsRate: live.usdToUzsRate,
      usdToCnyRate: live.usdToCnyRate,
      cnyToUzsRate: live.cnyToUzsRate,
      ratesUpdatedAt: live.rateDate || base.ratesUpdatedAt,
      ratesSource: live.source,
    };
  } catch {
    const live = await getLiveExchangeRates();

    return {
      cargoRatePerKg: DEFAULT_SETTINGS.cargoRatePerKg,
      usdToCnyRate: live.usdToCnyRate,
      usdToUzsRate: live.usdToUzsRate,
      cnyToUzsRate: live.cnyToUzsRate,
      defaultMarkup: DEFAULT_SETTINGS.defaultMarkup,
      autoExchangeRates: true,
      ratesUpdatedAt: live.rateDate,
      ratesSource: live.source,
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
        salePriceUzs: parsed.salePriceUzs,
        profitUzs: parsed.profitUzs,
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
