import { Link } from 'react-router-dom';
import { ArrowRight, Search, Zap, FileText, CheckCircle2, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

export function DashboardPage() {
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
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-green-600">+12% this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
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
            <div className="text-2xl font-bold">18%</div>
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
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Waiting for response</p>
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
