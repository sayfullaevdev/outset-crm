import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const settings = await getSettings();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Добавить товар"
          description="Создайте карточку товара, сразу посчитайте цену и подготовьте пост для Telegram."
        />
        <ProductForm settings={settings} />
      </div>
    </AppShell>
  );
}
