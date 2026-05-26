type PublishMessageInput = {
  botToken: string;
  channelId: string;
  message: string;
};

async function loadTelegramImage(src: string) {
  if (src.startsWith("data:")) {
    const [meta, base64] = src.split(",", 2);
    const mimeType = meta.match(/^data:(.*?);base64$/)?.[1] || "image/jpeg";
    return new Blob([Buffer.from(base64, "base64")], { type: mimeType });
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

  return new Blob([await response.arrayBuffer()], {
    type: response.headers.get("content-type") || "image/jpeg",
  });
}

export async function publishTelegramMessage(input: PublishMessageInput) {
  const response = await fetch(`https://api.telegram.org/bot${input.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: input.channelId,
      text: input.message,
    }),
  });

  const data = (await response.json()) as { ok?: boolean; description?: string };

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Не удалось опубликовать пост в Telegram.");
  }

  return data;
}

type PublishPhotoInput = {
  botToken: string;
  channelId: string;
  imageUrl: string;
  caption?: string;
};

export async function publishTelegramPhoto(input: PublishPhotoInput) {
  const formData = new FormData();
  formData.append("chat_id", input.channelId);
  const photoBlob = await loadTelegramImage(input.imageUrl);
  formData.append(
    "photo",
    photoBlob,
    "telegram-photo.jpg",
  );

  if (input.caption) {
    formData.append("caption", input.caption);
  }

  const response = await fetch(`https://api.telegram.org/bot${input.botToken}/sendPhoto`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { ok?: boolean; description?: string };

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Не удалось опубликовать фото в Telegram.");
  }

  return data;
}

type PublishMediaGroupInput = {
  botToken: string;
  channelId: string;
  imageUrls: string[];
  caption?: string;
};

export async function publishTelegramMediaGroup(input: PublishMediaGroupInput) {
  const formData = new FormData();
  formData.append("chat_id", input.channelId);

  const photoBlobs = await Promise.all(input.imageUrls.slice(0, 10).map((imageUrl) => loadTelegramImage(imageUrl)));
  const media = photoBlobs.map((_, index) => ({
    type: "photo",
    media: `attach://photo${index}`,
    ...(index === 0 && input.caption ? { caption: input.caption } : {}),
  }));

  formData.append("media", JSON.stringify(media));

  photoBlobs.forEach((photoBlob, index) => {
    formData.append(`photo${index}`, photoBlob, `telegram-photo-${index + 1}.jpg`);
  });

  const response = await fetch(`https://api.telegram.org/bot${input.botToken}/sendMediaGroup`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { ok?: boolean; description?: string };

  if (!response.ok || !data.ok) {
    throw new Error(data.description || "Не удалось опубликовать альбом в Telegram.");
  }

  return data;
}
