import { DEFAULT_SETTINGS } from "@/lib/constants";
import { round2 } from "@/lib/utils";

const CBU_API_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/json/";

type CbuRateItem = {
  Ccy: string;
  Rate: string;
};

export async function fetchUsdToUzsRate() {
  try {
    const response = await fetch(CBU_API_URL, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      throw new Error("Не удалось получить курс CBU.");
    }

    const data = (await response.json()) as CbuRateItem[];
    const usd = data.find((item) => item.Ccy === "USD");

    if (!usd) {
      throw new Error("Курс USD не найден в ответе CBU.");
    }

    return round2(Number(usd.Rate.replace(",", ".")));
  } catch {
    return DEFAULT_SETTINGS.usdToUzsRate;
  }
}

export async function getRatesSnapshot(overrideUsdToCny?: number) {
  const usdToUzsRate = await fetchUsdToUzsRate();

  return {
    usdToUzsRate,
    usdToCnyRate: overrideUsdToCny ?? DEFAULT_SETTINGS.usdToCnyRate,
  };
}
