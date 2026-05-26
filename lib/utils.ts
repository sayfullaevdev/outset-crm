import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
