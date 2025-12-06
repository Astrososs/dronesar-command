import { useRef, useCallback } from 'react';
import { Upload, Play, Pause, Video, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HUD } from './HUD';
import { getDronePosition } from '@/data/flightPath';
import type { VssProcessingStatus } from '@/hooks/useMissionState';
import { cn } from '@/lib/utils';

interface VideoFeedPanelProps {
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onVideoUpload: (file: File) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayPause: (playing: boolean) => void;
  setVideoRef: (ref: HTMLVideoElement | null) => void;
  // VSS integration props
  vssProcessingStatus?: VssProcessingStatus;
  vssError?: string | null;
  vssFileId?: string | null;
  isAnalyzing?: boolean;
}

const ProcessingStatusBadge = ({ 
  status, 
  error,
  isAnalyzing,
}: { 
  status: VssProcessingStatus; 
  error?: string | null;
  isAnalyzing?: boolean;
}) => {
  const getStatusConfig = () => {
    // Show analyzing state when VLM analysis is running
    if (isAnalyzing) {
      return { icon: Loader2, text: 'Analyzing Video...', className: 'text-primary', animate: true };
    }
    
    switch (status) {
      case 'uploading':
        return { icon: Loader2, text: 'Uploading to VSS...', className: 'text-warning', animate: true };
      case 'processing':
        return { icon: Loader2, text: 'AI Processing...', className: 'text-primary', animate: true };
      case 'ready':
        return { icon: CheckCircle2, text: 'AI Ready', className: 'text-success', animate: false };
      case 'error':
        return { icon: AlertCircle, text: error || 'Processing Error', className: 'text-destructive', animate: false };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', config.className)}>
      <Icon className={cn('w-3 h-3', config.animate && 'animate-spin')} />
      <span>{config.text}</span>
    </div>
  );
};

export const VideoFeedPanel = ({
  videoUrl,
  isPlaying,
  currentTime,
  duration,
  onVideoUpload,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  setVideoRef,
  vssProcessingStatus = 'idle',
  vssError,
  vssFileId,
  isAnalyzing = false,
}: VideoFeedPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file);
    }
  }, [onVideoUpload]);

  const handleVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
    setVideoRef(ref);
  }, [setVideoRef]);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const progress = duration > 0 ? currentTime / duration : 0;
  const dronePosition = getDronePosition(progress);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <span className="panel-title">Live Feed</span>
        </div>
        <div className="flex items-center gap-3">
          {/* VSS Processing Status */}
          {(vssProcessingStatus !== 'idle' || isAnalyzing) && (
            <ProcessingStatusBadge 
              status={vssProcessingStatus} 
              error={vssError} 
              isAnalyzing={isAnalyzing}
            />
          )}
          
          {videoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:bg-primary/20 hover:text-primary"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {isPlaying ? 'STREAMING' : videoUrl ? 'PAUSED' : 'NO SIGNAL'}
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-background/50 overflow-hidden">
        {videoUrl ? (
          <>
            <video
              ref={handleVideoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
              onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
              onPlay={() => onPlayPause(true)}
              onPause={() => onPlayPause(false)}
              onEnded={() => onPlayPause(false)}
            />
            <HUD 
              isPlaying={isPlaying} 
              currentTime={currentTime} 
              dronePosition={dronePosition}
              vssConnected={vssProcessingStatus === 'ready'}
              vssFileId={vssFileId}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center cyber-grid">
            <div
              className="relative z-10 flex flex-col items-center gap-6 p-12 bg-gradient-to-b from-card to-card/80 rounded-2xl border border-border/60 shadow-lg cursor-pointer group transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:scale-[1.02]"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/40 flex items-center justify-center group-hover:border-primary/60 group-hover:bg-primary/15 transition-all duration-300">
                <Upload className="w-8 h-8 text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-foreground">Upload Drone Footage</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Drag & drop your video file here or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <Video className="w-4 h-4" />
                <span>Supports MP4, MOV, WebM • AI Analysis Enabled</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        )}

        {/* Progress bar */}
        {videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
