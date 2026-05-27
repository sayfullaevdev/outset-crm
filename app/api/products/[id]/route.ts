import { NextResponse } from "next/server";

import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { getProductById } from "@/lib/data";
import { updateRow } from "@/lib/google-sheets";
import { buildProductRowForSheet } from "@/lib/product-sheet";
import type { ProductCategory } from "@/lib/types";

type RouteContext = {
  params: {
    id: string;
  };
};

function parseGalleryUrls(value: string | string[] | undefined, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
      }
    } catch {
      return value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return fallback;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const existing = await getProductById(context.params.id);

    if (!existing) {
      return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, string | string[]>;
    const category = (body.category ? String(body.category) : existing.category) as ProductCategory;

    if (!PRODUCT_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Некорректная категория товара." }, { status: 400 });
    }

    const galleryUrls = parseGalleryUrls(body.galleryUrls, existing.galleryUrls);
    const row = await buildProductRowForSheet({
      id: existing.id,
      name: body.name ? String(body.name) : existing.name,
      link: body.link ? String(body.link) : existing.link,
      priceCny: body.priceCny !== undefined ? Number(body.priceCny) : existing.priceCny,
      category,
      estimatedWeightKg:
        body.estimatedWeightKg !== undefined
          ? Number(body.estimatedWeightKg)
          : existing.estimatedWeightKg,
      markupMultiplier:
        body.markupMultiplier !== undefined
          ? Number(body.markupMultiplier)
          : existing.markupMultiplier,
      sizes: body.sizes !== undefined ? String(body.sizes) : existing.sizes,
      deliveryEstimate:
        body.deliveryEstimate !== undefined
          ? String(body.deliveryEstimate)
          : existing.deliveryEstimate,
      status: body.status ? String(body.status) : existing.status,
      photoUrl: body.photoUrl !== undefined ? String(body.photoUrl) : existing.photoUrl,
      galleryUrls,
      notes: body.notes !== undefined ? String(body.notes) : existing.notes,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    });

    await updateRow("products", context.params.id, row);

    return NextResponse.json({ ok: true, product: row });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось обновить товар.",
      },
      { status: 500 },
    );
  }
}
