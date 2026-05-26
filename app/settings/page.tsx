import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/lib/data";

export default async function SettingsPage() {
  const settings = await getSettings();

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
