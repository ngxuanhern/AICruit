
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, Star, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Intelligent Resume Parsing',
    description: 'Automatically extract key information from resumes, saving hours of manual data entry.',
    animationDelay: 'delay-200',
  },
  {
    icon: Star,
    title: 'AI-Powered Candidate Ranking',
    description: 'Objectively rank candidates against job descriptions using advanced AI algorithms.',
    animationDelay: 'delay-400',
  },
  {
    icon: ShieldCheck,
    title: 'Authenticity Verification',
    description: 'Detect potentially AI-generated application content to ensure genuine submissions.',
    animationDelay: 'delay-600',
  },
];

export function LandingFeatures() {
  return (
    <section className="py-16 md:py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Why AICruit?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Leverage cutting-edge AI to make your recruitment process more efficient and effective.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`animate-in fade-in slide-in-from-bottom-10 duration-500 ${feature.animationDelay}`}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
                <CardHeader className="items-center text-center">
                  <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
