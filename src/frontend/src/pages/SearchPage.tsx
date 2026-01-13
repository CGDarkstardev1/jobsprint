'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { JobSearchForm, JobResults } from '@/components/features/JobSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Job } from '@/lib/services/jobSearch';

export function SearchPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  const handleSearch = () => {
    setHasSearched(true);
    // Mock search results for demo
    setJobs([
      {
        id: '1',
        title: 'Senior Frontend Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$160K - $200K',
        salaryMin: 160000,
        salaryMax: 200000,
        type: 'full-time',
        level: 'senior',
        postedAt: new Date().toISOString(),
        postedRelative: 'Just posted',
        description:
          'We are looking for a Senior Frontend Engineer to join our payments platform team.',
        requirements: ['5+ years React experience', 'TypeScript mastery'],
        tags: ['React', 'TypeScript', 'Node.js'],
        platform: 'linkedin',
        platformUrl: 'https://linkedin.com/jobs/view/123456',
        matchScore: 94,
        remote: true,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            AI-Powered Multi-Threaded Job Search
          </h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
            Search across LinkedIn, Indeed, Glassdoor, and more simultaneously with intelligent AI
            matching
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <JobSearchForm onSearch={handleSearch} />

            {/* Results Section */}
            {hasSearched && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{jobs.length} Jobs Found</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Refine Search
                    </Button>
                    <Button size="sm">Apply to All</Button>
                  </div>
                </div>
                <JobResults jobs={jobs} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Analytics</CardTitle>
                <CardDescription>Performance metrics and search statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold">Search Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Searches</span>
                        <div className="text-2xl font-bold">247</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success Rate</span>
                        <div className="text-2xl font-bold text-green-600">98.2%</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold">Platform Performance</h4>
                    <div className="text-sm text-muted-foreground">
                      Performance metrics will be displayed here
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Settings</CardTitle>
                <CardDescription>Configure your job search preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Settings panel will be implemented here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
