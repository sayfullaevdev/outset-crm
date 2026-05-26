import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { OrderTable } from "@/components/order-table";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getOrders, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, settings] = await Promise.all([getOrders(), getSettings()]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Заказы OUTSET"
          description="Контролируйте предоплаты, закупку, транзит, прибытие и финальные платежи."
          actions={
            <Link href="/orders/new" className={buttonVariants()}>
              Новый заказ
            </Link>
          }
        />
        <OrderTable orders={orders} settings={settings} />
      </div>
    </AppShell>
  );
}
