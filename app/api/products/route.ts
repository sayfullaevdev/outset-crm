import { NextResponse } from "next/server";

import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { appendRow } from "@/lib/google-sheets";
import { buildProductRowForSheet } from "@/lib/product-sheet";
import { createId } from "@/lib/utils";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | string[]>;

    if (!body.name || !body.link || !body.priceCny) {
      return NextResponse.json(
        { error: "Заполните название, ссылку и цену в CNY." },
        { status: 400 },
      );
    }

    if (!PRODUCT_CATEGORIES.includes(body.category as (typeof PRODUCT_CATEGORIES)[number])) {
      return NextResponse.json({ error: "Некорректная категория товара." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const galleryUrls = Array.isArray(body.galleryUrls)
      ? body.galleryUrls.filter((value): value is string => typeof value === "string")
      : [];

    const row = await buildProductRowForSheet({
      id: createId("prd"),
      name: String(body.name),
      link: String(body.link),
      priceCny: Number(body.priceCny || 0),
      category: body.category as (typeof PRODUCT_CATEGORIES)[number],
      estimatedWeightKg: Number(body.estimatedWeightKg || 0),
      markupMultiplier: Number(body.markupMultiplier || 0),
      sizes: String(body.sizes || ""),
      deliveryEstimate: String(body.deliveryEstimate || ""),
      status: String(body.status || "active"),
      photoUrl: String(body.photoUrl || ""),
      galleryUrls,
      notes: String(body.notes || ""),
      createdAt: now,
      updatedAt: now,
    });

    await appendRow("products", row);

    return NextResponse.json({ ok: true, product: row });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось сохранить товар.",
      },
      { status: 500 },
    );
  }
}
