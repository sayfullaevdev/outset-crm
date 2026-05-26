import { AppShell } from "@/components/app-shell";
import { MonthlyPerformanceChart } from "@/components/monthly-performance-chart";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrders, getSettings } from "@/lib/data";
import { convertUsdToUzs, formatUzs } from "@/lib/utils";

function monthKey(dateString: string) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AnalyticsPage() {
  const [orders, settings] = await Promise.all([getOrders(), getSettings()]);

  const monthlyMap = new Map<string, { revenue: number; profit: number }>();
  orders.forEach((order) => {
    const key = monthKey(order.finalPaymentDate || order.createdAt);
    const current = monthlyMap.get(key) ?? { revenue: 0, profit: 0 };
    current.revenue += order.salePriceUzs;
    current.profit += convertUsdToUzs(order.profitUsd, settings.usdToUzsRate);
    monthlyMap.set(key, current);
  });

  const monthlyData = [...monthlyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      revenue: Number(values.revenue.toFixed(2)),
      profit: Number(values.profit.toFixed(2)),
    }));

  const topProducts = [...orders.reduce((acc, order) => {
    acc.set(
      order.productName,
      (acc.get(order.productName) ?? 0) + convertUsdToUzs(order.profitUsd, settings.usdToUzsRate),
    );
    return acc;
  }, new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const averageOrderValue = orders.length
    ? orders.reduce((sum, order) => sum + order.salePriceUzs, 0) / orders.length
    : 0;

  const inTransitOrders = orders.filter((order) => order.inTransit);
  const inTransitWeight = inTransitOrders.reduce((sum, order) => sum + order.weightKg, 0);
  const expectedCargoCost = inTransitWeight * settings.cargoRatePerKg * settings.usdToUzsRate;

  const pendingClients = orders.filter((order) => !order.finalPaymentReceived);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Аналитика" description="Выручка, прибыль, средний чек и ожидаемые платежи." />

        <MonthlyPerformanceChart data={monthlyData} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Топ 5 товаров по прибыли</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {topProducts.length ? (
                topProducts.map(([name, profit]) => (
                  <div key={name} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <span>{name}</span>
                    <span className="font-medium">{formatUzs(profit)}</span>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">Пока недостаточно данных.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Сводка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">Средний чек: {formatUzs(averageOrderValue)}</div>
              <div className="rounded-lg border p-3">
                В пути: {inTransitWeight.toFixed(2)} кг / ожидаемое карго {formatUzs(expectedCargoCost)}
              </div>
              <div className="rounded-lg border p-3">Клиентов с неоплаченным остатком: {pendingClients.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Клиенты с ожидаемой оплатой</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {pendingClients.length ? (
              pendingClients.map((order) => (
                <div key={order.id} className="rounded-lg border p-3">
                  <div className="font-medium">{order.clientName}</div>
                  <div className="text-muted-foreground">
                    {order.productName} • остаток {formatUzs(order.salePriceUzs / 2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">Нет клиентов с ожидаемой оплатой.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
