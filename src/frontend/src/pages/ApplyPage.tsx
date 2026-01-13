import { AutoApplyConfig } from '@/components/features/AutoApply';

export function ApplyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto-Apply</h1>
        <p className="text-muted-foreground mt-1">
          Configure automated job applications with AI-powered resume tailoring
        </p>
      </div>

      <AutoApplyConfig />
    </div>
  );
}
