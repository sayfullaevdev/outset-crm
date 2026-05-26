import { NextResponse } from "next/server";

import { getProductById, getSettings } from "@/lib/data";
import { appendRow } from "@/lib/google-sheets";
import { deriveOrderStatus } from "@/lib/orders";
import { calculatePricing } from "@/lib/pricing";
import { createId, toBooleanString } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | boolean>;

    if (!body.clientName || !body.productId) {
      return NextResponse.json(
        { error: "Укажите клиента и товар для заказа." },
        { status: 400 },
      );
    }

    const [product, settings] = await Promise.all([
      getProductById(String(body.productId)),
      getSettings(),
    ]);

    if (!product) {
      return NextResponse.json({ error: "Товар не найден." }, { status: 404 });
    }

    const pricing = calculatePricing({
      priceCny: product.priceCny,
      usdToCnyRate: settings.usdToCnyRate,
      cargoRatePerKg: settings.cargoRatePerKg,
      usdToUzsRate: settings.usdToUzsRate,
      weightKg: product.estimatedWeightKg,
      markupMultiplier: product.markupMultiplier,
    });

    const flags = {
      prepaymentReceived: Boolean(body.prepaymentReceived),
      orderedOnPinduoduo: Boolean(body.orderedOnPinduoduo),
      inTransit: Boolean(body.inTransit),
      arrived: Boolean(body.arrived),
      finalPaymentReceived: Boolean(body.finalPaymentReceived),
    };

    const now = new Date().toISOString();
    const order = {
      id: createId("ord"),
      clientName: String(body.clientName),
      telegramUsername: String(body.telegramUsername || ""),
      productId: product.id,
      productName: product.name,
      salePriceUsd: String(pricing.salePriceUsd),
      salePriceUzs: String(pricing.salePriceUzs),
      totalCostUsd: String(pricing.totalCostUsd),
      profitUsd: String(pricing.profitUsd),
      weightKg: String(product.estimatedWeightKg),
      prepaymentReceived: toBooleanString(flags.prepaymentReceived),
      prepaymentDate: String(body.prepaymentDate || ""),
      orderedOnPinduoduo: toBooleanString(flags.orderedOnPinduoduo),
      orderedDate: String(body.orderedDate || ""),
      inTransit: toBooleanString(flags.inTransit),
      arrived: toBooleanString(flags.arrived),
      arrivedDate: String(body.arrivedDate || ""),
      finalPaymentReceived: toBooleanString(flags.finalPaymentReceived),
      finalPaymentDate: String(body.finalPaymentDate || ""),
      status: deriveOrderStatus(flags),
      notes: String(body.notes || ""),
      createdAt: now,
      updatedAt: now,
    };

    await appendRow("orders", order);

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось сохранить заказ.",
      },
      { status: 500 },
    );
  }
}
