import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';
import { appConfig } from '@/lib/app-config';

export function MockModeIndicator() {
  if (!appConfig.mockMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant="outline" className="gap-1.5 border-warning bg-warning/60 text-white px-3 py-1.5 shadow-lg">
        <FlaskConical className="h-4 w-4" />
        Mock Mode
      </Badge>
    </div>
  );
}
