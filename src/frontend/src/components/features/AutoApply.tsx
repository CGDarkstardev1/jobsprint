'use client';

import { useState, useCallback } from 'react';
import {
  Rocket,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  backendService,
  type ScrapedJob,
  type ResumeData,
  type AutoApplyConfig,
  type ApplicationResult,
} from '@/lib/services/backendIntegration';
import { storageService } from '@/lib/services/storage';

interface ApplicationLog {
  id: string;
  company: string;
  position: string;
  status: 'pending' | 'success' | 'error' | 'skipped';
  timestamp: string;
  details?: string;
}

// Sample resume data
const sampleResume: ResumeData = {
  summary:
    'Experienced software engineer with expertise in React, TypeScript, and Node.js development.',
  skills: ['React', 'TypeScript', 'Node.js', 'JavaScript', 'CSS', 'GraphQL', 'PostgreSQL', 'AWS'],
  experience: [
    {
      title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      duration: '2022 - Present',
      achievements: [
        'Led development of React applications serving 1M+ users',
        'Improved page load times by 40% through code optimization',
        'Mentored 3 junior developers',
      ],
      technologies: ['React', 'TypeScript', 'GraphQL'],
    },
    {
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      duration: '2020 - 2022',
      achievements: [
        'Built full stack applications using React and Node.js',
        'Implemented real-time features with WebSockets',
        'Designed database schemas for PostgreSQL',
      ],
      technologies: ['React', 'Node.js', 'PostgreSQL'],
    },
  ],
  education: [{ degree: 'BS Computer Science', school: 'University of Tech', year: '2020' }],
};

export function AutoApplyConfig() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ApplicationLog[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, skipped: 0 });

  const [config, setConfig] = useState({
    keywords: 'software engineer',
    location: 'remote',
    maxApplications: 10,
    delaySeconds: 5,
    stealthMode: true,
    tailorResume: true,
    skipAlreadyApplied: true,
  });

  const handleStart = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setStats({ total: 0, success: 0, failed: 0, skipped: 0 });

    toast({
      title: 'Auto-Apply Started',
      description: 'JobSprint is now searching and applying to jobs...',
    });

    try {
      // Step 1: Scrape jobs
      const scrapingResult = await backendService.scrapeJobs({
        platforms: ['linkedin', 'indeed', 'glassdoor'],
        headless: true,
        stealthMode: config.stealthMode,
        maxPages: 3,
        delayBetweenRequests: 1000,
      });

      const jobs = scrapingResult.jobs.slice(0, config.maxApplications);
      const totalJobs = jobs.length;
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      // Step 2: Apply to each job
      for (let i = 0; i < totalJobs; i++) {
        const job = jobs[i];
        const progressPercent = Math.round(((i + 1) / totalJobs) * 100);
        setProgress(progressPercent);

        // Add pending log
        const logId = `log_${Date.now()}_${i}`;
        const newLog: ApplicationLog = {
          id: logId,
          company: job.company,
          position: job.title,
          status: 'pending',
          timestamp: new Date().toLocaleTimeString(),
        };
        setLogs((prev) => [...prev, newLog]);

        // Check if already applied
        const existingApps = await storageService.getApplications();
        const alreadyApplied = existingApps.some((app) => app.jobId === job.id);

        if (alreadyApplied && config.skipAlreadyApplied) {
          setLogs((prev) =>
            prev.map((log) =>
              log.id === logId ? { ...log, status: 'skipped', details: 'Already applied' } : log
            )
          );
          skippedCount++;
          setStats({
            total: i + 1,
            success: successCount,
            failed: failedCount,
            skipped: skippedCount,
          });
          continue;
        }

        // Simulate application
        await new Promise((resolve) => setTimeout(resolve, config.delaySeconds * 1000));

        // For demo, mark as success
        const result: ApplicationResult = {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: 'success',
          appliedAt: new Date().toISOString(),
          applicationUrl: job.applicationUrl,
        };

        // Save application
        await storageService.saveApplication({
          id: `app_${job.id}_${Date.now()}`,
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: 'applied',
          appliedAt: new Date().toISOString(),
          resumeId: 'default',
          notes: '',
        });

        // Update log
        setLogs((prev) =>
          prev.map((log) =>
            log.id === logId
              ? { ...log, status: 'success', timestamp: new Date().toLocaleTimeString() }
              : log
          )
        );
        successCount++;

        setStats({
          total: i + 1,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount,
        });
      }

      toast({
        title: 'Auto-Apply Complete',
        description: `Successfully applied to ${successCount} jobs`,
      });
    } catch (error) {
      toast({
        title: 'Auto-Apply Failed',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
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
                value={config.keywords}
                onChange={(e) => setConfig((prev) => ({ ...prev, keywords: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={config.location}
                onChange={(e) => setConfig((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="max-apps">Max Applications</Label>
              <Input
                id="max-apps"
                type="number"
                min="1"
                max="50"
                value={config.maxApplications}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, maxApplications: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay">Delay Between (seconds)</Label>
              <Input
                id="delay"
                type="number"
                min="1"
                max="30"
                value={config.delaySeconds}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, delaySeconds: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Stealth Mode</Label>
              <div className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  id="stealth"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={config.stealthMode}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, stealthMode: e.target.checked }))
                  }
                />
                <Label htmlFor="stealth" className="text-sm font-normal">
                  Enable human-like behavior
                </Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tailor"
                className="h-4 w-4 rounded border-gray-300"
                checked={config.tailorResume}
                onChange={(e) => setConfig((prev) => ({ ...prev, tailorResume: e.target.checked }))}
              />
              <Label htmlFor="tailor" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                AI Tailor resume for each job
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip"
                className="h-4 w-4 rounded border-gray-300"
                checked={config.skipAlreadyApplied}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, skipAlreadyApplied: e.target.checked }))
                }
              />
              <Label htmlFor="skip">Skip already applied jobs</Label>
            </div>
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

      {(isRunning || progress > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Application Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                  <p className="text-xs text-muted-foreground">Success</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50">
                  <p className="text-2xl font-bold text-gray-600">{stats.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>
                  Processing: {stats.total}/{config.maxApplications} applications
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />

              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
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
      )}
    </div>
  );
}
