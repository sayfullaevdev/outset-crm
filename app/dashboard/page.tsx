import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { WeeklyOrdersChart } from "@/components/weekly-orders-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrders, getSettings } from "@/lib/data";
import { convertUsdToUzs, formatUzs } from "@/lib/utils";

function getWeekBucket(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays > 27) {
    return null;
  }

  return 4 - Math.floor(diffDays / 7);
}

export default async function DashboardPage() {
  const [orders, settings] = await Promise.all([getOrders(), getSettings()]);
  const now = new Date();

  const activeOrders = orders.filter((order) => order.status !== "completed");
  const expectedProfit = activeOrders.reduce(
    (sum, order) => sum + convertUsdToUzs(order.profitUsd, settings.usdToUzsRate),
    0,
  );
  const clientsStillOwe = orders
    .filter((order) => order.prepaymentReceived && !order.finalPaymentReceived)
    .reduce((sum, order) => sum + order.salePriceUzs / 2, 0);
  const monthlyProfit = orders
    .filter((order) => {
      if (!order.finalPaymentReceived || !order.finalPaymentDate) {
        return false;
      }

      const paidDate = new Date(order.finalPaymentDate);
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, order) => sum + convertUsdToUzs(order.profitUsd, settings.usdToUzsRate), 0);

  const chartData = [
    { week: "4 нед. назад", count: 0 },
    { week: "3 нед. назад", count: 0 },
    { week: "2 нед. назад", count: 0 },
    { week: "Текущая", count: 0 },
  ].map((bucket, index) => ({
    ...bucket,
    count: orders.filter((order) => getWeekBucket(order.createdAt) === index + 1).length,
  }));

  const cards = [
    {
      label: "Активные заказы",
      value: String(activeOrders.length),
    },
    {
      label: "Ожидаемая прибыль",
      value: formatUzs(expectedProfit),
    },
    {
      label: "Клиенты еще должны",
      value: formatUzs(clientsStillOwe),
    },
    {
      label: "Прибыль за месяц",
      value: formatUzs(monthlyProfit),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Дашборд"
          description="Главные показатели по заказам, прибыли и текущей загрузке."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <WeeklyOrdersChart data={chartData} />
      </div>
    </AppShell>
  );
}
