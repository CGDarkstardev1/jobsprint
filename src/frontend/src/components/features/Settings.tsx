'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Key, Shield, Bell, Save, Cloud, Download, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AuthPanel, CloudSyncStatus } from '@/components/features/Auth';
import { puterCloudService } from '@/lib/services/cloudSync';
import { storageService } from '@/lib/services/storage';

export function SettingsPage() {
  const { toast } = useToast();
  const [anthropicKey, setAnthropicKey] = useState('');
  const [stealthMode, setStealthMode] = useState(true);
  const [maxApps, setMaxApps] = useState(50);
  const [notifications, setNotifications] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your configuration has been updated successfully',
    });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await puterCloudService.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobsprint-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: 'Your data has been downloaded',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await puterCloudService.importData(data);

      toast({
        title: 'Import Complete',
        description: 'Your data has been restored',
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Invalid backup file',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      const [applications, savedJobs, resumes, settings] = await Promise.all([
        storageService.getApplications(),
        storageService.getSavedJobs(),
        storageService.getResumes(),
        Promise.resolve(storageService.getSettings()),
      ]);

      await puterCloudService.fullSync({
        applications,
        savedJobs,
        resumes,
        settings,
      });

      toast({
        title: 'Sync Complete',
        description: 'Your data has been synced to the cloud',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your JobSprint preferences and cloud sync
          </p>
        </div>
        <CloudSyncStatus />
      </div>

      {/* Cloud Sync Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <AuthPanel />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Cloud Sync
            </CardTitle>
            <CardDescription>Backup and sync your data across devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={handleSyncNow}
                disabled={!puterCloudService.isAuthenticated()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </Button>

              <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full" disabled={isImporting}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>Configure your API keys for AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-api03-..."
                value={anthropicKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAnthropicKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for AI resume tailoring and cover letter generation
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key (Optional)</Label>
              <Input id="openai-key" type="password" placeholder="sk-..." />
              <p className="text-xs text-muted-foreground">
                Alternative AI provider for advanced features
              </p>
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Automation Settings
          </CardTitle>
          <CardDescription>Configure how JobSprint automates your job search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Stealth Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable human-like behavior to avoid detection
              </p>
            </div>
            <input
              type="checkbox"
              checked={stealthMode}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStealthMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="max-apps">Max Applications Per Day</Label>
              <Input
                id="max-apps"
                type="number"
                min="1"
                max="100"
                value={maxApps}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxApps(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay">Application Delay (seconds)</Label>
              <Input id="delay" type="number" min="1" max="30" defaultValue="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retry">Max Retry Attempts</Label>
              <Input id="retry" type="number" min="1" max="10" defaultValue="3" />
            </div>
          </div>

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your applications
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show browser notifications for important events
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Application Status Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when application status changes
              </p>
            </div>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
          </div>

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export, import, or delete your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="w-full" disabled={isImporting}>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
