import { Wifi, Battery, MapPin, Mountain, Clock, Circle, Brain, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDProps {
  isPlaying: boolean;
  currentTime: number;
  dronePosition: [number, number];
  // VSS integration
  vssConnected?: boolean;
  vssFileId?: string | null;
}

export const HUD = ({ 
  isPlaying, 
  currentTime, 
  dronePosition,
  vssConnected = false,
  vssFileId,
}: HUDProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const signalStrength = 94;
  const batteryLevel = 87;
  const altitude = 45 + Math.sin(currentTime * 0.5) * 5;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/60" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/60" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/60" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/60" />

      {/* Center crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-primary/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-primary/60" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-primary/60" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-primary/60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border border-primary/60 rounded-full" />
        </div>
      </div>

      {/* Top left - AI Status */}
      <div className="absolute top-6 left-6 flex flex-col gap-1">
        {/* VSS AI Status */}
        <div className="hud-element flex items-center gap-2">
          <Brain className={cn(
            'w-3 h-3',
            vssConnected ? 'text-success' : 'text-warning'
          )} />
          <span className={cn(
            vssConnected ? 'text-success' : 'text-warning',
            'text-glow-primary'
          )}>
            VSS: {vssConnected ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
        
        {/* Local AI Status */}
        <div className="hud-element flex items-center gap-2">
          <Circle className={cn(
            'w-2 h-2',
            isPlaying ? 'fill-primary text-primary' : 'fill-warning text-warning'
          )} />
          <span className="text-primary text-glow-primary">
            AI: {isPlaying ? 'ANALYZING' : 'IDLE'}
          </span>
        </div>
        
        <div className="hud-element flex items-center gap-2">
          <Wifi className="w-3 h-3 text-primary" />
          <span className="text-primary">{signalStrength}%</span>
        </div>
      </div>

      {/* Top right - Battery, Recording & Model */}
      <div className="absolute top-6 right-6 flex flex-col gap-1 items-end">
        <div className="hud-element flex items-center gap-2">
          <Battery className="w-3 h-3 text-primary" />
          <span className="text-primary">{batteryLevel}%</span>
        </div>
        <div className="hud-element flex items-center gap-2">
          <Circle className={cn(
            'w-2 h-2',
            isPlaying ? 'fill-destructive text-destructive blink' : 'fill-muted text-muted-foreground'
          )} />
          <span className={isPlaying ? 'text-destructive' : 'text-muted-foreground'}>
            {isPlaying ? 'REC' : 'STOP'}
          </span>
        </div>
        {/* Model indicator */}
        {vssConnected && (
          <div className="hud-element flex items-center gap-2">
            <Cpu className="w-3 h-3 text-accent" />
            <span className="text-accent text-xs">VILA-1.5</span>
          </div>
        )}
      </div>

      {/* Bottom left - GPS */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1">
        <div className="hud-element flex items-center gap-2">
          <MapPin className="w-3 h-3 text-accent" />
          <span className="text-accent text-glow-accent">
            {dronePosition[1].toFixed(4)}°N, {Math.abs(dronePosition[0]).toFixed(4)}°W
          </span>
        </div>
        <div className="hud-element flex items-center gap-2">
          <Mountain className="w-3 h-3 text-accent" />
          <span className="text-accent">ALT: {altitude.toFixed(1)}m</span>
        </div>
        {/* File ID indicator */}
        {vssFileId && (
          <div className="hud-element flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              ID: {vssFileId.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>

      {/* Bottom right - Time */}
      <div className="absolute bottom-6 right-6">
        <div className="hud-element flex items-center gap-2">
          <Clock className="w-3 h-3 text-primary" />
          <span className="text-primary font-display">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div 
          className="absolute w-full h-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent"
          style={{
            top: `${(currentTime * 10) % 100}%`,
            transition: 'top 0.1s linear',
          }}
        />
      </div>
    </div>
  );
};
