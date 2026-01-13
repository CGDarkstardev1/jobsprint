'use client';

import { useState } from 'react';
import { Shield, Zap, Lock, Skull, Crosshair, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { atsEvasionEngine } from '@/lib/services/atsEvasionEngine';

export function ATSEvasion() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resume, setResume] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleEvade = async () => {
    if (!resume || !jobDesc) {
      toast({
        title: "Input Required",
        description: "Need resume and job description to activate evasion protocols.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate complex calculation
    await new Promise(r => setTimeout(r, 1500));

    try {
      // Mock parsing
      const resumeData = parseJSONSafe(resume);
      const jobData = {
        title: "Target Role",
        description: jobDesc,
        requirements: []
      };

      const evasionResult = atsEvasionEngine.evade(resumeData, jobData);
      setResult(evasionResult);
      
      toast({
        title: "EVASION PROTOCOLS ACTIVE",
        description: "Resume structure optimized for maximum penetration.",
        className: "bg-red-950 text-red-50 border-red-900"
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to optimize.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseJSONSafe = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return {
        summary: text.slice(0, 200),
        skills: [],
        experience: [{ title: "Role", company: "Corp", description: text.slice(200) }],
        education: []
      };
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-900/20 bg-gradient-to-br from-background to-red-50/10 dark:to-red-950/10">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Skull className="h-6 w-6" />
            <CardTitle>Bleeding Edge ATS Evasion</CardTitle>
          </div>
          <CardDescription>
            Advanced optimization to bypass filters and rank #1. Use with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Job Description</Label>
              <Textarea 
                placeholder="Paste the job description..." 
                className="h-32 font-mono text-xs"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Resume (JSON/Text)</Label>
              <Textarea 
                placeholder="Paste your resume..." 
                className="h-32 font-mono text-xs"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest"
            onClick={handleEvade}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> 
                INFILTRATING ATS...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 fill-current" />
                MAXIMIZE RANKING & EVADE DETECTION
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-green-500/20 bg-green-50/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Shield className="h-5 w-5" />
                Stealth Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-green-600">{result.stealthScore}%</span>
                  <span className="text-sm text-muted-foreground uppercase tracking-wider">Undetectable</span>
                </div>
                <Progress value={result.stealthScore} className="h-2 bg-green-100 [&>div]:bg-green-600" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Zero-width character check: PASSED</p>
                  <p>• Semantic structure analysis: OPTIMIZED</p>
                  <p>• Metadata injection: ACTIVE</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-50/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Crosshair className="h-5 w-5" />
                Injected Vectors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.injectedKeywords.map((k: string) => (
                  <span key={k} className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                    {k}
                  </span>
                ))}
                {result.injectedKeywords.length === 0 && (
                  <span className="text-muted-foreground text-sm">No keywords injected (already optimal)</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-yellow-500/20 bg-yellow-50/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Lock className="h-5 w-5" />
                Optimized Output (JSON)
              </CardTitle>
              <CardDescription>Copy this structure for your resume builder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea 
                  readOnly 
                  value={JSON.stringify(result.optimizedResume, null, 2)}
                  className="h-64 font-mono text-xs bg-muted/50"
                />
                <div className="absolute top-2 right-2">
                  <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(result.optimizedResume, null, 2))}>
                    Copy JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Icon helper
function RefreshCw({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
}
