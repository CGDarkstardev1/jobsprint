'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp, Users, CheckCircle } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: "Sarah J.",
    role: "Software Engineer",
    company: "TechCorp",
    content: "JobSprint got me 5 interviews in one week. The ATS optimization is legitimate magic.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 5
  },
  {
    name: "Michael R.",
    role: "Product Manager",
    company: "StartUp Inc",
    content: "I was getting auto-rejected for months. Used the Stealth Mode resume and got a callback the next day.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    rating: 5
  },
  {
    name: "David K.",
    role: "Data Scientist",
    company: "BigData Co",
    content: "The multi-threaded search found roles I never saw on LinkedIn. Incredible tool.",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
    rating: 5
  }
];

export function TrustSignals() {
  const [liveStats, setLiveStats] = useState({
    jobsApplied: 14205,
    interviewsSecured: 892,
    usersActive: 342
  });

  // Simulate live stats updating
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        jobsApplied: prev.jobsApplied + Math.floor(Math.random() * 3),
        interviewsSecured: prev.interviewsSecured, // Changes less often
        usersActive: prev.usersActive + Math.floor(Math.random() * 5) - 2
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 py-8">
      {/* Live Stats Ticker */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jobs Applied Today</p>
              <p className="text-2xl font-bold text-primary">{liveStats.jobsApplied.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/20" />
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Interviews Secured</p>
              <p className="text-2xl font-bold text-green-600">{liveStats.interviewsSecured.toLocaleString()}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600/20" />
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">{liveStats.usersActive.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600/20" />
          </CardContent>
        </Card>
      </div>

      {/* Testimonials */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">Trusted by 10,000+ Job Seekers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="bg-card hover:shadow-md transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{t.content}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <Avatar>
                    <AvatarImage src={t.image} />
                    <AvatarFallback>{t.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} at {t.company}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
