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
  const cargoCostUsd = round2(input.weightKg * input.cargoRatePerKg);
  const cargoCostUzs = round2(cargoCostUsd * input.usdToUzsRate);
  const totalCostUsd = round2(itemCostUsd + cargoCostUsd);
  const totalCostUzs = round2(totalCostUsd * input.usdToUzsRate);
  const productSalePriceUsd = round2(itemCostUsd * input.markupMultiplier);
  const productSalePriceUzs = round2(productSalePriceUsd * input.usdToUzsRate);
  const salePriceUsd = round2(totalCostUsd * input.markupMultiplier);
  const salePriceUzs = round2(salePriceUsd * input.usdToUzsRate);
  const prepaymentUsd = round2(salePriceUsd * 0.5);
  const prepaymentUzs = round2(prepaymentUsd * input.usdToUzsRate);
  const finalPaymentUsd = round2(salePriceUsd - prepaymentUsd);
  const finalPaymentUzs = round2(finalPaymentUsd * input.usdToUzsRate);
  const profitUsd = round2(salePriceUsd - totalCostUsd);
  const profitUzs = round2(profitUsd * input.usdToUzsRate);

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
