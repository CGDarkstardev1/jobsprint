'use client';

import { useState, useEffect } from 'react';
import { Play, Square, MousePointer, Save, Eye, EyeOff, LayoutTemplate, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface RecordedAction {
  type: 'click' | 'input' | 'navigation';
  selector: string;
  value?: string;
  timestamp: number;
  url: string;
}

export function ActionRecorder() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [actions, setActions] = useState<RecordedAction[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Recording logic
  useEffect(() => {
    if (!isRecording) return;

    const handleClick = (e: MouseEvent) => {
      // Don't record clicks on the recorder itself
      if ((e.target as HTMLElement).closest('#action-recorder-overlay')) return;

      const target = e.target as HTMLElement;
      const selector = generateSelector(target);

      setActions(prev => [...prev, {
        type: 'click',
        selector,
        timestamp: Date.now(),
        url: window.location.pathname
      }]);
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const selector = generateSelector(target);

      setActions(prev => {
        // Debounce input recording - update last action if it matches selector
        const last = prev[prev.length - 1];
        if (last && last.type === 'input' && last.selector === selector) {
          const newActions = [...prev];
          newActions[prev.length - 1] = {
            ...last,
            value: target.value,
            timestamp: Date.now()
          };
          return newActions;
        }
        return [...prev, {
          type: 'input',
          selector,
          value: target.value,
          timestamp: Date.now(),
          url: window.location.pathname
        }];
      });
    };

    window.addEventListener('click', handleClick, true);
    window.addEventListener('input', handleInput, true);

    return () => {
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('input', handleInput, true);
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: `Captured ${actions.length} actions. Ready to export.`
      });
    } else {
      setActions([]);
      setRecordingTime(0);
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Interact with the page naturally. Actions will be captured."
      });
    }
  };

  const exportScript = () => {
    const script = generatePlaywrightScript(actions);
    const blob = new Blob([script], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'automation-script.spec.ts';
    a.click();
    toast({
      title: "Script Exported",
      description: "Playwright automation script downloaded."
    });
  };

  if (!isExpanded) {
    return (
      <Button
        id="action-recorder-overlay"
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 z-[9999] rounded-full shadow-lg h-12 w-12"
        onClick={() => setIsExpanded(true)}
      >
        {isRecording ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        ) : (
          <Activity className="h-6 w-6" />
        )}
      </Button>
    );
  }

  return (
    <Card 
      id="action-recorder-overlay"
      className="fixed bottom-4 right-4 z-[9999] w-80 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-5"
    >
      <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-muted/50">
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
          <CardTitle className="text-sm font-bold">
            {isRecording ? 'Recording...' : 'Workflow Recorder'}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {isRecording && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5 animate-pulse">
              {formatTime(recordingTime)}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsExpanded(false)}>
            <EyeOff className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {isRecording ? (
          <div className="space-y-4">
            <div className="p-3 bg-background border rounded-md text-xs font-mono h-32 overflow-y-auto space-y-1">
              {actions.length === 0 ? (
                <span className="text-muted-foreground italic">Waiting for interactions...</span>
              ) : (
                actions.map((action, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-blue-500 font-bold">[{action.type.toUpperCase()}]</span>
                    <span className="truncate flex-1" title={action.selector}>{formatSelector(action.selector)}</span>
                  </div>
                ))
              )}
              {/* Auto-scroll anchor */}
              <div id="recorder-bottom" ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
            </div>
            <Button 
              variant="destructive" 
              className="w-full gap-2" 
              onClick={toggleRecording}
            >
              <Square className="h-4 w-4 fill-current" />
              Stop Recording
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{actions.length} actions captured</span>
              <span>{formatTime(recordingTime)} duration</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={actions.length > 0 ? "outline" : "default"} 
                className="w-full gap-2" 
                onClick={toggleRecording}
              >
                {actions.length > 0 ? <LayoutTemplate className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                {actions.length > 0 ? "New Recording" : "Start Recording"}
              </Button>
              
              <Button 
                variant="default" 
                className="w-full gap-2" 
                onClick={exportScript}
                disabled={actions.length === 0}
              >
                <Save className="h-4 w-4" />
                Export Script
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helpers
function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSelector(selector: string) {
  if (selector.includes('id=')) return '#' + selector.split("'")[1];
  return selector.length > 20 ? selector.slice(0, 20) + '...' : selector;
}

function generateSelector(el: HTMLElement): string {
  if (el.id) return `//*[@id='${el.id}']`;
  if (el.getAttribute('data-testid')) return `//*[@data-testid='${el.getAttribute('data-testid')}']`;
  
  // Basic path generation
  let path = [];
  let current = el;
  while (current && current.nodeName !== 'BODY') {
    let selector = current.nodeName.toLowerCase();
    if (current.className) {
      selector += `.${Array.from(current.classList).join('.')}`;
    }
    path.unshift(selector);
    current = current.parentElement as HTMLElement;
  }
  return path.join(' > ');
}

function generatePlaywrightScript(actions: RecordedAction[]): string {
  return `import { test, expect } from '@playwright/test';

test('recorded workflow', async ({ page }) => {
  // Start session
  await page.goto('${window.location.origin}${actions[0]?.url || '/'}');

  ${actions.map(action => {
    switch(action.type) {
      case 'click':
        return `await page.locator("${action.selector}").click();`;
      case 'input':
        return `await page.locator("${action.selector}").fill("${action.value}");`;
      case 'navigation':
        return `await page.goto("${action.url}");`;
      default:
        return '';
    }
  }).join('\n  ')}
});`;
}
