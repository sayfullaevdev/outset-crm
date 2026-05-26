"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Settings } from "@/lib/types";

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    cargoRatePerKg: String(initialSettings.cargoRatePerKg),
    usdToCnyRate: String(initialSettings.usdToCnyRate),
    usdToUzsRate: String(initialSettings.usdToUzsRate),
    defaultMarkup: String(initialSettings.defaultMarkup),
    telegramBotToken: initialSettings.telegramBotToken,
    telegramChannelId: initialSettings.telegramChannelId,
    telegramOrderUsername: initialSettings.telegramOrderUsername,
    deliveryEstimate: initialSettings.deliveryEstimate,
    googleSheetId: initialSettings.googleSheetId,
  });

  function saveSettings() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось сохранить настройки.");
        }

        toast.success("Настройки сохранены.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения настроек.");
      }
    });
  }

  function refreshRates() {
    startTransition(async () => {
      try {
        const response = await fetch("/api/rates");

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Не удалось обновить курсы.");
        }

        const data = (await response.json()) as { usdToUzsRate: number; usdToCnyRate: number };
        setForm((current) => ({
          ...current,
          usdToUzsRate: String(data.usdToUzsRate),
          usdToCnyRate: String(data.usdToCnyRate),
        }));
        toast.success("Курсы обновлены.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка обновления курсов.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Финансовые настройки</CardTitle>
          <CardDescription>Изменяйте карго, курсы для расчета и стандартную наценку.</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="usdToCnyRate">Курс юаня для расчета</Label>
            <Input
              id="usdToCnyRate"
              type="number"
              value={form.usdToCnyRate}
              onChange={(event) =>
                setForm((current) => ({ ...current, usdToCnyRate: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="usdToUzsRate">Курс перевода в сум</Label>
            <Input
              id="usdToUzsRate"
              type="number"
              value={form.usdToUzsRate}
              onChange={(event) =>
                setForm((current) => ({ ...current, usdToUzsRate: event.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Button type="button" variant="outline" onClick={refreshRates} disabled={isPending}>
              Обновить курс из CBU
            </Button>
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
              placeholder="@vornuzz"
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
