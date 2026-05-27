import { getSettings } from "@/lib/data";
import { calculatePricing } from "@/lib/pricing";
import { buildProductSheetRow, formatGalleryForSheet } from "@/lib/sheet-columns";
import type { ProductCategory } from "@/lib/types";

export async function buildProductRowForSheet(input: {
  id: string;
  name: string;
  link: string;
  priceCny: number;
  category: ProductCategory;
  estimatedWeightKg: number;
  markupMultiplier: number;
  sizes: string;
  deliveryEstimate: string;
  status: string;
  photoUrl: string;
  galleryUrls: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}) {
  const settings = await getSettings();
  const pricing = calculatePricing({
    priceCny: input.priceCny,
    weightKg: input.estimatedWeightKg,
    markupMultiplier: input.markupMultiplier,
    cargoRatePerKg: settings.cargoRatePerKg,
    usdToCnyRate: settings.usdToCnyRate,
    usdToUzsRate: settings.usdToUzsRate,
  });

  const galleryUrls = input.galleryUrls.length
    ? input.galleryUrls
    : input.photoUrl
      ? [input.photoUrl]
      : [];
  const photoUrl = input.photoUrl || galleryUrls[0] || "";

  return buildProductSheetRow({
    ...input,
    pricing,
    photoUrl,
    galleryUrls: formatGalleryForSheet(galleryUrls),
  });
}
