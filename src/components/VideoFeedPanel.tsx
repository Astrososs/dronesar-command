import { useRef, useCallback } from 'react';
import { Upload, Play, Pause, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HUD } from './HUD';
import { getDronePosition } from '@/data/flightPath';
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
}
export const VideoFeedPanel = ({
  videoUrl,
  isPlaying,
  currentTime,
  duration,
  onVideoUpload,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  setVideoRef
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
  return <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-primary" />
          <span className="panel-title">Live Feed</span>
        </div>
        <div className="flex items-center gap-2">
          {videoUrl && <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-primary/20 hover:text-primary" onClick={togglePlayPause}>
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </Button>}
          <span className="text-xs text-muted-foreground">
            {isPlaying ? 'STREAMING' : videoUrl ? 'PAUSED' : 'NO SIGNAL'}
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-background/50 overflow-hidden">
        {videoUrl ? <>
            <video ref={handleVideoRef} src={videoUrl} className="w-full h-full object-contain" onTimeUpdate={e => onTimeUpdate(e.currentTarget.currentTime)} onDurationChange={e => onDurationChange(e.currentTarget.duration)} onPlay={() => onPlayPause(true)} onPause={() => onPlayPause(false)} onEnded={() => onPlayPause(false)} />
            <HUD isPlaying={isPlaying} currentTime={currentTime} dronePosition={dronePosition} />
          </> : <div className="absolute inset-0 flex items-center justify-center cyber-grid">
            <div className="relative z-10 flex-col gap-5 p-10 bg-card/50 rounded-lg border border-border shadow-sm flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center">
                <Upload className="w-7 h-7 text-primary/70" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-foreground mb-1">No video feed detected</p>
                <p className="text-sm text-muted-foreground">
                  Upload drone footage to begin mission analysis
                </p>
              </div>
              <Button variant="outline" className="mt-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </div>
          </div>}

        {/* Progress bar */}
        {videoUrl && <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
            <div className="h-full bg-primary transition-all duration-100" style={{
          width: `${progress * 100}%`
        }} />
          </div>}
      </div>
    </div>;
};