import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">JobSprint</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered job search automation platform. Find and apply to jobs faster.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/search" className="hover:text-foreground transition-colors">
                  Smart Job Search
                </Link>
              </li>
              <li>
                <Link to="/apply" className="hover:text-foreground transition-colors">
                  Auto-Apply
                </Link>
              </li>
              <li>
                <Link to="/resume" className="hover:text-foreground transition-colors">
                  Resume Tailoring
                </Link>
              </li>
              <li>
                <Link to="/resume" className="hover:text-foreground transition-colors">
                  ATS Checker
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} JobSprint AI Automation Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
