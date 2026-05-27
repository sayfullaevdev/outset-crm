import { DEFAULT_SETTINGS } from "@/lib/constants";
import { upsertSetting } from "@/lib/google-sheets";
import { parseSheetNumber, round2 } from "@/lib/utils";

const CBU_API_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/json/";

type CbuRateItem = {
  Ccy: string;
  Rate: string;
  Nominal: string;
  Date: string;
};

export type LiveExchangeRates = {
  /** 1 USD = N сум (CBU) */
  usdToUzsRate: number;
  /** 1 CNY = N сум (CBU) */
  cnyToUzsRate: number;
  /** Коэффициент CNY→USD для калькулятора: cnyToUzs / usdToUzs */
  usdToCnyRate: number;
  rateDate: string;
  source: "cbu.uz";
};

function parseCbuRate(item: CbuRateItem) {
  const nominal = parseSheetNumber(item.Nominal, 1) || 1;
  const rate = parseSheetNumber(item.Rate);

  return round2(rate / nominal);
}

async function fetchCbuRates(): Promise<CbuRateItem[]> {
  const response = await fetch(CBU_API_URL, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error("Не удалось получить курсы CBU.");
  }

  return (await response.json()) as CbuRateItem[];
}

export async function getLiveExchangeRates(): Promise<LiveExchangeRates> {
  try {
    const data = await fetchCbuRates();
    const usd = data.find((item) => item.Ccy === "USD");
    const cny = data.find((item) => item.Ccy === "CNY");

    if (!usd || !cny) {
      throw new Error("Курсы USD или CNY не найдены в ответе CBU.");
    }

    const usdToUzsRate = parseCbuRate(usd);
    const cnyToUzsRate = parseCbuRate(cny);

    if (usdToUzsRate <= 0 || cnyToUzsRate <= 0) {
      throw new Error("Некорректные курсы CBU.");
    }

    const usdToCnyRate = round2(cnyToUzsRate / usdToUzsRate);

    return {
      usdToUzsRate,
      cnyToUzsRate,
      usdToCnyRate,
      rateDate: cny.Date || usd.Date,
      source: "cbu.uz",
    };
  } catch {
    return {
      usdToUzsRate: DEFAULT_SETTINGS.usdToUzsRate,
      cnyToUzsRate: round2(DEFAULT_SETTINGS.usdToUzsRate * DEFAULT_SETTINGS.usdToCnyRate),
      usdToCnyRate: DEFAULT_SETTINGS.usdToCnyRate,
      rateDate: "",
      source: "cbu.uz",
    };
  }
}

/** @deprecated Используйте getLiveExchangeRates */
export async function fetchUsdToUzsRate() {
  const rates = await getLiveExchangeRates();
  return rates.usdToUzsRate;
}

export async function getRatesSnapshot(overrideUsdToCny?: number) {
  const live = await getLiveExchangeRates();

  return {
    usdToUzsRate: live.usdToUzsRate,
    usdToCnyRate: overrideUsdToCny ?? live.usdToCnyRate,
    cnyToUzsRate: live.cnyToUzsRate,
    rateDate: live.rateDate,
  };
}

/** Записать актуальные курсы CBU в лист settings (для Google Таблицы) */
export async function syncLiveRatesToSheet() {
  const live = await getLiveExchangeRates();
  const updatedAt = new Date().toISOString();

  await Promise.all([
    upsertSetting("usdToUzsRate", String(live.usdToUzsRate)),
    upsertSetting("usdToCnyRate", String(live.usdToCnyRate)),
    upsertSetting("cnyToUzsRate", String(live.cnyToUzsRate)),
    upsertSetting("ratesUpdatedAt", live.rateDate || updatedAt),
    upsertSetting("ratesSource", live.source),
  ]);

  return live;
}
