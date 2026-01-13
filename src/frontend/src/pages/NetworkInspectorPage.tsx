import { NetworkInspector } from '@/components/features/NetworkInspector';

export function NetworkInspectorPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-none mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Network Inspector</h1>
        <p className="text-muted-foreground mt-1">
          Analyze HAR files and reverse engineer API patterns. Drag & drop a .har file to begin.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <NetworkInspector />
      </div>
    </div>
  );
}
