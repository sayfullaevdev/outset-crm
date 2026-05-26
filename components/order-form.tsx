"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deriveOrderStatus } from "@/lib/orders";
import { calculatePricing } from "@/lib/pricing";
import type { Product, Settings } from "@/lib/types";
import { formatCny, formatUzs } from "@/lib/utils";

type OrderFormProps = {
  products: Product[];
  settings: Settings;
};

export function OrderForm({ products, settings }: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    productId: products[0]?.id ?? "",
    clientName: "",
    telegramUsername: "",
    prepaymentReceived: false,
    prepaymentDate: "",
    orderedOnPinduoduo: false,
    orderedDate: "",
    inTransit: false,
    arrived: false,
    arrivedDate: "",
    finalPaymentReceived: false,
    finalPaymentDate: "",
    notes: "",
  });

  const product = useMemo(
    () => products.find((item) => item.id === form.productId) ?? null,
    [form.productId, products],
  );

  const pricing = useMemo(() => {
    if (!product) {
      return null;
    }

    return calculatePricing({
      priceCny: product.priceCny,
      usdToCnyRate: settings.usdToCnyRate,
      cargoRatePerKg: settings.cargoRatePerKg,
      usdToUzsRate: settings.usdToUzsRate,
      weightKg: product.estimatedWeightKg,
      markupMultiplier: product.markupMultiplier,
    });
  }, [product, settings]);

  const status = deriveOrderStatus({
    prepaymentReceived: form.prepaymentReceived,
    orderedOnPinduoduo: form.orderedOnPinduoduo,
    inTransit: form.inTransit,
    arrived: form.arrived,
    finalPaymentReceived: form.finalPaymentReceived,
  });

  function handleSubmit() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось создать заказ.");
        }

        toast.success("Заказ добавлен.");
        router.push("/orders");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка создания заказа.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Новый заказ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="productId">Товар</Label>
              <Select
                id="productId"
                value={form.productId}
                onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
              >
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Имя клиента</Label>
              <Input
                id="clientName"
                value={form.clientName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, clientName: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramUsername">Telegram username</Label>
              <Input
                id="telegramUsername"
                placeholder="@username"
                value={form.telegramUsername}
                onChange={(event) =>
                  setForm((current) => ({ ...current, telegramUsername: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.prepaymentReceived}
                onChange={(event) =>
                  setForm((current) => ({ ...current, prepaymentReceived: event.target.checked }))
                }
              />
              Предоплата получена
            </label>
            <div className="space-y-2">
              <Label htmlFor="prepaymentDate">Дата предоплаты</Label>
              <Input
                id="prepaymentDate"
                type="date"
                value={form.prepaymentDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, prepaymentDate: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.orderedOnPinduoduo}
                onChange={(event) =>
                  setForm((current) => ({ ...current, orderedOnPinduoduo: event.target.checked }))
                }
              />
              Заказан на Pinduoduo
            </label>
            <div className="space-y-2">
              <Label htmlFor="orderedDate">Дата заказа</Label>
              <Input
                id="orderedDate"
                type="date"
                value={form.orderedDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, orderedDate: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.inTransit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, inTransit: event.target.checked }))
                }
              />
              В пути
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.arrived}
                onChange={(event) => setForm((current) => ({ ...current, arrived: event.target.checked }))}
              />
              Прибыл
            </label>

            <div className="space-y-2">
              <Label htmlFor="arrivedDate">Дата прибытия</Label>
              <Input
                id="arrivedDate"
                type="date"
                value={form.arrivedDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, arrivedDate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalPaymentDate">Дата финальной оплаты</Label>
              <Input
                id="finalPaymentDate"
                type="date"
                value={form.finalPaymentDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, finalPaymentDate: event.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.finalPaymentReceived}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    finalPaymentReceived: event.target.checked,
                  }))
                }
              />
              Финальная оплата получена
            </label>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </div>
          </div>

          <Button type="button" className="w-full sm:w-auto" onClick={handleSubmit} disabled={isPending || !product}>
            {isPending ? "Сохраняем..." : "Создать заказ"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сводка заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>Статус: {status}</div>
          <div>Товар: {product?.name || "—"}</div>
          <div>Закупка: {product ? formatCny(product.priceCny) : "—"}</div>
          <div>Цена продажи: {pricing ? formatUzs(pricing.salePriceUzs) : "—"}</div>
          <div>Предоплата: {pricing ? formatUzs(pricing.prepaymentUzs) : "—"}</div>
          <div>Ожидаемая прибыль: {pricing ? formatUzs(pricing.profitUzs) : "—"}</div>
        </CardContent>
      </Card>
    </div>
  );
}
