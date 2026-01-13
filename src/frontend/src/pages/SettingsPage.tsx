import { SettingsPage as SettingsForm } from '@/components/features/Settings';
// Note: dynamic import removed to support non-Next environment
let FileBrowser: any;
(async () => {
  try {
    const mod = await import('@/components/features/FileBrowser');
    FileBrowser = mod.FileBrowser;
  } catch (e: any) {
    console.warn('FileBrowser not available:', e?.message || e);
    FileBrowser = () => null;
  }
})();

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
      <div className="mt-6">
        <h2 className="text-2xl font-semibold">Documents & Defaults</h2>
        <p className="text-sm text-muted-foreground">
          Manage your resumes, cover letters, and cloud connectors
        </p>
        <div className="mt-4">
          {/* @ts-ignore */}
          <FileBrowser />
        </div>
      </div>
    </div>
  );
}
