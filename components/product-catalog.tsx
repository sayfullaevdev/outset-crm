"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { CATEGORY_LABELS } from "@/lib/constants";
import { buildTelegramPost } from "@/lib/posts";
import { calculatePricing } from "@/lib/pricing";
import type { Product, Settings } from "@/lib/types";
import { formatCny, formatUzs, parseSheetNumber, roundUpToStep } from "@/lib/utils";

type ProductCatalogProps = {
  products: Product[];
  settings: Settings;
};

export function ProductCatalog({ products, settings }: ProductCatalogProps) {
  const [items, setItems] = useState(products);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    setItems(products);
  }, [products]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
  }, [items]);

  function resolvePricing(product: Product) {
    const markup =
      parseSheetNumber(product.markupMultiplier, settings.defaultMarkup) || settings.defaultMarkup;

    const pricing = calculatePricing({
      priceCny: parseSheetNumber(product.priceCny),
      usdToCnyRate: settings.usdToCnyRate,
      cargoRatePerKg: settings.cargoRatePerKg,
      usdToUzsRate: settings.usdToUzsRate,
      weightKg: parseSheetNumber(product.estimatedWeightKg),
      markupMultiplier: markup,
    });

    let salePrice = roundUpToStep(pricing.productSalePriceUzs);
    let profit = salePrice - roundUpToStep(pricing.itemCostUzs);

    if (!Number.isFinite(salePrice) && product.salePriceUzs) {
      salePrice = roundUpToStep(product.salePriceUzs);
      profit = roundUpToStep(product.profitUzs ?? salePrice - roundUpToStep(pricing.itemCostUzs));
    }

    return { pricing, salePrice, profit };
  }

  function buildMessage(product: Product) {
    const { pricing } = resolvePricing(product);

    return buildTelegramPost({
      productSalePriceUzs: pricing.productSalePriceUzs,
      cargoRate100gUzs: roundUpToStep(settings.cargoRatePerKg),
      sizes: product.sizes,
      deliveryEstimate: product.deliveryEstimate || settings.deliveryEstimate,
      orderUsername: settings.telegramOrderUsername,
    });
  }

  function archiveProduct(productId: string) {
    const previous = items;
    setItems((current) =>
      current.map((item) => (item.id === productId ? { ...item, status: "archived" } : item)),
    );

    startTransition(async () => {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "archived",
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось архивировать товар.");
        }

        toast.success("Товар отправлен в архив.");
      } catch (error) {
        setItems(previous);
        toast.error(error instanceof Error ? error.message : "Ошибка архивации.");
      }
    });
  }

  function publishProduct(product: Product) {
    startTransition(async () => {
      try {
        const response = await fetch("/api/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: buildMessage(product),
            imageUrls: [product.photoUrl, ...product.galleryUrls.filter((imageUrl) => imageUrl !== product.photoUrl)].filter(Boolean),
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось опубликовать товар.");
        }

        toast.success("Пост повторно опубликован.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка публикации.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {sortedItems.map((product) => {
        const { salePrice: productSalePrice, profit: productProfit } = resolvePricing(product);

        return (
          <Card key={product.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border sm:h-28 sm:w-28">
                <ProductThumbnail src={product.photoUrl} alt={product.name} />
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words font-semibold">{product.name}</h3>
                  <Badge variant={product.status === "active" ? "success" : "muted"}>
                    {product.status === "active" ? "Активный" : "Архив"}
                  </Badge>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>Категория: {CATEGORY_LABELS[product.category]}</div>
                  <div>Закупка: {formatCny(product.priceCny)}</div>
                  <div>Цена: {formatUzs(productSalePrice)}</div>
                  <div>Прибыль: {formatUzs(productProfit)}</div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "w-full justify-center sm:w-auto" })}
                  >
                    Редактировать
                  </Link>
                  {product.status === "active" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={isPending}
                      onClick={() => archiveProduct(product.id)}
                    >
                      Архивировать
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={isPending}
                    onClick={() => publishProduct(product)}
                  >
                    Переопубликовать
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {!sortedItems.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Пока нет товаров. Добавьте первый товар в каталог.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
