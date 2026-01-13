'use client';

import { useState } from 'react';
import { Search, Filter, MapPin, Briefcase, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Mock job data
const mockJobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$150K - $180K',
    type: 'Full-time',
    level: 'Senior',
    posted: '2 days ago',
    tags: ['React', 'TypeScript', 'Node.js'],
    match: 92,
  },
  {
    id: 2,
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$120K - $160K',
    type: 'Full-time',
    level: 'Mid-level',
    posted: '1 day ago',
    tags: ['React', 'Python', 'AWS'],
    match: 87,
  },
  {
    id: 3,
    title: 'UI Engineer',
    company: 'DesignHub',
    location: 'New York, NY',
    salary: '$130K - $170K',
    type: 'Full-time',
    level: 'Senior',
    posted: '3 days ago',
    tags: ['React', 'CSS', 'Figma'],
    match: 78,
  },
  {
    id: 4,
    title: 'React Developer',
    company: 'BigTech Co.',
    location: 'Remote',
    salary: '$100K - $140K',
    type: 'Contract',
    level: 'Mid-level',
    posted: '5 hours ago',
    tags: ['React', 'Redux', 'GraphQL'],
    match: 95,
  },
  {
    id: 5,
    title: 'Frontend Architect',
    company: 'Innovation Labs',
    location: 'Austin, TX',
    salary: '$170K - $210K',
    type: 'Full-time',
    level: 'Principal',
    posted: '1 week ago',
    tags: ['React', 'System Design', 'Leadership'],
    match: 72,
  },
];

export function JobSearchForm() {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    // Simulate search
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSearching(false);
    toast({
      title: 'Search Complete',
      description: `Found ${mockJobs.length} matching jobs`,
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
                defaultValue="software engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., San Francisco, CA" defaultValue="remote" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Job Type</Label>
              <Select defaultValue="full-time">
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
              <Select defaultValue="any">
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
              <Label>Platform</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="glassdoor">Glassdoor</SelectItem>
                  <SelectItem value="remoteok">RemoteOK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
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
        </form>
      </CardContent>
    </Card>
  );
}

export function JobResults({ jobs = mockJobs }: { jobs?: typeof mockJobs }) {
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
          <Card key={job.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {job.company}
                      </div>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full font-bold ${
                        job.match >= 90
                          ? 'bg-green-100 text-green-600'
                          : job.match >= 75
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {job.match}%
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {job.type}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="font-medium">${job.salary}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>Posted {job.posted}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 lg:flex-col lg:w-32">
                  <Button className="flex-1" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      View Job
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline">Load More Jobs</Button>
      </div>
    </div>
  );
}
