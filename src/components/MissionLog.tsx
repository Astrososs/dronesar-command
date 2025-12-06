import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, AlertTriangle, Users, Shield, Clock } from 'lucide-react';
import { MissionEvent, getSeverityClass, getEventTypeColor } from '@/data/missionEvents';

interface MissionLogProps {
  events: MissionEvent[];
}

export const MissionLog = ({ events }: MissionLogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'victim':
        return <Users className="w-4 h-4" />;
      case 'hazard':
        return <AlertTriangle className="w-4 h-4" />;
      case 'rescuer':
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="panel-title">Mission Log</span>
        </div>
        <span className="text-xs text-muted-foreground">{events.length} events</span>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-2 space-y-2">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full border border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No events detected</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Events will appear as video plays
              </p>
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                className="animate-slide-in-right p-3 bg-secondary/30 border border-border rounded-sm hover:bg-secondary/50 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 rounded-sm"
                    style={{
                      backgroundColor: `${getEventTypeColor(event.type)}20`,
                      color: getEventTypeColor(event.type),
                    }}
                  >
                    {getEventIcon(event.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: getEventTypeColor(event.type) }}
                        >
                          {event.type}
                        </span>
                        <span className={getSeverityClass(event.severity)}>
                          {event.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-mono">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90 leading-snug mb-2">
                      {event.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${event.probability}%`,
                                backgroundColor: getEventTypeColor(event.type),
                              }}
                            />
                          </div>
                          <span className="text-xs text-foreground font-mono">
                            {event.probability}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
