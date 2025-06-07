import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export function PageTitle({ title, description, icon: Icon, className }: PageTitleProps) {
  return (
    <div className={cn("mb-6 flex items-center space-x-3", className)}>
      {Icon && <Icon className="h-8 w-8 text-primary" />}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
