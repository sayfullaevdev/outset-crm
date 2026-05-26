import { roundUpToStep } from "@/lib/utils";

export type TelegramPostInput = {
  productSalePriceUzs: number;
  cargoRate100gUzs: number;
  sizes: string;
  deliveryEstimate: string;
  orderUsername: string;
};

export function normalizeTelegramUsername(value: string) {
  if (!value.trim()) {
    return "@OutsetAdmin";
  }

  return value.startsWith("@") ? value : `@${value}`;
}

export function buildTelegramPostLines(input: TelegramPostInput) {
  return [
    `◻️ Цена: ${roundUpToStep(input.productSalePriceUzs).toLocaleString("ru-RU")}сум +карго`,
    `◻️ Размер: ${input.sizes || "уточняется"}`,
    `◻️ Доставка: ${input.deliveryEstimate}`,
    `◻️ Карго: 100гр - ${roundUpToStep(input.cargoRate100gUzs).toLocaleString("ru-RU")}сум`,
    "",
    `➡️ Для заказа: ${normalizeTelegramUsername(input.orderUsername)} ⬅️`,
  ];
}

export function buildTelegramPost(input: TelegramPostInput) {
  return buildTelegramPostLines(input).join("\n");
}
