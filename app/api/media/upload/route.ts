import { NextResponse } from "next/server";

import { getSupabaseBucket, getSupabaseServerClient } from "@/lib/supabase-server";

function getExtFromContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("gif")) return "gif";
  return "jpg";
}

async function loadImageToBuffer(src: string) {
  if (src.startsWith("data:")) {
    const [meta, base64] = src.split(",", 2);
    const contentType = meta.match(/^data:(.*?);base64$/)?.[1] || "image/jpeg";
    return {
      buffer: Buffer.from(base64, "base64"),
      contentType,
    };
  }

  const response = await fetch(src, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      referer: "https://mobile.yangkeduo.com/",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить картинку: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { images?: string[]; folder?: string };
    const images = Array.isArray(body.images)
      ? body.images.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];

    if (!images.length) {
      return NextResponse.json({ error: "Нет картинок для загрузки." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const bucket = getSupabaseBucket();
    const folder = body.folder && typeof body.folder === "string" ? body.folder : "products";
    const dateFolder = new Date().toISOString().slice(0, 10);

    const uploadedUrls = await Promise.all(
      images.map(async (src) => {
        if (src.startsWith("http") && src.includes("/storage/v1/object/public/")) {
          return src;
        }

        const { buffer, contentType } = await loadImageToBuffer(src);
        const ext = getExtFromContentType(contentType);
        const path = `${folder}/${dateFolder}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
          contentType,
          upsert: false,
        });

        if (error) {
          throw new Error(error.message);
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      }),
    );

    return NextResponse.json({ ok: true, urls: uploadedUrls });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось загрузить изображения." },
      { status: 500 },
    );
  }
}

