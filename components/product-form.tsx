"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CalcPanel } from "@/components/calc-panel";
import { TelegramPreview } from "@/components/telegram-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, DEFAULT_CATEGORY_WEIGHTS, PRODUCT_CATEGORIES } from "@/lib/constants";
import { buildTelegramPost } from "@/lib/posts";
import { calculatePricing } from "@/lib/pricing";
import type { Product, Settings } from "@/lib/types";
import { roundUpToStep } from "@/lib/utils";

type ProductFormProps = {
  initialProduct?: Product | null;
  settings: Settings;
};

export function ProductForm({ initialProduct, settings }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);
  const [isPending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(false);
  const [weightDirty, setWeightDirty] = useState(Boolean(initialProduct));
  const [form, setForm] = useState({
    name: initialProduct?.name ?? "",
    link: initialProduct?.link ?? "",
    priceCny: String(initialProduct?.priceCny ?? ""),
    category: initialProduct?.category ?? "t-shirt",
    estimatedWeightKg: String(
      initialProduct?.estimatedWeightKg ?? DEFAULT_CATEGORY_WEIGHTS["t-shirt"],
    ),
    markupMultiplier: String(initialProduct?.markupMultiplier ?? settings.defaultMarkup),
    photoUrl: initialProduct?.photoUrl ?? "",
    galleryUrls:
      initialProduct?.galleryUrls ??
      (initialProduct?.photoUrl ? [initialProduct.photoUrl] : []),
    notes: initialProduct?.notes ?? "",
    sizes: initialProduct?.sizes ?? "",
    deliveryEstimate: initialProduct?.deliveryEstimate ?? settings.deliveryEstimate,
    status: initialProduct?.status ?? "active",
  });

  const pricing = useMemo(() => {
    return calculatePricing({
      priceCny: Number(form.priceCny || 0),
      usdToCnyRate: settings.usdToCnyRate,
      cargoRatePerKg: settings.cargoRatePerKg,
      usdToUzsRate: settings.usdToUzsRate,
      weightKg: Number(form.estimatedWeightKg || 0),
      markupMultiplier: Number(form.markupMultiplier || settings.defaultMarkup),
    });
  }, [form.estimatedWeightKg, form.markupMultiplier, form.priceCny, settings]);

  const previewMessage = useMemo(() => {
    return buildTelegramPost({
      productSalePriceUzs: pricing.productSalePriceUzs,
      cargoRate100gUzs: roundUpToStep(settings.cargoRatePerKg),
      sizes: form.sizes,
      deliveryEstimate: form.deliveryEstimate || settings.deliveryEstimate,
      orderUsername: settings.telegramOrderUsername,
    });
  }, [form.deliveryEstimate, form.sizes, pricing.productSalePriceUzs, settings.cargoRatePerKg, settings.deliveryEstimate, settings.telegramOrderUsername]);

  const previewImages = useMemo(() => {
    return [form.photoUrl, ...form.galleryUrls.filter((imageUrl) => imageUrl !== form.photoUrl)]
      .filter(Boolean)
      .slice(0, 4);
  }, [form.galleryUrls, form.photoUrl]);

  async function uploadImagesIfNeeded() {
    const candidates = [form.photoUrl, ...form.galleryUrls].filter(Boolean);
    const needsUpload = candidates.filter((url) => url.startsWith("data:"));

    if (!needsUpload.length) {
      return {
        photoUrl: form.photoUrl,
        galleryUrls: form.galleryUrls,
      };
    }

    const response = await fetch("/api/media/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: needsUpload,
        folder: "products",
      }),
    });

    const data = (await response.json()) as { error?: string; urls?: string[] };
    if (!response.ok || !data.urls?.length) {
      throw new Error(data.error || "Не удалось загрузить фото в Supabase.");
    }

    const map = new Map<string, string>();
    needsUpload.forEach((src, index) => {
      map.set(src, data.urls?.[index] || src);
    });

    const nextPhotoUrl = map.get(form.photoUrl) || form.photoUrl;
    const nextGalleryUrls = form.galleryUrls.map((url) => map.get(url) || url);

    setForm((current) => ({
      ...current,
      photoUrl: nextPhotoUrl,
      galleryUrls: nextGalleryUrls,
    }));

    return {
      photoUrl: nextPhotoUrl,
      galleryUrls: nextGalleryUrls,
    };
  }

  async function saveProduct() {
    const uploaded = await uploadImagesIfNeeded();
    const payload = {
      ...form,
      photoUrl: uploaded.photoUrl,
      galleryUrls: uploaded.galleryUrls,
    };

    const response = await fetch(isEdit ? `/api/products/${initialProduct?.id}` : "/api/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { error?: string; product?: Product };

    if (!response.ok) {
      throw new Error(data.error || "Не удалось сохранить товар.");
    }

    return data;
  }

  async function handleSave() {
    startTransition(async () => {
      try {
        await saveProduct();
        toast.success(isEdit ? "Товар обновлен." : "Товар добавлен.");
        router.push("/products");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения товара.");
      }
    });
  }

  async function handlePublish() {
    startTransition(async () => {
      try {
        await saveProduct();

        const response = await fetch("/api/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: previewMessage,
            imageUrls: previewImages,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось опубликовать пост.");
        }

        toast.success("Пост опубликован в Telegram.");
        router.push("/products");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка публикации.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Редактировать товар" : "Новый товар"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Название товара</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="link">Ссылка Pinduoduo</Label>
              <Input
                id="link"
                value={form.link}
                onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceCny">Цена в CNY</Label>
              <Input
                id="priceCny"
                type="number"
                inputMode="decimal"
                value={form.priceCny}
                onChange={(event) =>
                  setForm((current) => ({ ...current, priceCny: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select
                id="category"
                value={form.category}
                onChange={(event) => {
                  const nextCategory = event.target.value as Product["category"];
                  setForm((current) => ({
                    ...current,
                    category: nextCategory,
                    estimatedWeightKg:
                      !weightDirty ||
                      Number(current.estimatedWeightKg) ===
                        DEFAULT_CATEGORY_WEIGHTS[current.category as Product["category"]]
                        ? String(DEFAULT_CATEGORY_WEIGHTS[nextCategory])
                        : current.estimatedWeightKg,
                  }));
                }}
              >
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </Select>
            </div>

            {isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="weight">Вес (кг)</Label>
                <Input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  value={form.estimatedWeightKg}
                  onChange={(event) => {
                    setWeightDirty(true);
                    setForm((current) => ({ ...current, estimatedWeightKg: event.target.value }));
                  }}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="markup">Наценка</Label>
              <Input
                id="markup"
                type="number"
                inputMode="decimal"
                value={form.markupMultiplier}
                onChange={(event) =>
                  setForm((current) => ({ ...current, markupMultiplier: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryEstimate">Срок доставки</Label>
              <Input
                id="deliveryEstimate"
                value={form.deliveryEstimate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, deliveryEstimate: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="photoUrl">Фото (URL или локальное фото)</Label>
              <Input
                id="photoUrl"
                value={form.photoUrl}
                onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="photoUpload">Или загрузить фото</Label>
              <Input
                id="photoUpload"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);

                  if (!files.length) {
                    return;
                  }

                  Promise.all(
                    files.map(
                      (file) =>
                        new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(String(reader.result || ""));
                          reader.onerror = () => reject(new Error("Не удалось загрузить фото."));
                          reader.readAsDataURL(file);
                        }),
                    ),
                  )
                    .then((images) => {
                      setForm((current) => {
                        const nextGallery = [
                          ...current.galleryUrls,
                          ...images.filter((image) => !current.galleryUrls.includes(image)),
                        ];

                        return {
                          ...current,
                          photoUrl: current.photoUrl || images[0],
                          galleryUrls: nextGallery,
                        };
                      });
                    })
                    .catch(() => {
                      toast.error("Не удалось обработать выбранные фото.");
                    });
                }}
              />
            </div>

            {form.galleryUrls.length ? (
              <div className="space-y-3 md:col-span-2">
                <Label>Фотографии для поста</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.galleryUrls.map((imageUrl) => (
                    <button
                      key={imageUrl}
                      type="button"
                      className={`relative h-24 overflow-hidden rounded-lg border sm:h-28 ${
                        form.photoUrl === imageUrl ? "border-primary ring-2 ring-primary/30" : ""
                      }`}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          photoUrl: imageUrl,
                        }))
                      }
                    >
                      <Image
                        src={imageUrl}
                        alt={form.name || "Картинка товара"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="sizes">Размеры</Label>
              <Input
                id="sizes"
                placeholder="S, M, L"
                value={form.sizes}
                onChange={(event) => setForm((current) => ({ ...current, sizes: event.target.value }))}
              />
            </div>

            {isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as Product["status"],
                    }))
                  }
                >
                  <option value="active">Активный</option>
                  <option value="archived">Архив</option>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="button" className="w-full sm:w-auto" onClick={handleSave} disabled={isPending}>
              {isPending ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Добавить товар"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowPreview((value) => !value)}
            >
              {showPreview ? "Скрыть предпросмотр" : "Показать предпросмотр"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <CalcPanel pricing={pricing} priceCny={Number(form.priceCny || 0)} />
        {showPreview ? (
          <TelegramPreview
            message={previewMessage}
            imageUrls={previewImages}
            onConfirm={handlePublish}
            isPublishing={isPending}
          />
        ) : null}
      </div>
    </div>
  );
}
