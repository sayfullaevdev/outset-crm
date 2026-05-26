import sharp from "sharp";

function sanitizePosterText(value: string) {
  return value.replace(/\uFE0F/g, "");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function loadImageBuffer(src: string) {
  if (src.startsWith("data:")) {
    const [, base64] = src.split(",", 2);
    return Buffer.from(base64, "base64");
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

  return Buffer.from(await response.arrayBuffer());
}

async function roundedImage(src: string, width: number, height: number, radius: number) {
  const imageBuffer = await loadImageBuffer(src);
  const roundedMask = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white" />
    </svg>`,
  );

  return sharp(imageBuffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .composite([{ input: roundedMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function buildTelegramPoster(input: {
  lines: string[];
  imageUrls: string[];
}) {
  const width = 1080;
  const height = 1280;
  const margin = 28;
  const gap = 12;
  const bigWidth = 680;
  const bigHeight = 820;
  const sideWidth = 332;
  const sideHeight = 264;
  const rightX = margin + bigWidth + gap;
  const cardY = margin + bigHeight + 24;
  const cardHeight = height - cardY - margin;
  const baseColor = "#1f2c38";
  const cardColor = "#2b3e51";

  const baseImages = input.imageUrls.filter(Boolean);
  if (!baseImages.length) {
    throw new Error("Добавьте хотя бы одно фото для публикации.");
  }

  const posterImages = Array.from({ length: 4 }, (_, index) => baseImages[index] ?? baseImages[0]);
  const imageBuffers = await Promise.all([
    roundedImage(posterImages[0], bigWidth, bigHeight, 24),
    roundedImage(posterImages[1], sideWidth, sideHeight, 24),
    roundedImage(posterImages[2], sideWidth, sideHeight, 24),
    roundedImage(posterImages[3], sideWidth, sideHeight, 24),
  ]);

  const lineMarkup = input.lines.map((line, index) => {
    const y = 74 + index * 56;
    return `<text x="40" y="${y}" font-size="42" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">${escapeXml(
      sanitizePosterText(line),
    )}</text>`;
  });

  const textCard = Buffer.from(
    `<svg width="${width - margin * 2}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="26" ry="26" fill="${cardColor}" />
      ${lineMarkup.join("")}
    </svg>`,
  );

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: baseColor,
    },
  })
    .composite([
      { input: imageBuffers[0], left: margin, top: margin },
      { input: imageBuffers[1], left: rightX, top: margin },
      { input: imageBuffers[2], left: rightX, top: margin + sideHeight + gap },
      { input: imageBuffers[3], left: rightX, top: margin + (sideHeight + gap) * 2 },
      { input: textCard, left: margin, top: cardY },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}
