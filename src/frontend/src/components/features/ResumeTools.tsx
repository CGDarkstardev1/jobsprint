'use client';

import { useState, type ChangeEvent } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ATSResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

const mockATSResult: ATSResult = {
  score: 78,
  matchedKeywords: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git'],
  missingKeywords: ['AWS', 'Docker', 'Kubernetes', 'GraphQL'],
  suggestions: [
    'Add AWS experience to highlight cloud skills',
    'Include Docker and Kubernetes in your technical skills',
    'Consider adding GraphQL experience',
    'Quantify achievements with metrics',
  ],
};

export function ATSChecker() {
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleCheck = async () => {
    if (!resume || !jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both your resume and the job description',
        variant: 'destructive',
      });
      return;
    }

    setIsChecking(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setResult(mockATSResult);
    setIsChecking(false);

    toast({
      title: 'ATS Analysis Complete',
      description: `Your resume scored ${mockATSResult.score}/100`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ATS Compatibility Check
          </CardTitle>
          <CardDescription>
            Analyze how well your resume matches a job description for ATS systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resume-text">Your Resume (Paste text)</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume content here..."
                className="min-h-[200px]"
                value={resume}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setResume(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Job Description</Label>
              <Textarea
                id="job-desc"
                placeholder="Paste the job description here..."
                className="min-h-[200px]"
                value={jobDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setJobDescription(e.target.value)
                }
              />
            </div>
            <Button onClick={handleCheck} disabled={isChecking}>
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Check ATS Score
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              ATS Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-6">
                <div
                  className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 ${
                    result.score >= 70
                      ? 'border-green-500'
                      : result.score >= 50
                        ? 'border-yellow-500'
                        : 'border-red-500'
                  }`}
                >
                  <span className="text-3xl font-bold">{result.score}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <p className="mt-4 font-medium">ATS Compatibility Score</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Matched Keywords ({result.matchedKeywords.length})
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.matchedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-medium">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Missing Keywords ({result.missingKeywords.length})
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {result.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                Suggestions for Improvement
              </h4>
              <ul className="mt-2 space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm"
                  >
                    <span className="text-blue-600">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function ResumeTailoring() {
  const { toast } = useToast();
  const [isTailoring, setIsTailoring] = useState(false);
  const [masterResume, setMasterResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');

  const handleTailor = async () => {
    if (!masterResume || !jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both your master resume and job description',
        variant: 'destructive',
      });
      return;
    }

    setIsTailoring(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setTailoredResume(
      JSON.stringify(
        {
          summary:
            'Experienced Frontend Developer with 5+ years of expertise in React, TypeScript, and modern web technologies...',
          skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Docker'],
          experience: [
            {
              title: 'Senior Frontend Developer',
              company: 'TechCorp Inc.',
              period: '2021 - Present',
              achievements: [
                'Led development of customer-facing React applications serving 1M+ users',
                'Improved page load times by 40% through code optimization',
                'Mentored 3 junior developers and established coding standards',
              ],
            },
          ],
        },
        null,
        2
      )
    );
    setIsTailoring(false);

    toast({
      title: 'Resume Tailored',
      description: 'Your resume has been optimized for this job',
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tailoredResume);
    toast({
      title: 'Copied to Clipboard',
      description: 'Tailored resume has been copied',
    });
  };

  const handleDownload = () => {
    const blob = new Blob([tailoredResume], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tailored_resume.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Started',
      description: 'Tailored resume is being downloaded',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Resume Tailoring
          </CardTitle>
          <CardDescription>
            Automatically tailor your resume for each job application using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-resume">Master Resume (JSON format)</Label>
              <Textarea
                id="master-resume"
                placeholder='{"name": "John Doe", "skills": [...], "experience": [...]}'
                className="min-h-[150px] font-mono text-sm"
                value={masterResume}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMasterResume(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-job">Target Job Description</Label>
              <Textarea
                id="target-job"
                placeholder="Paste the job description here..."
                className="min-h-[150px]"
                value={jobDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setJobDescription(e.target.value)
                }
              />
            </div>
            <Button onClick={handleTailor} disabled={isTailoring}>
              {isTailoring ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Tailoring Resume...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Tailored Resume
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {tailoredResume && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tailored Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm">
                {tailoredResume}
              </pre>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
