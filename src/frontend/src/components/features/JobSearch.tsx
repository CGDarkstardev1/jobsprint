'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Building2,
  ArrowRight,
  Bookmark,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useJobSearch, useSaveJob, useSettings, useUpdateSettings } from '@/lib/hooks/useJobSearch';
import type { Job, SearchFilters } from '@/lib/services/jobSearch';

// Sample resume for match calculation
const sampleResume = {
  summary:
    'Experienced software engineer with expertise in React, TypeScript, and Node.js development.',
  skills: ['React', 'TypeScript', 'Node.js', 'JavaScript', 'CSS', 'GraphQL', 'PostgreSQL'],
  experience: [
    {
      title: 'Senior Frontend Developer',
      company: 'Tech Corp',
      duration: '2022 - Present',
      description:
        'Built and maintained React-based frontend applications serving millions of users.',
    },
    {
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      duration: '2020 - 2022',
      description: 'Developed full stack applications using React, Node.js, and PostgreSQL.',
    },
  ],
  education: [{ degree: 'BS Computer Science', school: 'University of Tech', year: '2020' }],
};

interface JobSearchFormProps {
  onSearch: (jobs: Job[]) => void;
}

export function JobSearchForm({ onSearch }: JobSearchFormProps) {
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const [filters, setFilters] = useState<SearchFilters>({
    keywords: settings?.searchKeywords || 'software engineer',
    location: settings?.location || 'remote',
    remoteOnly: settings?.remoteOnly ?? true,
    jobTypes: settings?.jobTypes || ['full-time'],
    experienceLevel: settings?.experienceLevel || 'any',
    platforms: [],
  });

  const { data: searchResult, isLoading, isFetching } = useJobSearch(filters);
  const saveJobMutation = useSaveJob();

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateSettings.mutate({
        searchKeywords: filters.keywords,
        location: filters.location,
        remoteOnly: filters.remoteOnly,
        jobTypes: filters.jobTypes,
        experienceLevel: filters.experienceLevel,
      });
      onSearch(searchResult?.jobs || []);

      toast({
        title: 'Search Complete',
        description: `Found ${searchResult?.total || 0} matching jobs in ${searchResult?.searchTime || 0}ms`,
      });
    },
    [filters, searchResult, updateSettings, onSearch, toast]
  );

  const handleSaveJob = (job: Job) => {
    saveJobMutation.mutate({
      id: `saved-${job.id}`,
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      postedAt: job.postedAt,
      savedAt: new Date().toISOString(),
      matchScore: job.matchScore,
    });
    toast({
      title: 'Job Saved',
      description: `${job.title} at ${job.company} has been saved.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Job Search
        </CardTitle>
        <CardDescription>
          Search for jobs across multiple platforms with AI-powered matching
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                placeholder="e.g., Senior Software Engineer"
                value={filters.keywords}
                onChange={(e) => setFilters((f) => ({ ...f, keywords: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={filters.location}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Job Type</Label>
              <Select
                value={filters.jobTypes[0] || 'full-time'}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, jobTypes: [value as Job['type']] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience Level</Label>
              <Select
                value={filters.experienceLevel}
                onValueChange={(value) => setFilters((f) => ({ ...f, experienceLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Level</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Remote Only</Label>
              <Select
                value={filters.remoteOnly ? 'yes' : 'no'}
                onValueChange={(value) =>
                  setFilters((f) => ({ ...f, remoteOnly: value === 'yes' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platforms</Label>
              <Select
                value={filters.platforms[0] || 'all'}
                onValueChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    platforms: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="glassdoor">Glassdoor</SelectItem>
                  <SelectItem value="remoteok">RemoteOK</SelectItem>
                  <SelectItem value="wellfound">Wellfound</SelectItem>
                  <SelectItem value="otta">Otta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || isFetching}>
              {isLoading || isFetching ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Jobs
                </>
              )}
            </Button>
            <Button type="button" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </div>

          {searchResult && (
            <div className="text-sm text-muted-foreground">
              Searched {searchResult.platformsSearched.length} platforms in{' '}
              {searchResult.searchTime}ms
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

interface JobResultsProps {
  jobs: Job[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function JobResults({ jobs, onLoadMore, hasMore }: JobResultsProps) {
  if (jobs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters or keywords.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{jobs.length} Jobs Found</h2>
        <Select defaultValue="relevance">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Sort by Relevance</SelectItem>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="salary">Sort by Salary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore}>
            Load More Jobs
          </Button>
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const { toast } = useToast();
  const saveJobMutation = useSaveJob();

  const handleSave = () => {
    saveJobMutation.mutate({
      id: `saved-${job.id}`,
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      postedAt: job.postedAt,
      savedAt: new Date().toISOString(),
      matchScore: job.matchScore,
    });
  };

  const handleApply = () => {
    toast({
      title: 'Application Started',
      description: `Preparing application for ${job.title} at ${job.company}`,
      variant: 'default',
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-600';
    if (score >= 75) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      linkedin: 'bg-blue-100 text-blue-600',
      indeed: 'bg-purple-100 text-purple-600',
      glassdoor: 'bg-green-100 text-green-600',
      remoteok: 'bg-red-100 text-red-600',
      wellfound: 'bg-orange-100 text-orange-600',
      otta: 'bg-pink-100 text-pink-600',
    };
    return colors[platform] || 'bg-gray-100 text-gray-600';
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{job.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPlatformColor(job.platform)}`}
                >
                  {job.platform}
                </span>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${getMatchColor(job.matchScore)}`}
                >
                  {job.matchScore}%
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                {job.type}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="font-medium">{job.salary}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {job.postedRelative}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {job.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 lg:flex-col lg:w-36">
            <Button className="flex-1" asChild>
              <a href={job.platformUrl} target="_blank" rel="noopener noreferrer">
                View Job
              </a>
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleApply}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Bookmark className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
