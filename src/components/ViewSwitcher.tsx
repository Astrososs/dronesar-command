import { Map, Video, FileText, LayoutGrid } from 'lucide-react';
import { ViewMode } from '@/hooks/useMissionState';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewSwitcher = ({ currentView, onViewChange }: ViewSwitcherProps) => {
  const views: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'split', label: 'Split', icon: <LayoutGrid className="w-4 h-4" /> },
    { mode: 'map', label: 'Map', icon: <Map className="w-4 h-4" /> },
    { mode: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
    { mode: 'log', label: 'Log', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center bg-secondary/50 border border-border rounded-sm p-0.5">
      {views.map((view) => (
        <button
          key={view.mode}
          onClick={() => onViewChange(view.mode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm transition-all ${
            currentView === view.mode
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
};
