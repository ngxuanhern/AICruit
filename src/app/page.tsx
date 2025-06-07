
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-0">
      <LandingHero />
      <LandingFeatures />
      <section className="py-16 md:py-24 text-center bg-background">
        <div className="container mx-auto px-4 animate-in fade-in slide-in-from-bottom-10 duration-500 delay-500">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join leading companies in leveraging AI for smarter talent acquisition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" passHref legacyBehavior>
              <Button size="lg">
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/process" passHref legacyBehavior>
              <Button size="lg" variant="outline">
                Process First Application
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
