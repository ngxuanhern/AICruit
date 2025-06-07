
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="py-20 md:py-32 text-center bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 animate-in fade-in zoom-in-90 duration-700">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Revolutionize Your Hiring with <span className="text-primary">AICruit</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
          Streamline candidate screening, AI-powered ranking, and authenticity checks. Find the best talent, faster and smarter.
        </p>
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
          <Link href="/dashboard" passHref legacyBehavior>
            <Button size="lg" className="group shadow-lg hover:shadow-primary/50 transition-shadow">
              Explore Dashboard <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
