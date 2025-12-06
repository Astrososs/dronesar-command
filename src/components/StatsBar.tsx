import { Clock, Activity, AlertTriangle, Users } from 'lucide-react';
import { MissionStats } from '@/hooks/useMissionState';

interface StatsBarProps {
  stats: MissionStats;
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  return (
    <div className="flex items-center gap-1 sm:gap-4 flex-wrap">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-sm">
        <Clock className="w-4 h-4 text-accent" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Elapsed</span>
          <span className="text-sm font-display text-accent text-glow-accent">{stats.elapsedTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-sm">
        <Activity className="w-4 h-4 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Events</span>
          <span className="text-sm font-display text-primary text-glow-primary">{stats.eventsCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-sm">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Hazards</span>
          <span className="text-sm font-display text-destructive text-glow-destructive">{stats.hazardsCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border rounded-sm">
        <Users className="w-4 h-4 text-success" />
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Victims</span>
          <span className="text-sm font-display text-success text-glow-primary">{stats.victimsCount}</span>
        </div>
      </div>
    </div>
  );
};
