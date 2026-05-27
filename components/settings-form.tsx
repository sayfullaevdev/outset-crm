"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/lib/types";

function formatRate(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
}

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    cargoRatePerKg: String(initialSettings.cargoRatePerKg),
    usdToCnyRate: String(initialSettings.usdToCnyRate),
    usdToUzsRate: String(initialSettings.usdToUzsRate),
    cnyToUzsRate: String(initialSettings.cnyToUzsRate),
    defaultMarkup: String(initialSettings.defaultMarkup),
    autoExchangeRates: initialSettings.autoExchangeRates,
    telegramBotToken: initialSettings.telegramBotToken,
    telegramChannelId: initialSettings.telegramChannelId,
    telegramOrderUsername: initialSettings.telegramOrderUsername,
    deliveryEstimate: initialSettings.deliveryEstimate,
    googleSheetId: initialSettings.googleSheetId,
  });
  const [ratesMeta, setRatesMeta] = useState({
    rateDate: initialSettings.ratesUpdatedAt,
    source: initialSettings.ratesSource || "cbu.uz",
  });

  function applyRates(data: {
    usdToUzsRate: number;
    usdToCnyRate: number;
    cnyToUzsRate: number;
    rateDate?: string;
    source?: string;
  }) {
    setForm((current) => ({
      ...current,
      usdToUzsRate: String(data.usdToUzsRate),
      usdToCnyRate: String(data.usdToCnyRate),
      cnyToUzsRate: String(data.cnyToUzsRate),
    }));
    setRatesMeta({
      rateDate: data.rateDate || ratesMeta.rateDate,
      source: data.source || ratesMeta.source,
    });
  }

  function refreshRates(syncToSheet = false) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/rates${syncToSheet ? "?sync=1" : ""}`);

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось обновить курсы.");
        }

        const data = (await response.json()) as {
          usdToUzsRate: number;
          usdToCnyRate: number;
          cnyToUzsRate: number;
          rateDate?: string;
          source?: string;
        };

        applyRates(data);
        toast.success(syncToSheet ? "Курсы CBU обновлены и записаны в таблицу." : "Курсы CBU обновлены.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка обновления курсов.");
      }
    });
  }

  useEffect(() => {
    if (initialSettings.autoExchangeRates) {
      refreshRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveSettings() {
    startTransition(async () => {
      try {
        const payload = {
          ...form,
          autoExchangeRates: form.autoExchangeRates ? "true" : "false",
        };

        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось сохранить настройки.");
        }

        if (form.autoExchangeRates) {
          await fetch("/api/rates?sync=1");
        }

        toast.success("Настройки сохранены.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения настроек.");
      }
    });
  }

  const ratesReadOnly = form.autoExchangeRates;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Курсы валют</CardTitle>
          <CardDescription>
            По умолчанию курсы берутся с официального API ЦБ Узбекистана (cbu.uz) и обновляются каждый час.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.autoExchangeRates}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  autoExchangeRates: event.target.checked,
                }))
              }
            />
            <div className="space-y-1 text-sm">
              <div className="font-medium">Автоматические курсы CBU</div>
              <div className="text-muted-foreground">
                Юань и сум подставляются в калькулятор, каталог и заказы без ручного ввода.
              </div>
            </div>
          </label>

          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <div>
              1 USD = <span className="font-medium text-foreground">{formatRate(Number(form.usdToUzsRate))}</span>{" "}
              сум
            </div>
            <div className="mt-1">
              1 CNY = <span className="font-medium text-foreground">{formatRate(Number(form.cnyToUzsRate))}</span>{" "}
              сум
            </div>
            {ratesMeta.rateDate ? (
              <div className="mt-2 text-muted-foreground">
                Дата курса CBU: {ratesMeta.rateDate}
                {ratesMeta.source ? ` · ${ratesMeta.source}` : ""}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnyToUzsRate">1 юань в сумах (CBU)</Label>
              <Input
                id="cnyToUzsRate"
                type="number"
                readOnly={ratesReadOnly}
                value={form.cnyToUzsRate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cnyToUzsRate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usdToUzsRate">1 доллар в сумах (CBU)</Label>
              <Input
                id="usdToUzsRate"
                type="number"
                readOnly={ratesReadOnly}
                value={form.usdToUzsRate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usdToUzsRate: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="usdToCnyRate">Коэффициент CNY→USD (для формулы)</Label>
              <Input
                id="usdToCnyRate"
                type="number"
                step="0.0001"
                readOnly={ratesReadOnly}
                value={form.usdToCnyRate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, usdToCnyRate: event.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Считается автоматически: курс юаня ÷ курс доллара.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => refreshRates(true)} disabled={isPending}>
              Обновить сейчас
            </Button>
            {form.autoExchangeRates ? (
              <span className="self-center text-xs text-muted-foreground">
                При сохранении товара используется актуальный курс CBU.
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Финансовые настройки</CardTitle>
          <CardDescription>Карго и стандартная наценка для новых товаров.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cargoRatePerKg">Карго за кг (базовый тариф)</Label>
            <Input
              id="cargoRatePerKg"
              type="number"
              value={form.cargoRatePerKg}
              onChange={(event) =>
                setForm((current) => ({ ...current, cargoRatePerKg: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultMarkup">Стандартная наценка</Label>
            <Input
              id="defaultMarkup"
              type="number"
              value={form.defaultMarkup}
              onChange={(event) =>
                setForm((current) => ({ ...current, defaultMarkup: event.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Интеграции</CardTitle>
          <CardDescription>Данные для Telegram и Google Sheets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="telegramBotToken">Telegram Bot Token</Label>
            <Input
              id="telegramBotToken"
              value={form.telegramBotToken}
              onChange={(event) =>
                setForm((current) => ({ ...current, telegramBotToken: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegramChannelId">Telegram Channel ID</Label>
            <Input
              id="telegramChannelId"
              value={form.telegramChannelId}
              onChange={(event) =>
                setForm((current) => ({ ...current, telegramChannelId: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegramOrderUsername">Username для заказа</Label>
            <Input
              id="telegramOrderUsername"
              placeholder="@OutsetAdmin"
              value={form.telegramOrderUsername}
              onChange={(event) =>
                setForm((current) => ({ ...current, telegramOrderUsername: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryEstimate">Срок доставки по умолчанию</Label>
            <Input
              id="deliveryEstimate"
              placeholder="7-14 дней"
              value={form.deliveryEstimate}
              onChange={(event) =>
                setForm((current) => ({ ...current, deliveryEstimate: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googleSheetId">Google Sheet ID</Label>
            <Input
              id="googleSheetId"
              value={form.googleSheetId}
              onChange={(event) =>
                setForm((current) => ({ ...current, googleSheetId: event.target.value }))
              }
            />
          </div>
          <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
            Email сервисного аккаунта и private key задаются через переменные окружения
            `GOOGLE_SERVICE_ACCOUNT_EMAIL` и `GOOGLE_PRIVATE_KEY`.
          </div>
        </CardContent>
      </Card>

      <Button type="button" onClick={saveSettings} disabled={isPending}>
        {isPending ? "Сохраняем..." : "Сохранить настройки"}
      </Button>
    </div>
  );
}
