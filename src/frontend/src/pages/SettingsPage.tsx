import { SettingsPage as SettingsForm } from '@/components/features/Settings';

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your JobSprint preferences and API keys
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}
