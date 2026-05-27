import { CATEGORY_LABELS } from "@/lib/constants";
import type { PricingBreakdown } from "@/lib/types";

export type ProductSheetField =
  | "id"
  | "name"
  | "link"
  | "priceCny"
  | "category"
  | "estimatedWeightKg"
  | "markupMultiplier"
  | "itemCostUzs"
  | "salePriceUzs"
  | "profitUzs"
  | "sizes"
  | "deliveryEstimate"
  | "status"
  | "photoUrl"
  | "galleryUrls"
  | "notes"
  | "createdAt"
  | "updatedAt";

export const PRODUCT_SHEET_COLUMNS: { key: ProductSheetField; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Название" },
  { key: "link", label: "Ссылка Pinduoduo" },
  { key: "priceCny", label: "Цена в Китае (CNY)" },
  { key: "category", label: "Категория" },
  { key: "estimatedWeightKg", label: "Вес (кг)" },
  { key: "markupMultiplier", label: "Наценка" },
  { key: "itemCostUzs", label: "Себестоимость (сум)" },
  { key: "salePriceUzs", label: "Цена продажи (сум)" },
  { key: "profitUzs", label: "Прибыль (сум)" },
  { key: "sizes", label: "Размеры" },
  { key: "deliveryEstimate", label: "Срок доставки" },
  { key: "status", label: "Статус" },
  { key: "photoUrl", label: "Фото (ссылка)" },
  { key: "galleryUrls", label: "Галерея (ссылки)" },
  { key: "notes", label: "Заметки" },
  { key: "createdAt", label: "Создан" },
  { key: "updatedAt", label: "Обновлён" },
];

/** Старые английские заголовки — чтобы читать старые таблицы */
const LEGACY_HEADER_TO_KEY: Record<string, ProductSheetField> = {
  id: "id",
  name: "name",
  link: "link",
  priceCny: "priceCny",
  category: "category",
  estimatedWeightKg: "estimatedWeightKg",
  markupMultiplier: "markupMultiplier",
  photoUrl: "photoUrl",
  galleryUrls: "galleryUrls",
  notes: "notes",
  sizes: "sizes",
  colors: "sizes",
  deliveryEstimate: "deliveryEstimate",
  status: "status",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  itemCostUzs: "itemCostUzs",
  salePriceUzs: "salePriceUzs",
  profitUzs: "profitUzs",
};

const LABEL_TO_KEY = Object.fromEntries(
  PRODUCT_SHEET_COLUMNS.map((column) => [column.label, column.key]),
) as Record<string, ProductSheetField>;

export function getProductSheetHeaders() {
  return PRODUCT_SHEET_COLUMNS.map((column) => column.label);
}

export function resolveProductFieldKey(header: string): ProductSheetField | null {
  return LABEL_TO_KEY[header] ?? LEGACY_HEADER_TO_KEY[header] ?? null;
}

export function productRowToSheetValues(row: Record<string, string>) {
  return PRODUCT_SHEET_COLUMNS.map((column) => row[column.key] ?? "");
}

export function sheetHeadersToProductRow(
  headers: string[],
  values: string[],
): Record<string, string> {
  const result: Record<string, string> = {};

  headers.forEach((header, index) => {
    const key = resolveProductFieldKey(header);
    if (key) {
      result[key] = values[index] ?? "";
    }
  });

  return result;
}

function formatStatus(value: string) {
  if (value === "active") return "Активный";
  if (value === "archived") return "Архив";
  return value;
}

function parseStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "активный" || normalized === "active") return "active";
  if (normalized === "архив" || normalized === "archived") return "archived";
  return value || "active";
}

function formatCategory(category: string) {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
}

function parseCategory(value: string) {
  const entry = Object.entries(CATEGORY_LABELS).find(([, label]) => label === value.trim());
  return entry?.[0] ?? value;
}

function parseGalleryCell(rawValue: string, photoUrl: string) {
  if (!rawValue?.trim()) {
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

export function formatGalleryForSheet(urls: string[]) {
  const unique = [...new Set(urls.filter(Boolean))];
  return unique.join("\n");
}

export function buildProductSheetRow(input: {
  id: string;
  name: string;
  link: string;
  priceCny: number;
  category: string;
  estimatedWeightKg: number;
  markupMultiplier: number;
  pricing: PricingBreakdown;
  sizes: string;
  deliveryEstimate: string;
  status: string;
  photoUrl: string;
  galleryUrls: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}) {
  const salePriceUzs = Math.round(input.pricing.productSalePriceUzs);
  const itemCostUzs = Math.round(input.pricing.itemCostUzs);
  const profitUzs = Math.max(0, salePriceUzs - itemCostUzs);

  const row: Record<string, string> = {
    id: input.id,
    name: input.name,
    link: input.link,
    priceCny: String(input.priceCny),
    category: formatCategory(input.category),
    estimatedWeightKg: String(input.estimatedWeightKg),
    markupMultiplier: String(input.markupMultiplier),
    itemCostUzs: String(itemCostUzs),
    salePriceUzs: String(salePriceUzs),
    profitUzs: String(profitUzs),
    sizes: input.sizes,
    deliveryEstimate: input.deliveryEstimate,
    status: formatStatus(input.status),
    photoUrl: input.photoUrl,
    galleryUrls: input.galleryUrls,
    notes: input.notes,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };

  return row;
}

export function parseProductSheetRow(raw: Record<string, string>) {
  const salePriceUzs = Number(raw.salePriceUzs || 0);
  const itemCostUzs = Number(raw.itemCostUzs || 0);
  const profitFromSheet = Number(raw.profitUzs || 0);
  const profitUzs =
    profitFromSheet > 0 ? profitFromSheet : salePriceUzs > 0 ? salePriceUzs - itemCostUzs : 0;

  return {
    id: raw.id,
    name: raw.name,
    link: raw.link,
    priceCny: Number(raw.priceCny || 0),
    category: parseCategory(raw.category) as keyof typeof CATEGORY_LABELS,
    estimatedWeightKg: Number(raw.estimatedWeightKg || 0),
    markupMultiplier: Number(raw.markupMultiplier || 0),
    photoUrl: raw.photoUrl || "",
    galleryUrls: parseGalleryCell(raw.galleryUrls, raw.photoUrl),
    notes: raw.notes || "",
    sizes: raw.sizes || "",
    colors: "",
    deliveryEstimate: raw.deliveryEstimate || "",
    status: parseStatus(raw.status) as "active" | "archived",
    itemCostUzs,
    salePriceUzs,
    profitUzs,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
