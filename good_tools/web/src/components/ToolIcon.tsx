import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function ToolIcon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[name] || Icons.Wrench;
  return <Icon className={className} />;
}
