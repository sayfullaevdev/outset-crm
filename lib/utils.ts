import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Числа из Google Sheets: «12 800», «2,3», «289 000» */
export function parseSheetNumber(value?: string | number | null, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  let normalized = String(value).trim().replace(/\s/g, "");

  if (!normalized) {
    return fallback;
  }

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeMediaUrl(value?: string | null) {
  const url = String(value ?? "")
    .trim()
    .split("\n")[0]
    ?.trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return "";
  }

  return url;
}

export function roundUpToStep(value: number, step = 1000) {
  if (value <= 0) {
    return 0;
  }

  return Math.ceil(value / step) * step;
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(round2(value));
}

export function formatCny(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(round2(value));
}

export function formatUzs(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(roundUpToStep(value));
}

export function convertUsdToUzs(value: number, usdToUzsRate: number) {
  return round2(value * usdToUzsRate);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function toBooleanString(value: boolean) {
  return value ? "true" : "false";
}

export function fromBooleanString(value?: string | null) {
  return value === "true";
}
