import { MapPin, Radio, Navigation, RotateCcw, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface QuickActionsProps {
  gpsTrackingEnabled: boolean;
  onToggleGps: () => void;
  onReset: () => void;
}

export const QuickActions = ({
  gpsTrackingEnabled,
  onToggleGps,
  onReset,
}: QuickActionsProps) => {
  const handleMarkLocation = () => {
    toast({
      title: "Location Marked",
      description: "Current position has been saved to mission log.",
    });
  };

  const handleRequestBackup = () => {
    toast({
      title: "Backup Requested",
      description: "Alert sent to nearby rescue units.",
      variant: "destructive",
    });
  };

  const handleNavigateToEvent = () => {
    toast({
      title: "Navigation Started",
      description: "Routing to nearest detected event.",
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs border-primary/40 text-primary hover:bg-primary/20 hover:text-primary hover:border-primary"
        onClick={handleMarkLocation}
      >
        <MapPin className="w-3 h-3 mr-1.5" />
        Mark Location
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs border-destructive/40 text-destructive hover:bg-destructive/20 hover:text-destructive hover:border-destructive"
        onClick={handleRequestBackup}
      >
        <Radio className="w-3 h-3 mr-1.5" />
        Request Backup
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs border-accent/40 text-accent hover:bg-accent/20 hover:text-accent hover:border-accent"
        onClick={handleNavigateToEvent}
      >
        <Navigation className="w-3 h-3 mr-1.5" />
        Navigate to Event
      </Button>

      <div className="h-6 w-px bg-border mx-1" />

      <Button
        variant="outline"
        size="sm"
        className={`h-8 px-3 text-xs ${
          gpsTrackingEnabled
            ? 'border-warning bg-warning/20 text-warning hover:bg-warning/30'
            : 'border-muted-foreground/40 text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        onClick={onToggleGps}
      >
        <Locate className="w-3 h-3 mr-1.5" />
        GPS {gpsTrackingEnabled ? 'ON' : 'OFF'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs border-muted-foreground/40 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onReset}
      >
        <RotateCcw className="w-3 h-3 mr-1.5" />
        Reset Mission
      </Button>
    </div>
  );
};
