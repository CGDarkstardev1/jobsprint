import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PricingPage() {
  const tiers = [
    {
      name: 'Starter',
      price: '$0',
      description: 'Perfect for casual job seekers',
      features: [
        '5 AI Applications / day',
        'Basic Resume Parsing',
        'Manual Job Search',
        'Standard Support',
        'Privacy-First Processing'
      ],
      cta: 'Current Plan',
      current: true
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For serious candidates who want speed',
      features: [
        'Unlimited AI Applications',
        'Bleeding Edge ATS Evasion',
        'Multi-Threaded Auto-Apply',
        'Priority Resume Tailoring',
        'Stealth Mode Activated',
        '24/7 Priority Support'
      ],
      cta: 'Upgrade to Pro',
      popular: true
    },
    {
      name: 'Lifetime',
      price: '$149',
      period: 'one-time',
      description: 'Own the tools forever. No subscriptions.',
      features: [
        'All Pro Features Included',
        'Lifetime Updates',
        'Early Access to Beta Features',
        'Private Discord Channel',
        'Direct Developer Access'
      ],
      cta: 'Get Lifetime Access'
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Stop paying monthly for "credits". Get full access to the most powerful job search automation tool.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col relative ${tier.popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}>
            {tier.popular && (
              <Badge className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-6">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={tier.current ? "outline" : "default"}
                disabled={tier.current}
              >
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center bg-muted/50 rounded-xl p-8">
        <h3 className="text-xl font-semibold mb-2">30-Day Money-Back Guarantee</h3>
        <p className="text-muted-foreground">
          If you don't get an interview within 30 days, we'll refund your subscription. No questions asked.
        </p>
      </div>
    </div>
  );
}
