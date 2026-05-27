import { round2 } from "@/lib/utils";
import type { PricingBreakdown, PricingInput } from "@/lib/types";

export function calculatePricing(input: PricingInput): PricingBreakdown {
  if (input.priceCny <= 0) {
    return {
      itemCostUsd: 0,
      itemCostUzs: 0,
      cargoCostUsd: 0,
      cargoCostUzs: 0,
      totalCostUsd: 0,
      totalCostUzs: 0,
      productSalePriceUsd: 0,
      productSalePriceUzs: 0,
      salePriceUsd: 0,
      salePriceUzs: 0,
      prepaymentUsd: 0,
      prepaymentUzs: 0,
      finalPaymentUsd: 0,
      finalPaymentUzs: 0,
      profitUsd: 0,
      profitUzs: 0,
      prepaymentCoversCost: true,
    };
  }

  const itemCostUsd = round2(input.priceCny * input.usdToCnyRate);
  const itemCostUzs = round2(itemCostUsd * input.usdToUzsRate);

  // Карго хранится/вводится как тариф "за 100г" в суммах.
  // Поэтому: вес(кг) * 10 = количество "100г".
  const cargoCostUzs = round2(input.weightKg * 10 * input.cargoRatePerKg);
  // Для совместимости с существующими USD-полями пересчитываем карго обратно в USD,
  // но финальная логика по сумам не зависит от курса.
  const cargoCostUsd = input.usdToUzsRate > 0 ? round2(cargoCostUzs / input.usdToUzsRate) : 0;

  const totalCostUzs = round2(itemCostUzs + cargoCostUzs);
  const totalCostUsd = input.usdToUzsRate > 0 ? round2(totalCostUzs / input.usdToUzsRate) : 0;
  const productSalePriceUsd = round2(itemCostUsd * input.markupMultiplier);
  const productSalePriceUzs = round2(productSalePriceUsd * input.usdToUzsRate);
  const salePriceUsd = round2(totalCostUsd * input.markupMultiplier);
  const salePriceUzs = round2(totalCostUzs * input.markupMultiplier);
  const prepaymentUsd = round2(salePriceUsd * 0.5);
  const prepaymentUzs = round2(prepaymentUsd * input.usdToUzsRate);
  const finalPaymentUsd = round2(salePriceUsd - prepaymentUsd);
  const finalPaymentUzs = round2(salePriceUzs - prepaymentUzs);
  const profitUzs = round2(salePriceUzs - totalCostUzs);
  const profitUsd = input.usdToUzsRate > 0 ? round2(profitUzs / input.usdToUzsRate) : 0;

  return {
    itemCostUsd,
    itemCostUzs,
    cargoCostUsd,
    cargoCostUzs,
    totalCostUsd,
    totalCostUzs,
    productSalePriceUsd,
    productSalePriceUzs,
    salePriceUsd,
    salePriceUzs,
    prepaymentUsd,
    prepaymentUzs,
    finalPaymentUsd,
    finalPaymentUzs,
    profitUsd,
    profitUzs,
    prepaymentCoversCost: prepaymentUsd >= totalCostUsd,
  };
}
