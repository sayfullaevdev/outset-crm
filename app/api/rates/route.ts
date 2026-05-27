import { NextResponse } from "next/server";

import { getLiveExchangeRates, syncLiveRatesToSheet } from "@/lib/currency";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sync = searchParams.get("sync") === "1";
    const live = sync ? await syncLiveRatesToSheet() : await getLiveExchangeRates();

    return NextResponse.json({
      ...live,
      synced: sync,
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
