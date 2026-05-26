import { NextResponse } from "next/server";

import { getSettings } from "@/lib/data";
import { publishTelegramMediaGroup, publishTelegramMessage, publishTelegramPhoto } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      imageUrls?: string[];
    };
    const settings = await getSettings();
    const botToken = settings.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    const channelId = settings.telegramChannelId || process.env.TELEGRAM_CHANNEL_ID;

    if (!body.message) {
      return NextResponse.json({ error: "Пустой текст поста." }, { status: 400 });
    }

    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: "Укажите Telegram bot token и channel ID в настройках." },
        { status: 400 },
      );
    }

    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];

    if (imageUrls.length > 1) {
      await publishTelegramMediaGroup({
        botToken,
        channelId,
        imageUrls,
        caption: body.message,
      });
    } else if (imageUrls.length === 1) {
      await publishTelegramPhoto({
        botToken,
        channelId,
        imageUrl: imageUrls[0],
        caption: body.message,
      });
    } else {
      await publishTelegramMessage({
        botToken,
        channelId,
        message: body.message,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось опубликовать сообщение.",
      },
      { status: 500 },
    );
  }
}
