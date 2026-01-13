import { useState } from 'react';
import { FileText, FileCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ATSChecker, ResumeTailoring } from '@/components/features/ResumeTools';

export function ResumePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume Tools</h1>
        <p className="text-muted-foreground mt-1">
          Optimize your resume for ATS systems and tailor it for each job application
        </p>
      </div>

      <Tabs defaultValue="ats" className="space-y-6">
        <TabsList>
          <TabsTrigger value="ats" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            ATS Checker
          </TabsTrigger>
          <TabsTrigger value="tailor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume Tailoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ats">
          <ATSChecker />
        </TabsContent>

        <TabsContent value="tailor">
          <ResumeTailoring />
        </TabsContent>
      </Tabs>
    </div>
  );
}
