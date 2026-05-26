import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductCatalog } from "@/components/product-catalog";
import { buttonVariants } from "@/components/ui/button";
import { getProducts, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Каталог товаров"
          description="Все добавленные позиции с прибылью, статусом и быстрыми действиями."
          actions={
            <Link href="/products/new" className={buttonVariants()}>
              Добавить товар
            </Link>
          }
        />
        <ProductCatalog products={products} settings={settings} />
      </div>
    </AppShell>
  );
}
