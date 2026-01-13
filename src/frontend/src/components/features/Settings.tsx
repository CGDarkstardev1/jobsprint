'use client';

import { useState, type ChangeEvent } from 'react';
import { Key, Shield, Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { toast } = useToast();
  const [anthropicKey, setAnthropicKey] = useState('');
  const [stealthMode, setStealthMode] = useState(true);
  const [maxApps, setMaxApps] = useState(50);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your configuration has been updated successfully',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>Configure your API keys for AI-powered features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

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

          <div className="grid gap-4 md:grid-cols-2">
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
          </div>

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

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

          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
