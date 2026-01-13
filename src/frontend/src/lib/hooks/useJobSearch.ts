/**
 * React Query hooks for JobSprint services
 * Provides caching, loading states, and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobSearchService, SearchFilters } from '../services/jobSearch';
import { storageService, Application, SavedJob } from '../services/storage';
import { atsCheckerService, ResumeData, JobData } from '../services/atsChecker';

// Query Keys
export const queryKeys = {
  jobs: ['jobs'] as const,
  job: (id: string) => ['jobs', id] as const,
  search: (filters: SearchFilters) => ['jobs', 'search', filters] as const,
  trending: ['jobs', 'trending'] as const,
  similar: (jobId: string) => ['jobs', 'similar', jobId] as const,
  applications: ['applications'] as const,
  savedJobs: ['savedJobs'] as const,
  stats: ['stats'] as const,
  atsCheck: (resumeId: string, jobId: string) => ['ats', resumeId, jobId] as const,
};

// Job Search Hooks
export function useJobSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: queryKeys.search(filters),
    queryFn: () => jobSearchService.search(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: filters.keywords.length > 0,
  });
}

export function useTrendingJobs() {
  return useQuery({
    queryKey: queryKeys.trending,
    queryFn: () => jobSearchService.getTrendingJobs(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useJobById(id: string) {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => jobSearchService.getJobById(id),
    enabled: !!id,
  });
}

export function useSimilarJobs(jobId: string) {
  return useQuery({
    queryKey: queryKeys.similar(jobId),
    queryFn: () => jobSearchService.getSimilarJobs(jobId),
    enabled: !!jobId,
  });
}

// Application Hooks
export function useApplications() {
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => storageService.getApplications(),
  });
}

export function useAddApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (application: Application) => {
      await storageService.saveApplication(application);
      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await storageService.deleteApplication(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

// Saved Jobs Hooks
export function useSavedJobs() {
  return useQuery({
    queryKey: queryKeys.savedJobs,
    queryFn: () => storageService.getSavedJobs(),
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: SavedJob) => {
      storageService.saveJob(job);
      return job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs });
    },
  });
}

export function useRemoveSavedJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      storageService.removeJob(jobId);
      return jobId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs });
    },
  });
}

// Stats Hook
export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => storageService.getStats(),
  });
}

// ATS Check Hook
export function useATSCheck(resume: ResumeData, job: JobData) {
  return useQuery({
    queryKey: queryKeys.atsCheck(resume.summary, job.title),
    queryFn: () => atsCheckerService.analyze(resume, job),
    enabled: !!resume && !!job,
    staleTime: 0, // Always fresh
  });
}

// Settings Hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => storageService.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<ReturnType<typeof storageService.getSettings>>) => {
      storageService.saveSettings(settings);
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
