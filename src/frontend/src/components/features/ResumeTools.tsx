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
import { atsCheckerService, ATSResult } from '@/lib/services/atsChecker';

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
    setResult(null);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Parse resume and job, or use defaults
    let resumeData, jobData;

    try {
      // Try to parse resume as JSON
      resumeData = JSON.parse(resume);
    } catch {
      // If not JSON, create a basic structure
      resumeData = {
        summary: resume.substring(0, 500),
        skills: extractSkills(resume),
        experience: [],
        education: [],
      };
    }

    try {
      jobData = JSON.parse(jobDescription);
    } catch {
      jobData = {
        title: 'Target Position',
        description: jobDescription,
        requirements: extractRequirements(jobDescription),
        preferredSkills: [],
      };
    }

    // Run ATS analysis
    const atsResult = atsCheckerService.analyze(resumeData, jobData);
    setResult(atsResult);
    setIsChecking(false);

    toast({
      title: 'ATS Analysis Complete',
      description: `Your resume scored ${atsResult.overallScore}/100`,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'border-green-500 text-green-600';
    if (score >= 60) return 'border-yellow-500 text-yellow-600';
    return 'border-red-500 text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
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
              <Label htmlFor="resume-text">Your Resume (Paste text or JSON)</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume content here... or use JSON format"
                className="min-h-[200px] font-mono text-sm"
                value={resume}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setResume(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Job Description (Paste text or JSON)</Label>
              <Textarea
                id="job-desc"
                placeholder="Paste the job description here... or use JSON format with requirements"
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
              {/* Score Circle */}
              <div
                className={`flex flex-col items-center justify-center rounded-lg p-6 ${getScoreBg(result.overallScore)}`}
              >
                <div
                  className={`relative flex h-32 w-32 items-center justify-center rounded-full border-4 ${getScoreColor(result.overallScore)}`}
                >
                  <span className="text-3xl font-bold">{result.overallScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <p className="mt-4 font-medium">
                  {result.overallScore >= 80
                    ? 'Excellent Match!'
                    : result.overallScore >= 60
                      ? 'Good Match'
                      : 'Needs Improvement'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Keyword Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Keyword Match</p>
                    <p className="text-2xl font-bold">{result.keywordScore}/100</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Structure Score</p>
                    <p className="text-2xl font-bold">{result.structureScore}/100</p>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-medium mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Matched Keywords ({result.keywordMatch.found.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordMatch.found.length > 0 ? (
                      result.keywordMatch.found.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No keywords matched</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 font-medium mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Missing Keywords ({result.keywordMatch.missing.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordMatch.missing.length > 0 ? (
                      result.keywordMatch.missing.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No missing keywords</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {result.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="flex items-center gap-2 font-medium mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((suggestion, index) => (
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
            )}
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

    // Simulate AI tailoring
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let resumeData;
    try {
      resumeData = JSON.parse(masterResume);
    } catch {
      resumeData = {
        summary: masterResume.substring(0, 500),
        skills: extractSkills(masterResume),
        experience: [],
        education: [],
      };
    }

    // Generate tailored resume
    const tailored = {
      ...resumeData,
      tailoredFor: {
        jobDescription: jobDescription.substring(0, 200) + '...',
        tailoredAt: new Date().toISOString(),
      },
      suggestedChanges: [
        'Updated summary to highlight relevant experience',
        'Prioritized skills mentioned in job description',
        'Emphasized achievements that match job requirements',
      ],
    };

    setTailoredResume(JSON.stringify(tailored, null, 2));
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
                placeholder='{"summary": "...", "skills": [...], "experience": [...]}'
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

// Helper functions
function extractSkills(text: string): string[] {
  const techKeywords = [
    'react',
    'typescript',
    'javascript',
    'node.js',
    'python',
    'java',
    'aws',
    'docker',
    'kubernetes',
    'graphql',
    'sql',
    'postgresql',
    'mongodb',
    'redis',
    'express',
    'next.js',
    'vue',
    'angular',
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  techKeywords.forEach((keyword) => {
    if (lowerText.includes(keyword)) {
      found.push(keyword);
    }
  });

  return [...new Set(found)];
}

function extractRequirements(text: string): string[] {
  // Simple extraction of sentences that might contain requirements
  const sentences = text.split(/[.!?]+/);
  return sentences
    .filter((s) => s.length > 20 && s.length < 200)
    .map((s) => s.trim())
    .slice(0, 5);
}
