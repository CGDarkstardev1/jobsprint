'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase, TrendingUp, Clock, CheckCircle2, ArrowUpRight, Target, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Mock data for the dashboard
const stats = [
  {
    title: 'Applications Sent',
    value: 127,
    change: '+12%',
    trend: 'up',
    icon: Briefcase,
  },
  {
    title: 'Interviews',
    value: 8,
    change: '+3',
    trend: 'up',
    icon: CheckCircle2,
  },
  {
    title: 'Response Rate',
    value: '18%',
    change: '+2%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Avg. Response Time',
    value: '2.3 days',
    change: '-0.5 days',
    trend: 'up',
    icon: Clock,
  },
];

const weeklyData = [
  { day: 'Mon', applications: 12, interviews: 1 },
  { day: 'Tue', applications: 19, interviews: 2 },
  { day: 'Wed', applications: 8, interviews: 1 },
  { day: 'Thu', applications: 24, interviews: 3 },
  { day: 'Fri', applications: 31, interviews: 1 },
  { day: 'Sat', applications: 15, interviews: 0 },
  { day: 'Sun', applications: 18, interviews: 0 },
];

const recentActivity = [
  {
    id: 1,
    type: 'application',
    company: 'TechCorp Inc.',
    position: 'Senior Frontend Developer',
    time: '2 hours ago',
    status: 'pending',
  },
  {
    id: 2,
    type: 'interview',
    company: 'StartupXYZ',
    position: 'Full Stack Engineer',
    time: '5 hours ago',
    status: 'scheduled',
  },
  {
    id: 3,
    type: 'response',
    company: 'BigTech Co.',
    position: 'React Developer',
    time: '1 day ago',
    status: 'viewed',
  },
  {
    id: 4,
    type: 'application',
    company: 'Innovation Labs',
    position: 'UI Engineer',
    time: '2 days ago',
    status: 'rejected',
  },
];

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                from last week
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ActivityChart() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Weekly Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="applications"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorApplications)"
                name="Applications"
              />
              <Area
                type="monotone"
                dataKey="interviews"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInterviews)"
                name="Interviews"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentActivity() {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    activity.type === 'application'
                      ? 'bg-primary/10'
                      : activity.type === 'interview'
                        ? 'bg-green-100'
                        : activity.type === 'response'
                          ? 'bg-blue-100'
                          : 'bg-red-100'
                  }`}
                >
                  {activity.type === 'application' ? (
                    <Briefcase className="h-5 w-5 text-primary" />
                  ) : activity.type === 'interview' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : activity.type === 'response' ? (
                    <ArrowUpRight className="h-5 w-5 text-blue-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{activity.position}</p>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{activity.time}</p>
                <p
                  className={`text-xs font-medium capitalize ${
                    activity.status === 'pending'
                      ? 'text-yellow-600'
                      : activity.status === 'scheduled'
                        ? 'text-green-600'
                        : activity.status === 'viewed'
                          ? 'text-blue-600'
                          : 'text-red-600'
                  }`}
                >
                  {activity.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
