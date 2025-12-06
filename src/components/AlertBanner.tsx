import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MissionEvent } from '@/data/missionEvents';

interface AlertBannerProps {
  alert: MissionEvent | null;
  onDismiss: () => void;
}

export const AlertBanner = ({ alert, onDismiss }: AlertBannerProps) => {
  if (!alert) return null;

  return (
    <div className="animate-fade-in bg-destructive/20 border border-destructive/60 rounded-sm p-3 flex items-center gap-3 glow-border-destructive">
      <div className="flex items-center justify-center w-8 h-8 bg-destructive/30 rounded-sm blink">
        <AlertTriangle className="w-5 h-5 text-destructive" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
            Critical Alert
          </span>
          <span className="badge-critical">{alert.type}</span>
        </div>
        <p className="text-sm text-foreground truncate">{alert.message}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-destructive/20 text-destructive"
        onClick={onDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
