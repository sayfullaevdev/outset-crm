import { CheckCircle2, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PricingBreakdown } from "@/lib/types";
import { formatCny, formatUzs } from "@/lib/utils";

export function CalcPanel({
  pricing,
  priceCny,
}: {
  pricing: PricingBreakdown;
  priceCny?: number;
}) {
  const salePriceWithoutCargo = pricing.productSalePriceUzs;
  const prepaymentWithoutCargo = salePriceWithoutCargo / 2;
  const finalPaymentWithoutCargo = salePriceWithoutCargo - prepaymentWithoutCargo;
  const profitWithoutCargo = salePriceWithoutCargo - pricing.itemCostUzs;
  const prepaymentCoversItemCost = prepaymentWithoutCargo >= pricing.itemCostUzs;

  const rows = [
    { label: "Закупка в Китае", value: formatCny(priceCny || 0) },
    { label: "Себестоимость товара", value: formatUzs(pricing.itemCostUzs) },
    { label: "Цена продажи", value: formatUzs(salePriceWithoutCargo) },
    { label: "Предоплата 50%", value: formatUzs(prepaymentWithoutCargo) },
    { label: "Остаток к оплате", value: formatUzs(finalPaymentWithoutCargo) },
    { label: "Прибыль", value: formatUzs(profitWithoutCargo) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Калькулятор</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-lg border p-3">
              <div className="text-sm font-medium">{row.label}</div>
              <div className="mt-1 text-sm text-muted-foreground">{row.value}</div>
            </div>
          ))}
        </div>

        {pricing.itemCostUzs > 0 ? (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
              prepaymentCoversItemCost ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"
            }`}
          >
            {prepaymentCoversItemCost ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            {prepaymentCoversItemCost
              ? "Предоплата покрывает себестоимость товара."
              : "Предоплата не покрывает себестоимость товара."}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Введите цену товара, чтобы увидеть расчет.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
