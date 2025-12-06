import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVssConnection } from '@/hooks/useVssConnection';
import { cn } from '@/lib/utils';

interface VssStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const VssStatus = ({ className, showDetails = false }: VssStatusProps) => {
  const { status, health, lastChecked, isLoading, reconnect } = useVssConnection();

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-success';
      case 'connecting':
        return 'text-warning';
      case 'disconnected':
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-3 h-3 animate-spin" />;
    }
    switch (status) {
      case 'connected':
        return <Wifi className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <WifiOff className="w-3 h-3" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'VSS Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'VSS Offline';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex items-center gap-1.5', getStatusColor())}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
      
      {showDetails && (
        <>
          {health.message && (
            <span className="text-xs text-muted-foreground">
              ({health.message})
            </span>
          )}
          
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last: {lastChecked.toLocaleTimeString()}
            </span>
          )}
          
          {(status === 'disconnected' || status === 'error') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs"
              onClick={reconnect}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
            </Button>
          )}
        </>
      )}
    </div>
  );
};
