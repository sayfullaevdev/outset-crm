import { NextResponse } from "next/server";

import { updateRow } from "@/lib/google-sheets";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = (await request.json()) as Record<string, string | string[]>;
    const preparedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, JSON.stringify(value)];
        }

        return [key, String(value ?? "")];
      }),
    );

    await updateRow("products", context.params.id, {
      ...preparedBody,
      photoUrl: "",
      galleryUrls: "[]",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, product: { id: context.params.id } });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось обновить товар.",
      },
      { status: 500 },
    );
  }
}
