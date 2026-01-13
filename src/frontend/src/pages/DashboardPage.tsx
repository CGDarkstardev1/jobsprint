'use client';

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Zap, FileText, CheckCircle2, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStats, useApplications, useSavedJobs } from '@/lib/hooks/useJobSearch';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: applications } = useApplications();
  const { data: savedJobs } = useSavedJobs();

  const features = [
    {
      icon: Search,
      title: 'Smart Job Search',
      description:
        'AI-powered job search across multiple platforms with intelligent matching and filtering.',
    },
    {
      icon: Zap,
      title: 'Auto-Apply',
      description: 'Automated job applications with AI-tailored resumes and cover letters.',
    },
    {
      icon: FileText,
      title: 'Resume Tools',
      description: 'ATS compatibility checking and AI-powered resume tailoring for each job.',
    },
    {
      icon: Shield,
      title: 'Stealth Mode',
      description: 'Human-like behavior patterns to avoid detection and blocking.',
    },
    {
      icon: CheckCircle2,
      title: 'Application Tracking',
      description: 'Track all your applications, responses, and interviews in one place.',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Detailed analytics on your job search performance and improvements.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Welcome to JobSprint
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AI-powered job search automation platform. Find and apply to jobs faster with intelligent
          matching, resume tailoring, and automated applications.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/search">
              <Search className="mr-2 h-5 w-5" />
              Start Searching
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/apply">
              <Zap className="mr-2 h-5 w-5" />
              Auto-Apply
            </Link>
          </Button>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalApplications || 0}
            </div>
            <p className="text-xs text-green-600">+12% this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.interviews || 0}
            </div>
            <p className="text-xs text-green-600">+3 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : `${stats?.responseRate || 0}%`}
            </div>
            <p className="text-xs text-green-600">+2% vs last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Waiting for response</p>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Search className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Search Jobs</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find matching jobs across 6+ platforms
                </p>
                <Button asChild>
                  <Link to="/search">Start Search</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Tailor Resume</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ATS optimization and job-specific tailoring
                </p>
                <Button asChild>
                  <Link to="/resume">Optimize Resume</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Auto-Apply</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Apply to multiple jobs automatically
                </p>
                <Button asChild>
                  <Link to="/apply">Start Auto-Apply</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{app.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">{app.company}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        app.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : app.status === 'applied'
                            ? 'bg-blue-100 text-blue-600'
                            : app.status === 'interviewing'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No applications yet. Start searching to apply!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Jobs</CardTitle>
            <CardDescription>Jobs you saved for later</CardDescription>
          </CardHeader>
          <CardContent>
            {savedJobs && savedJobs.length > 0 ? (
              <div className="space-y-3">
                {savedJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {job.matchScore}% match
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No saved jobs yet. Save jobs while searching!
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-xl bg-primary/5 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold">Ready to accelerate your job search?</h3>
            <p className="text-muted-foreground">
              Start applying to more jobs with less effort using AI automation.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/search">
                Search Jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
