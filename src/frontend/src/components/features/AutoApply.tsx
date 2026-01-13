'use client';

import { useState } from 'react';
import { Rocket, Play, Square, CheckCircle2, XCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ApplicationLog {
  id: number;
  company: string;
  position: string;
  status: 'pending' | 'success' | 'error' | 'skipped';
  timestamp: string;
  details?: string;
}

export function AutoApplyConfig() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ApplicationLog[]>([]);

  const mockLogs: ApplicationLog[] = [
    {
      id: 1,
      company: 'TechCorp Inc.',
      position: 'Senior Frontend Developer',
      status: 'success',
      timestamp: '2:30 PM',
    },
    {
      id: 2,
      company: 'StartupXYZ',
      position: 'Full Stack Engineer',
      status: 'success',
      timestamp: '2:32 PM',
    },
    {
      id: 3,
      company: 'DesignHub',
      position: 'UI Engineer',
      status: 'pending',
      timestamp: '2:34 PM',
    },
    {
      id: 4,
      company: 'BigTech Co.',
      position: 'React Developer',
      status: 'skipped',
      timestamp: '2:35 PM',
      details: 'Already applied',
    },
    {
      id: 5,
      company: 'CloudCorp',
      position: 'Frontend Architect',
      status: 'error',
      timestamp: '2:36 PM',
      details: 'Login required',
    },
  ];

  const handleStart = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);

    toast({
      title: 'Auto-Apply Started',
      description: 'JobSprint is now searching and applying to jobs...',
    });

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(i);
      if (i > 20 && i <= 90) {
        setLogs(mockLogs.slice(0, Math.floor(i / 20)));
      }
    }

    setIsRunning(false);
    toast({
      title: 'Auto-Apply Complete',
      description: 'Applied to 8 jobs successfully',
    });
  };

  const handleStop = () => {
    setIsRunning(false);
    toast({
      title: 'Auto-Apply Stopped',
      description: 'Application process has been halted',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Auto-Apply Configuration
          </CardTitle>
          <CardDescription>
            Configure your automated job application workflow with AI-powered resume tailoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="keywords">Job Keywords</Label>
              <Input
                id="keywords"
                placeholder="e.g., Senior Software Engineer"
                defaultValue="software engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., San Francisco, CA" defaultValue="remote" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="max-apps">Max Applications</Label>
              <Input id="max-apps" type="number" min="1" max="50" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay">Delay Between (seconds)</Label>
              <Input id="delay" type="number" min="1" max="30" defaultValue="5" />
            </div>
            <div className="space-y-2">
              <Label>Stealth Mode</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id="stealth"
                  className="h-4 w-4 rounded border-gray-300"
                  defaultChecked
                />
                <Label htmlFor="stealth" className="text-sm font-normal">
                  Enable human-like behavior
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="tailor"
              className="h-4 w-4 rounded border-gray-300"
              defaultChecked
            />
            <Label htmlFor="tailor">AI Tailor resume for each job</Label>
          </div>

          <div className="flex gap-2 mt-6">
            {isRunning ? (
              <Button onClick={handleStop} variant="destructive">
                <Square className="mr-2 h-4 w-4" />
                Stop Applications
              </Button>
            ) : (
              <Button onClick={handleStart}>
                <Play className="mr-2 h-4 w-4" />
                Start Auto-Apply
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isRunning || progress > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Application Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Processing: 8/10 applications</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />

              <div className="mt-4 space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-3 text-sm',
                      log.status === 'success' && 'bg-green-50',
                      log.status === 'error' && 'bg-red-50',
                      log.status === 'pending' && 'bg-yellow-50',
                      log.status === 'skipped' && 'bg-gray-50'
                    )}
                  >
                    {log.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {log.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                    {log.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {log.status === 'skipped' && <AlertCircle className="h-4 w-4 text-gray-600" />}
                    <div className="flex-1">
                      <span className="font-medium">{log.position}</span>
                      <span className="text-muted-foreground"> at {log.company}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    {log.details && (
                      <span className="text-xs text-muted-foreground">({log.details})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
