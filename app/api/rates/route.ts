import { NextResponse } from "next/server";

import { getSettings } from "@/lib/data";
import { fetchUsdToUzsRate } from "@/lib/currency";

export async function GET() {
  try {
    const settings = await getSettings();
    const usdToUzsRate = await fetchUsdToUzsRate();

    return NextResponse.json({
      usdToUzsRate,
      usdToCnyRate: settings.usdToCnyRate,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось получить курсы валют.",
      },
      { status: 500 },
    );
  }
}
