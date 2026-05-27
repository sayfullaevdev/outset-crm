import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { syncLiveRatesToSheet } from "@/lib/currency";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  if (settings.autoExchangeRates) {
    try {
      await syncLiveRatesToSheet();
    } catch {
      // Не блокируем страницу, если Sheets недоступен
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Настройки"
          description="Управляйте курсами, карго, Telegram и параметрами Google Sheets."
        />
        <SettingsForm initialSettings={settings} />
      </div>
    </AppShell>
  );
}
