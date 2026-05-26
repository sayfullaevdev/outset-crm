import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TelegramPreviewProps = {
  message: string;
  imageUrls: string[];
  onConfirm?: () => void;
  isPublishing?: boolean;
};

export function TelegramPreview({
  message,
  imageUrls,
  onConfirm,
  isPublishing,
}: TelegramPreviewProps) {
  const lines = message.split("\n").filter(Boolean);
  const previewImages = imageUrls.filter(Boolean).slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Превью Telegram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-[28px] bg-[#1f2c38] p-4 sm:p-5">
          {previewImages.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {previewImages.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-[20px] bg-slate-700"
                >
                  <Image
                    src={imageUrl}
                    alt={`Фото ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-[24px] bg-slate-600 text-sm text-slate-100">
              Добавьте фото товара
            </div>
          )}

          <div className="mt-4 rounded-[24px] bg-[#2b3e51] p-5 text-white">
            <div className="space-y-2 text-[15px] sm:text-[18px]">
              {lines.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        {onConfirm ? (
          <Button type="button" className="w-full" onClick={onConfirm} disabled={isPublishing}>
            {isPublishing ? "Публикуем..." : "Подтвердить и опубликовать"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
