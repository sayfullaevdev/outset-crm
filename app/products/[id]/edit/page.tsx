import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/product-form";
import { getProductById, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: {
    id: string;
  };
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [product, settings] = await Promise.all([getProductById(params.id), getSettings()]);

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Редактирование товара" description="Обновите цену, статус, фото и параметры публикации." />
        <ProductForm initialProduct={product} settings={settings} />
      </div>
    </AppShell>
  );
}
