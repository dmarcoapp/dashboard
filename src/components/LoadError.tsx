import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

// Takes the place of data a page could not load, so that a failed request never
// passes for an empty result.
export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
