import { JobSearchForm, JobResults } from '@/components/features/JobSearch';

export function SearchPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Search</h1>
        <p className="text-muted-foreground mt-1">
          Search for jobs across multiple platforms with AI-powered matching
        </p>
      </div>

      <JobSearchForm />
      <JobResults />
    </div>
  );
}
