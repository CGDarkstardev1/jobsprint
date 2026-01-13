'use client';

import { useState, useEffect } from 'react';
import { JobSearchForm, JobResults } from '@/components/features/JobSearch';
import { useTrendingJobs } from '@/lib/hooks/useJobSearch';
import type { Job } from '@/lib/services/jobSearch';

export function SearchPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { data: trendingJobs } = useTrendingJobs();

  const handleSearch = (searchResults: Job[]) => {
    setJobs(searchResults);
    setHasSearched(true);
  };

  // Show trending jobs initially
  useEffect(() => {
    if (!hasSearched && trendingJobs) {
      setJobs(trendingJobs);
    }
  }, [trendingJobs, hasSearched]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Search</h1>
        <p className="text-muted-foreground mt-1">
          Search for jobs across multiple platforms with AI-powered matching
        </p>
      </div>

      <JobSearchForm onSearch={handleSearch} />

      {hasSearched ? (
        <JobResults jobs={jobs} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Showing {jobs.length} trending jobs. Adjust filters and search to find more.</p>
        </div>
      )}
    </div>
  );
}
