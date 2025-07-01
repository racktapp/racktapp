
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="font-headline flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <div className="text-muted-foreground">{description}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
