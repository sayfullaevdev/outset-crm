export const PRODUCT_CATEGORIES = [
  "t-shirt",
  "dress",
  "jeans",
  "hoodie",
  "jacket",
  "coat",
  "other",
] as const;

export const CATEGORY_LABELS: Record<(typeof PRODUCT_CATEGORIES)[number], string> = {
  "t-shirt": "Футболка",
  dress: "Платье",
  jeans: "Джинсы",
  hoodie: "Худи",
  jacket: "Куртка",
  coat: "Пальто",
  other: "Другое",
};

export const DEFAULT_CATEGORY_WEIGHTS: Record<(typeof PRODUCT_CATEGORIES)[number], number> = {
  "t-shirt": 0.3,
  dress: 0.5,
  jeans: 0.7,
  hoodie: 0.8,
  jacket: 1.1,
  coat: 1.4,
  other: 0.6,
};

export const ORDER_STATUSES = [
  "awaiting_prepayment",
  "prepayment_received",
  "ordered",
  "in_transit",
  "arrived",
  "completed",
] as const;

export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  awaiting_prepayment: "Ждет предоплату",
  prepayment_received: "Предоплата получена",
  ordered: "Заказано",
  in_transit: "В пути",
  arrived: "Прибыло",
  completed: "Завершено",
};

export const DEFAULT_SETTINGS = {
  // Тариф карго в суммах за 100г.
  // Вес(кг) * 10 = количество "100г".
  cargoRatePerKg: 0,
  usdToCnyRate: 0.14,
  usdToUzsRate: 12800,
  defaultMarkup: 2.3,
  telegramOrderUsername: "@OutsetAdmin",
  deliveryEstimate: "7-14 дней",
};
