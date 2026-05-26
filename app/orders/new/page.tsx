import { AppShell } from "@/components/app-shell";
import { OrderForm } from "@/components/order-form";
import { PageHeader } from "@/components/page-header";
import { getProducts, getSettings } from "@/lib/data";

export default async function NewOrderPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Добавить заказ" description="Выберите товар, внесите клиента и статус по платежам и логистике." />
        <OrderForm products={products.filter((product) => product.status === "active")} settings={settings} />
      </div>
    </AppShell>
  );
}
