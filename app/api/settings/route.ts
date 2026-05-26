import { NextResponse } from "next/server";

import { getSettings } from "@/lib/data";
import { upsertSetting } from "@/lib/google-sheets";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось получить настройки.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string | number>;

    await Promise.all(
      Object.entries(body).map(([key, value]) => upsertSetting(key, String(value ?? ""))),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось сохранить настройки.",
      },
      { status: 500 },
    );
  }
}
