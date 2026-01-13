/**
 * Job Search Service - Realistic job search with multiple platform support
 * Simulates multi-threaded search across LinkedIn, Indeed, Glassdoor, etc.
 */

import { storageService } from './storage';
import { jobPlatformService } from './jobPlatforms';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  level: 'entry' | 'mid' | 'senior' | 'principal' | 'executive';
  postedAt: string;
  postedRelative: string;
  description: string;
  requirements: string[];
  tags: string[];
  platform: string;
  platformUrl: string;
  matchScore: number;
  remote: boolean;
}

export interface SearchFilters {
  keywords: string;
  location: string;
  remoteOnly: boolean;
  jobTypes: string[];
  experienceLevel: string;
  salaryMin?: number;
  platforms: string[];
}

export interface SearchResult {
  jobs: Job[];
  total: number;
  platformsSearched: string[];
  searchTime: number;
  query: SearchFilters;
}

// Realistic job database - 50+ jobs across multiple categories and platforms
const JOB_DATABASE: Job[] = [
  // ===== SENIOR FRONTEND ROLES =====
  {
    id: 'li-001',
    title: 'Senior Frontend Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA (Hybrid)',
    salary: '$160K - $200K',
    salaryMin: 160000,
    salaryMax: 200000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T10:00:00Z',
    postedRelative: '2 days ago',
    description:
      'We are looking for a Senior Frontend Engineer to join our payments platform team. You will work on building beautiful, performant interfaces for millions of businesses worldwide.',
    requirements: [
      '5+ years React experience',
      'TypeScript mastery',
      'Performance optimization',
      'Test-driven development',
    ],
    tags: ['React', 'TypeScript', 'GraphQL', 'CSS'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/view/123456',
    matchScore: 94,
    remote: true,
  },
  {
    id: 'li-002',
    title: 'Senior React Developer',
    company: 'Shopify',
    location: 'Remote',
    salary: '$150K - $190K',
    salaryMin: 150000,
    salaryMax: 190000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-13T08:00:00Z',
    postedRelative: '5 hours ago',
    description:
      "Join Shopify's platform team and help millions of entrepreneurs succeed. Remote-first culture with great benefits.",
    requirements: [
      '5+ years React',
      'Redux or similar',
      'Testing (Jest/Cypress)',
      'CI/CD pipelines',
    ],
    tags: ['React', 'Redux', 'Jest', 'GraphQL'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/901234',
    matchScore: 96,
    remote: true,
  },
  {
    id: 'li-003',
    title: 'Frontend Architect',
    company: 'Airbnb',
    location: 'Seattle, WA',
    salary: '$180K - $220K',
    salaryMin: 180000,
    salaryMax: 220000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-09T16:00:00Z',
    postedRelative: '4 days ago',
    description:
      'Lead the architecture of our guest and host facing web applications. Work on challenging problems at scale.',
    requirements: ['8+ years experience', 'System design', 'Mentoring', 'React ecosystem'],
    tags: ['React', 'System Design', 'Leadership', 'Performance'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/567890',
    matchScore: 75,
    remote: false,
  },
  {
    id: 'li-004',
    title: 'Staff Frontend Engineer',
    company: 'Netflix',
    location: 'Los Gatos, CA',
    salary: '$200K - $250K',
    salaryMin: 200000,
    salaryMax: 250000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-12T11:00:00Z',
    postedRelative: '1 day ago',
    description:
      "Work on Netflix's member-facing applications used by 200+ million people worldwide. Freedom and responsibility.",
    requirements: [
      '6+ years experience',
      'JavaScript/TypeScript',
      'A/B testing',
      'Performance at scale',
    ],
    tags: ['React', 'TypeScript', 'A/B Testing', 'Performance'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/234567',
    matchScore: 91,
    remote: false,
  },
  {
    id: 'li-005',
    title: 'Senior UI Engineer',
    company: 'Figma',
    location: 'New York, NY',
    salary: '$170K - $210K',
    salaryMin: 170000,
    salaryMax: 210000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-10T09:00:00Z',
    postedRelative: '3 days ago',
    description:
      'Help us build the best design tools in the world. We are looking for a UI engineer who cares about every pixel and interaction.',
    requirements: ['Strong CSS/Sass', 'Design systems', 'TypeScript', 'Performance'],
    tags: ['React', 'TypeScript', 'CSS', 'Design Systems'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/345678',
    matchScore: 82,
    remote: false,
  },
  // ===== MID-LEVEL FRONTEND =====
  {
    id: 'indeed-001',
    title: 'Full Stack Developer',
    company: 'Remote-first Startup',
    location: 'Remote',
    salary: '$120K - $160K',
    salaryMin: 120000,
    salaryMax: 160000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-12T14:00:00Z',
    postedRelative: '1 day ago',
    description:
      'Join our fast-growing team building the future of remote work. We need a full stack developer to help us scale our platform.',
    requirements: ['3+ years full stack', 'React & Node.js', 'PostgreSQL', 'AWS experience'],
    tags: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/789012',
    matchScore: 88,
    remote: true,
  },
  {
    id: 'indeed-002',
    title: 'Mid-level React Developer',
    company: 'Spotify',
    location: 'Remote',
    salary: '$100K - $130K',
    salaryMin: 100000,
    salaryMax: 130000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-13T06:00:00Z',
    postedRelative: '7 hours ago',
    description:
      'Join our music streaming team and help create the best listening experience. Remote-first with flexible hours.',
    requirements: ['2+ years React', 'CSS/Sass', 'Testing', 'Agile development'],
    tags: ['React', 'CSS', 'Jest', 'Agile'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/678901',
    matchScore: 89,
    remote: true,
  },
  {
    id: 'indeed-003',
    title: 'Software Engineer II',
    company: 'Google',
    location: 'Mountain View, CA',
    salary: '$200K - $250K',
    salaryMin: 200000,
    salaryMax: 250000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T13:00:00Z',
    postedRelative: '2 days ago',
    description:
      'Work on products used by billions. Solve challenging problems at scale with talented colleagues.',
    requirements: [
      '5+ years experience',
      'JavaScript/TypeScript',
      'System design',
      'Production experience',
    ],
    tags: ['React', 'TypeScript', 'System Design', 'Cloud'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/456789',
    matchScore: 85,
    remote: false,
  },
  {
    id: 'indeed-004',
    title: 'Frontend Developer',
    company: 'Dropbox',
    location: 'San Francisco, CA',
    salary: '$140K - $180K',
    salaryMin: 140000,
    salaryMax: 180000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-10T11:00:00Z',
    postedRelative: '3 days ago',
    description: 'Help us build the future of file collaboration. Great culture and benefits.',
    requirements: ['3+ years React', 'TypeScript', 'CSS-in-JS', 'Testing'],
    tags: ['React', 'TypeScript', 'Styled Components', 'Jest'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/111222',
    matchScore: 78,
    remote: false,
  },
  {
    id: 'indeed-005',
    title: 'Senior Frontend Engineer',
    company: 'Uber',
    location: 'New York, NY',
    salary: '$175K - $215K',
    salaryMin: 175000,
    salaryMax: 215000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T09:00:00Z',
    postedRelative: '1 day ago',
    description:
      'Build user-facing products that move the world. Work on real-time mapping and logistics.',
    requirements: ['5+ years React', 'Real-time systems', 'Performance', 'Micro-frontends'],
    tags: ['React', 'TypeScript', 'WebSockets', 'Performance'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/333444',
    matchScore: 87,
    remote: false,
  },
  // ===== REMOTE-FIRST COMPANIES =====
  {
    id: 'ro-001',
    title: 'Senior Frontend Developer',
    company: 'GitLab',
    location: 'Remote (Worldwide)',
    salary: '$155K - $195K',
    salaryMin: 155000,
    salaryMax: 195000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-13T10:00:00Z',
    postedRelative: '3 hours ago',
    description: 'All-remote company building the leading DevOps platform. Work from anywhere.',
    requirements: ['5+ years frontend', 'Vue or React', 'Vuex/Redux', 'Testing'],
    tags: ['Vue.js', 'TypeScript', 'SCSS', 'CI/CD'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/555666',
    matchScore: 92,
    remote: true,
  },
  {
    id: 'ro-002',
    title: 'Full Stack Engineer',
    company: 'Supabase',
    location: 'Remote',
    salary: '$130K - $170K',
    salaryMin: 130000,
    salaryMax: 170000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-12T16:00:00Z',
    postedRelative: '20 hours ago',
    description: 'Open source Firebase alternative. Build the future of backend development.',
    requirements: ['3+ years full stack', 'React', 'PostgreSQL', 'GraphQL'],
    tags: ['React', 'TypeScript', 'PostgreSQL', 'GraphQL'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/777888',
    matchScore: 95,
    remote: true,
  },
  {
    id: 'ro-003',
    title: 'Senior UI Engineer',
    company: 'Vercel',
    location: 'Remote',
    salary: '$165K - $205K',
    salaryMin: 165000,
    salaryMax: 205000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T14:00:00Z',
    postedRelative: '2 days ago',
    description: 'Build the frontend cloud. Creators of Next.js. Amazing engineering culture.',
    requirements: ['5+ years React', 'Next.js', 'Performance', 'Design systems'],
    tags: ['React', 'Next.js', 'TypeScript', 'Performance'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/999000',
    matchScore: 98,
    remote: true,
  },
  {
    id: 'ro-004',
    title: 'Frontend Developer',
    company: 'Prisma',
    location: 'Remote (EU timezones)',
    salary: '$120K - $150K',
    salaryMin: 120000,
    salaryMax: 150000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-10T08:00:00Z',
    postedRelative: '3 days ago',
    description: 'Build the best database ORM for Node.js and TypeScript. Open source company.',
    requirements: ['2+ years React', 'TypeScript', 'GraphQL', 'Testing'],
    tags: ['React', 'TypeScript', 'GraphQL', 'Jest'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/111333',
    matchScore: 84,
    remote: true,
  },
  {
    id: 'ro-005',
    title: 'Staff Frontend Engineer',
    company: 'Linear',
    location: 'Remote',
    salary: '$190K - $230K',
    salaryMin: 190000,
    salaryMax: 230000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-13T07:00:00Z',
    postedRelative: '6 hours ago',
    description: 'Build the best issue tracker ever. Fast, beautiful, keyboard-first. High bar.',
    requirements: ['7+ years frontend', 'Performance obsession', 'TypeScript', 'Design'],
    tags: ['React', 'TypeScript', 'Performance', 'CSS'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/222444',
    matchScore: 97,
    remote: true,
  },
  // ===== STARTUP ROLES =====
  {
    id: 'wf-001',
    title: 'Founding Frontend Engineer',
    company: 'Raycast',
    location: 'San Francisco, CA',
    salary: '$160K - $200K + equity',
    salaryMin: 160000,
    salaryMax: 200000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T10:00:00Z',
    postedRelative: '2 days ago',
    description: 'Join early team at fast-growing Mac productivity tool. Significant equity.',
    requirements: ['4+ years React', 'macOS/Swift', 'Performance', 'Product sense'],
    tags: ['React', 'TypeScript', 'Performance', 'Product'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/555777',
    matchScore: 88,
    remote: false,
  },
  {
    id: 'wf-002',
    title: 'Senior Frontend Engineer',
    company: 'Loom',
    location: 'Remote',
    salary: '$155K - $190K',
    salaryMin: 155000,
    salaryMax: 190000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T12:00:00Z',
    postedRelative: '1 day ago',
    description: 'Async video for teams. Build the future of workplace communication.',
    requirements: ['5+ years React', 'Video technologies', 'TypeScript', 'Testing'],
    tags: ['React', 'TypeScript', 'WebRTC', 'Performance'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/666888',
    matchScore: 91,
    remote: true,
  },
  {
    id: 'wf-003',
    title: 'Frontend Engineer',
    company: 'Replit',
    location: 'Remote',
    salary: '$140K - $175K',
    salaryMin: 140000,
    salaryMax: 175000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-10T15:00:00Z',
    postedRelative: '3 days ago',
    description: 'Code where you want. Build the future of coding in the browser.',
    requirements: ['3+ years React', 'WebAssembly', 'TypeScript', 'Collaborative tools'],
    tags: ['React', 'TypeScript', 'WebAssembly', 'Yjs'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/777999',
    matchScore: 93,
    remote: true,
  },
  {
    id: 'wf-004',
    title: 'Senior UI Developer',
    company: 'Notion',
    location: 'San Francisco, CA',
    salary: '$175K - $215K',
    salaryMin: 175000,
    salaryMax: 215000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T09:00:00Z',
    postedRelative: '2 days ago',
    description: 'All-in-one workspace. Build the future of productivity software.',
    requirements: ['5+ years frontend', 'Rich text editors', 'Performance', 'Design systems'],
    tags: ['React', 'TypeScript', 'ProseMirror', 'Performance'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/888000',
    matchScore: 86,
    remote: false,
  },
  // ===== DATA & ML ROLES =====
  {
    id: 'gd-001',
    title: 'Frontend Engineer - Data Platform',
    company: 'Databricks',
    location: 'San Francisco, CA',
    salary: '$180K - $220K',
    salaryMin: 180000,
    salaryMax: 220000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T08:00:00Z',
    postedRelative: '1 day ago',
    description: 'Build beautiful interfaces for data science and ML workflows.',
    requirements: ['5+ years React', 'Data visualization', 'TypeScript', 'D3.js'],
    tags: ['React', 'TypeScript', 'D3.js', 'Data Viz'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/111444',
    matchScore: 79,
    remote: false,
  },
  {
    id: 'gd-002',
    title: 'UI Engineer - Analytics',
    company: 'Mixpanel',
    location: 'New York, NY',
    salary: '$150K - $185K',
    salaryMin: 150000,
    salaryMax: 185000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-10T14:00:00Z',
    postedRelative: '3 days ago',
    description: 'Build analytics dashboards used by thousands of companies.',
    requirements: ['4+ years React', 'Dashboard design', 'TypeScript', 'Testing'],
    tags: ['React', 'TypeScript', 'D3.js', 'Dashboards'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/222555',
    matchScore: 77,
    remote: false,
  },
  // ===== ENTRY LEVEL & INTERNSHIPS =====
  {
    id: 'otta-001',
    title: 'Frontend Developer (New Grad)',
    company: 'Meta',
    location: 'Menlo Park, CA',
    salary: '$130K - $160K',
    salaryMin: 130000,
    salaryMax: 160000,
    type: 'full-time',
    level: 'entry',
    postedAt: '2026-01-11T11:00:00Z',
    postedRelative: '2 days ago',
    description: "New grad opportunity at one of the world's largest tech companies.",
    requirements: ['BS/MS in CS', 'JavaScript/TypeScript', 'React basics', 'Internship experience'],
    tags: ['React', 'TypeScript', 'JavaScript', 'CSS'],
    platform: 'otta',
    platformUrl: 'https://otta.com/jobs/333666',
    matchScore: 83,
    remote: false,
  },
  {
    id: 'otta-002',
    title: 'Software Engineer - Growth',
    company: 'DoorDash',
    location: 'San Francisco, CA',
    salary: '$145K - $180K',
    salaryMin: 145000,
    salaryMax: 180000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-12T10:00:00Z',
    postedRelative: '1 day ago',
    description: 'Work on growth experiments and conversion optimization.',
    requirements: ['2+ years React', 'A/B testing', 'TypeScript', 'Analytics'],
    tags: ['React', 'TypeScript', 'A/B Testing', 'Growth'],
    platform: 'otta',
    platformUrl: 'https://otta.com/jobs/444777',
    matchScore: 81,
    remote: false,
  },
  {
    id: 'otta-003',
    title: 'Frontend Engineering Intern',
    company: 'Apple',
    location: 'Cupertino, CA',
    salary: '$45 - $65 / hour',
    salaryMin: 90000,
    salaryMax: 130000,
    type: 'internship',
    level: 'entry',
    postedAt: '2026-01-10T09:00:00Z',
    postedRelative: '3 days ago',
    description: "Summer internship opportunity working on Apple's web platforms.",
    requirements: ['CS student', 'JavaScript', 'React basics', 'Problem solving'],
    tags: ['React', 'JavaScript', 'CSS', 'Swift'],
    platform: 'otta',
    platformUrl: 'https://otta.com/jobs/555888',
    matchScore: 76,
    remote: false,
  },
  // ===== CONTRACT & PART-TIME =====
  {
    id: 'con-001',
    title: 'React Developer (Contract)',
    company: 'Tech Consultancy',
    location: 'Remote',
    salary: '$80 - $120 / hour',
    salaryMin: 80000,
    salaryMax: 120000,
    type: 'contract',
    level: 'senior',
    postedAt: '2026-01-13T08:00:00Z',
    postedRelative: '5 hours ago',
    description: '6-month contract for a major client migration project.',
    requirements: ['5+ years React', 'Migration experience', 'TypeScript', 'Communication'],
    tags: ['React', 'TypeScript', 'Migration', 'Consulting'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/666999',
    matchScore: 72,
    remote: true,
  },
  {
    id: 'con-002',
    title: 'Frontend Engineer (Part-time)',
    company: 'EdTech Startup',
    location: 'Remote',
    salary: '$50 - $75 / hour',
    salaryMin: 50000,
    salaryMax: 75000,
    type: 'part-time',
    level: 'mid',
    postedAt: '2026-01-11T15:00:00Z',
    postedRelative: '2 days ago',
    description: '20 hours/week building educational tools for students.',
    requirements: ['2+ years React', 'Education interest', 'TypeScript', 'Flexibility'],
    tags: ['React', 'TypeScript', 'Education', 'CSS'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/777000',
    matchScore: 68,
    remote: true,
  },
  // ===== MORE SENIOR ROLES =====
  {
    id: 'sr-001',
    title: 'Principal Frontend Engineer',
    company: 'Snowflake',
    location: 'San Mateo, CA',
    salary: '$220K - $280K',
    salaryMin: 220000,
    salaryMax: 280000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-12T11:00:00Z',
    postedRelative: '1 day ago',
    description:
      'Lead frontend architecture for the data cloud. Work on products used by enterprises worldwide.',
    requirements: ['10+ years experience', 'System architecture', 'Mentoring', 'React at scale'],
    tags: ['React', 'TypeScript', 'Architecture', 'Leadership'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/888111',
    matchScore: 74,
    remote: false,
  },
  {
    id: 'sr-002',
    title: 'Senior Frontend Engineer - Platform',
    company: 'Twilio',
    location: 'Remote',
    salary: '$165K - $205K',
    salaryMin: 165000,
    salaryMax: 205000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T13:00:00Z',
    postedRelative: '2 days ago',
    description: 'Build developer tools and APIs for communication platforms.',
    requirements: ['5+ years React', 'API design', 'TypeScript', 'Developer experience'],
    tags: ['React', 'TypeScript', 'APIs', 'DX'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/999222',
    matchScore: 82,
    remote: true,
  },
  {
    id: 'sr-003',
    title: 'Staff UI Engineer',
    company: 'Pinterest',
    location: 'San Francisco, CA',
    salary: '$195K - $240K',
    salaryMin: 195000,
    salaryMax: 240000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-10T10:00:00Z',
    postedRelative: '3 days ago',
    description: 'Build beautiful, inspiring experiences for millions of creators.',
    requirements: ['7+ years frontend', 'Visual design', 'Performance', 'Experimentation'],
    tags: ['React', 'TypeScript', 'Visual Design', 'Performance'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/111555',
    matchScore: 79,
    remote: false,
  },
  {
    id: 'sr-004',
    title: 'Senior Frontend Engineer - Mobile Web',
    company: 'TikTok',
    location: 'Los Angeles, CA',
    salary: '$180K - $220K',
    salaryMin: 180000,
    salaryMax: 220000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T09:00:00Z',
    postedRelative: '1 day ago',
    description:
      "Build next-generation mobile web experiences for the world's most downloaded app.",
    requirements: ['5+ years React', 'Mobile web', 'Performance', 'Animation'],
    tags: ['React', 'TypeScript', 'Mobile Web', 'Animation'],
    platform: 'indeed',
    platformUrl: 'https://indeed.com/jobs/222666',
    matchScore: 85,
    remote: false,
  },
  {
    id: 'sr-005',
    title: 'Senior Frontend Engineer - Commerce',
    company: 'Square',
    location: 'Atlanta, GA',
    salary: '$155K - $190K',
    salaryMin: 155000,
    salaryMax: 190000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T14:00:00Z',
    postedRelative: '2 days ago',
    description: 'Build commerce tools for small businesses and sellers.',
    requirements: ['5+ years React', 'E-commerce', 'TypeScript', 'Payments'],
    tags: ['React', 'TypeScript', 'E-commerce', 'Payments'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/333777',
    matchScore: 80,
    remote: false,
  },
  // ===== HEALTHTECH & FINTECH =====
  {
    id: 'ht-001',
    title: 'Frontend Engineer - Healthcare',
    company: 'Oscar Health',
    location: 'New York, NY',
    salary: '$145K - $180K',
    salaryMin: 145000,
    salaryMax: 180000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T08:00:00Z',
    postedRelative: '1 day ago',
    description: 'Build accessible healthcare tools for members and providers.',
    requirements: ['4+ years React', 'Healthcare experience', 'TypeScript', 'A11y'],
    tags: ['React', 'TypeScript', 'Healthcare', 'Accessibility'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/444888',
    matchScore: 73,
    remote: false,
  },
  {
    id: 'ft-001',
    title: 'Senior Frontend Engineer - Fintech',
    company: 'Coinbase',
    location: 'Remote',
    salary: '$175K - $215K',
    salaryMin: 175000,
    salaryMax: 215000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-13T06:00:00Z',
    postedRelative: '7 hours ago',
    description: 'Build the future of financial infrastructure. Crypto enthusiast? Join us.',
    requirements: ['5+ years React', 'Fintech/crypto', 'Security', 'TypeScript'],
    tags: ['React', 'TypeScript', 'Fintech', 'Security'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/555999',
    matchScore: 89,
    remote: true,
  },
  // ===== MORE STARTUPS =====
  {
    id: 'su-001',
    title: 'Senior Frontend Engineer',
    company: 'Cody (AI Assistant)',
    location: 'Remote',
    salary: '$160K - $200K',
    salaryMin: 160000,
    salaryMax: 200000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-13T09:00:00Z',
    postedRelative: '4 hours ago',
    description: 'Build the best AI coding assistant. Raised Series A, growing fast.',
    requirements: ['5+ years React', 'AI/ML interest', 'TypeScript', 'Copilot/AI tools'],
    tags: ['React', 'TypeScript', 'AI', 'Developer Tools'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/777111',
    matchScore: 94,
    remote: true,
  },
  {
    id: 'su-002',
    title: 'Frontend Engineer',
    company: 'Bolt (Checkout)',
    location: 'Remote',
    salary: '$140K - $175K',
    salaryMin: 140000,
    salaryMax: 175000,
    type: 'full-time',
    level: 'mid',
    postedAt: '2026-01-12T10:00:00Z',
    postedRelative: '1 day ago',
    description: 'One-click checkout for e-commerce. Help streamline online shopping.',
    requirements: ['3+ years React', 'E-commerce', 'TypeScript', 'Testing'],
    tags: ['React', 'TypeScript', 'E-commerce', 'Payments'],
    platform: 'wellfound',
    platformUrl: 'https://wellfound.com/jobs/888222',
    matchScore: 86,
    remote: true,
  },
  {
    id: 'su-003',
    title: 'Staff Frontend Engineer',
    company: 'Retool',
    location: 'San Francisco, CA',
    salary: '$200K - $250K',
    salaryMin: 200000,
    salaryMax: 250000,
    type: 'full-time',
    level: 'principal',
    postedAt: '2026-01-11T12:00:00Z',
    postedRelative: '2 days ago',
    description: 'Build tools for developers to build internal tools faster.',
    requirements: ['7+ years React', 'Low-code/No-code', 'TypeScript', 'DX'],
    tags: ['React', 'TypeScript', 'Low-code', 'Developer Tools'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/999333',
    matchScore: 88,
    remote: false,
  },
  {
    id: 'su-004',
    title: 'Senior UI Engineer',
    company: 'Framer',
    location: 'Remote',
    salary: '$165K - $205K',
    salaryMin: 165000,
    salaryMax: 205000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T15:00:00Z',
    postedRelative: '21 hours ago',
    description: 'Design and build the best website builder. Loved by designers worldwide.',
    requirements: ['5+ years frontend', 'Design tools', 'Canvas/WebGL', 'TypeScript'],
    tags: ['React', 'TypeScript', 'WebGL', 'Design'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/111444',
    matchScore: 92,
    remote: true,
  },
  // ===== ADDITIONAL UNIQUE ROLES =====
  {
    id: 'un-001',
    title: 'Senior Frontend Engineer - Games',
    company: 'Riot Games',
    location: 'Los Angeles, CA',
    salary: '$170K - $210K',
    salaryMin: 170000,
    salaryMax: 210000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-11T11:00:00Z',
    postedRelative: '2 days ago',
    description: 'Build web experiences for League of Legends and other games.',
    requirements: ['5+ years React', 'Game industry', 'TypeScript', 'Live services'],
    tags: ['React', 'TypeScript', 'Games', 'Live Services'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/222555',
    matchScore: 76,
    remote: false,
  },
  {
    id: 'un-002',
    title: 'Frontend Engineer - Accessibility',
    company: 'Microsoft',
    location: 'Redmond, WA',
    salary: '$155K - $195K',
    salaryMin: 155000,
    salaryMax: 195000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T09:00:00Z',
    postedRelative: '1 day ago',
    description: 'Make technology accessible to everyone. Work on inclusive design.',
    requirements: ['5+ years frontend', 'WCAG expertise', 'TypeScript', 'Screen readers'],
    tags: ['React', 'TypeScript', 'Accessibility', 'WCAG'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/333666',
    matchScore: 71,
    remote: false,
  },
  {
    id: 'un-003',
    title: 'Senior Frontend Engineer - Docs',
    company: 'Stripe',
    location: 'Remote',
    salary: '$165K - $205K',
    salaryMin: 165000,
    salaryMax: 205000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-13T05:00:00Z',
    postedRelative: '8 hours ago',
    description: 'Build the best developer documentation in the world. Docs are products.',
    requirements: ['5+ years React', 'Technical writing', 'TypeScript', 'Search'],
    tags: ['React', 'TypeScript', 'Documentation', 'Search'],
    platform: 'remoteok',
    platformUrl: 'https://remoteok.com/jobs/444777',
    matchScore: 88,
    remote: true,
  },
  {
    id: 'un-004',
    title: 'UI Engineer - Design Systems',
    company: 'Adobe',
    location: 'San Jose, CA',
    salary: '$160K - $200K',
    salaryMin: 160000,
    salaryMax: 200000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-10T13:00:00Z',
    postedRelative: '3 days ago',
    description: 'Build design systems used by creative professionals worldwide.',
    requirements: ['5+ years frontend', 'Design systems', 'TypeScript', 'Figma'],
    tags: ['React', 'TypeScript', 'Design Systems', 'Figma'],
    platform: 'glassdoor',
    platformUrl: 'https://glassdoor.com/jobs/555888',
    matchScore: 77,
    remote: false,
  },
  {
    id: 'un-005',
    title: 'Senior Frontend Engineer',
    company: 'Discord',
    location: 'San Francisco, CA',
    salary: '$180K - $220K',
    salaryMin: 180000,
    salaryMax: 220000,
    type: 'full-time',
    level: 'senior',
    postedAt: '2026-01-12T11:00:00Z',
    postedRelative: '1 day ago',
    description: 'Build the place where you belong. 150M+ monthly active users.',
    requirements: ['5+ years React', 'Real-time systems', 'TypeScript', 'Voice/Video'],
    tags: ['React', 'TypeScript', 'WebRTC', 'Real-time'],
    platform: 'linkedin',
    platformUrl: 'https://linkedin.com/jobs/666999',
    matchScore: 90,
    remote: false,
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class JobSearchService {
  private abortController: AbortController | null = null;

  /**
   * Search for jobs across multiple platforms in parallel
   */
  async search(filters: SearchFilters): Promise<SearchResult> {
    // Cancel previous search if running
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const startTime = Date.now();
    const platformsSearched: string[] = [];

    // Simulate parallel platform searches
    const searchPromises =
      filters.platforms.length > 0
        ? filters.platforms.map((p) => this.searchPlatform(p, filters))
        : ['linkedin', 'indeed', 'glassdoor', 'remoteok', 'wellfound', 'otta'].map((p) =>
            this.searchPlatform(p, filters)
          );

    const results = await Promise.allSettled(searchPromises);

    // Aggregate results
    let allJobs: Job[] = [];
    results.forEach((result, index) => {
      const platform =
        filters.platforms[index] ||
        ['linkedin', 'indeed', 'glassdoor', 'remoteok', 'wellfound', 'otta'][index];
      if (result.status === 'fulfilled' && result.value) {
        allJobs = allJobs.concat(result.value);
        platformsSearched.push(platform);
      }
    });

    // Deduplicate by job ID
    const seen = new Set<string>();
    const uniqueJobs = allJobs.filter((job) => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });

    // Sort by match score
    uniqueJobs.sort((a, b) => b.matchScore - a.matchScore);

    return {
      jobs: uniqueJobs,
      total: uniqueJobs.length,
      platformsSearched,
      searchTime: Date.now() - startTime,
      query: filters,
    };
  }

  /**
   * Search a specific platform
   */
  private async searchPlatform(platform: string, filters: SearchFilters): Promise<Job[]> {
    await delay(100 + Math.random() * 200); // Simulate network latency

    // If platform is 'indeed', call backend scraper endpoint
    if (platform === 'indeed') {
      try {
        const params = new URLSearchParams();
        params.set('q', filters.keywords || '');
        params.set('l', filters.location || '');
        params.set('page', '0');
        const resp = await fetch(`/api/v1/jobs/indeed/search?${params.toString()}`);
        if (!resp.ok) throw new Error('Indeed API request failed');
        const data = await resp.json();
        if (!data || !data.jobs) return [];

        // Map backend jobs to Job interface
        const mapped: Job[] = data.jobs.map((j: any) => ({
          id: j.id || `indeed-${Math.random().toString(36).slice(2, 9)}`,
          title: j.title || j.job_title || '',
          company: j.company || '',
          location: j.location || '',
          salary: j.salary || '$0',
          salaryMin: j.salaryMin || 0,
          salaryMax: j.salaryMax || 0,
          type:
            (j.jobType && (j.jobType.toLowerCase().includes('part') ? 'part-time' : 'full-time')) ||
            'full-time',
          level: (j.experienceLevel || 'mid') as Job['level'],
          postedAt: new Date().toISOString(),
          postedRelative: j.postedRelative || 'recent',
          description: j.snippet || j.description || '',
          requirements: j.requirements || [],
          tags: j.tags || [],
          platform: 'indeed',
          platformUrl: j.platformUrl || j.link || j.url || '',
          matchScore: j.matchScore || Math.floor(70 + Math.random() * 25),
          remote: (j.location || '').toLowerCase().includes('remote'),
        }));

        return mapped;
      } catch (error) {
        console.warn(
          '[JobSearch] Indeed fetch failed, falling back to local DB:',
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          (error as any)?.message || String(error)
        );
        // fallback to local filtering below
      }
    }

    return JOB_DATABASE.filter((job) => {
      // Platform filter
      if (job.platform !== platform) return false;

      // Remote filter
      if (filters.remoteOnly && !job.remote) return false;

      // Job type filter
      if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.type)) return false;

      // Experience level filter
      if (filters.experienceLevel !== 'any') {
        const levelMap: Record<string, string[]> = {
          entry: ['entry'],
          mid: ['mid', 'senior'],
          senior: ['senior', 'principal'],
          executive: ['principal', 'executive'],
        };
        const allowedLevels = levelMap[filters.experienceLevel] || [];
        if (!allowedLevels.includes(job.level)) return false;
      }

      // Salary filter
      if (filters.salaryMin && job.salaryMax < filters.salaryMin) return false;

      // Keyword search
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase().split(' ');
        const searchText =
          `${job.title} ${job.company} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
        const hasKeyword = keywords.some((kw) => searchText.includes(kw));
        if (!hasKeyword) return false;
      }

      // Location search
      if (filters.location && filters.location !== 'remote') {
        const locationMatch = job.location.toLowerCase().includes(filters.location.toLowerCase());
        if (!locationMatch) return false;
      }

      return true;
    });
  }

  /**
   * Get job details by ID
   */
  async getJobById(id: string): Promise<Job | null> {
    await delay(50);
    return JOB_DATABASE.find((job) => job.id === id) || null;
  }

  /**
   * Get trending jobs
   */
  async getTrendingJobs(): Promise<Job[]> {
    await delay(100);
    return JOB_DATABASE.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
  }

  /**
   * Get similar jobs
   */
  async getSimilarJobs(jobId: string): Promise<Job[]> {
    await delay(50);
    const job = JOB_DATABASE.find((j) => j.id === jobId);
    if (!job) return [];

    return JOB_DATABASE.filter(
      (j) => j.id !== jobId && j.tags.some((t) => job.tags.includes(t))
    ).slice(0, 4);
  }

  /**
   * Cancel ongoing search
   */
  cancelSearch(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const jobSearchService = new JobSearchService();
