import { NextResponse } from "next/server";

import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { appendRow } from "@/lib/google-sheets";
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
    const row = {
      id: createId("prd"),
      name: String(body.name),
      link: String(body.link),
      priceCny: String(Number(body.priceCny || 0)),
      category: String(body.category),
      estimatedWeightKg: String(Number(body.estimatedWeightKg || 0)),
      markupMultiplier: String(Number(body.markupMultiplier || 0)),
      photoUrl: "",
      galleryUrls: "[]",
      notes: String(body.notes || ""),
      sizes: String(body.sizes || ""),
      colors: String(body.colors || ""),
      deliveryEstimate: String(body.deliveryEstimate || ""),
      status: String(body.status || "active"),
      createdAt: now,
      updatedAt: now,
    };

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
