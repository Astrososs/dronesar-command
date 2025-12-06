import { Helmet } from 'react-helmet-async';
import { Plane, Shield } from 'lucide-react';
import { useMissionState } from '@/hooks/useMissionState';
import { VideoFeedPanel } from '@/components/VideoFeedPanel';
import { TacticalMap } from '@/components/TacticalMap';
import { MissionLog } from '@/components/MissionLog';
import { StatsBar } from '@/components/StatsBar';
import { AlertBanner } from '@/components/AlertBanner';
import { QuickActions } from '@/components/QuickActions';
import { ViewSwitcher } from '@/components/ViewSwitcher';

const Index = () => {
  const {
    state,
    setVideoRef,
    handleVideoUpload,
    handleTimeUpdate,
    handleDurationChange,
    handlePlayPause,
    toggleGpsTracking,
    setViewMode,
    resetMission,
    dismissAlert,
    getStats,
  } = useMissionState();

  const stats = getStats();

  const renderMainContent = () => {
    switch (state.viewMode) {
      case 'map':
        return (
          <div className="h-full">
            <TacticalMap
              currentTime={state.currentTime}
              duration={state.duration}
              triggeredEvents={state.triggeredEvents}
              rescuerPosition={state.rescuerPosition}
              gpsTrackingEnabled={state.gpsTrackingEnabled}
            />
          </div>
        );
      case 'video':
        return (
          <div className="h-full">
            <VideoFeedPanel
              videoUrl={state.videoUrl}
              isPlaying={state.isPlaying}
              currentTime={state.currentTime}
              duration={state.duration}
              onVideoUpload={handleVideoUpload}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onPlayPause={handlePlayPause}
              setVideoRef={setVideoRef}
            />
          </div>
        );
      case 'log':
        return (
          <div className="h-full">
            <MissionLog events={state.triggeredEvents} />
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            {/* Left Column - Video & Map */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="flex-1 min-h-[250px]">
                <VideoFeedPanel
                  videoUrl={state.videoUrl}
                  isPlaying={state.isPlaying}
                  currentTime={state.currentTime}
                  duration={state.duration}
                  onVideoUpload={handleVideoUpload}
                  onTimeUpdate={handleTimeUpdate}
                  onDurationChange={handleDurationChange}
                  onPlayPause={handlePlayPause}
                  setVideoRef={setVideoRef}
                />
              </div>
              <div className="flex-1 min-h-[250px]">
                <TacticalMap
                  currentTime={state.currentTime}
                  duration={state.duration}
                  triggeredEvents={state.triggeredEvents}
                  rescuerPosition={state.rescuerPosition}
                  gpsTrackingEnabled={state.gpsTrackingEnabled}
                />
              </div>
            </div>

            {/* Right Column - Mission Log */}
            <div className="lg:col-span-1 min-h-[400px] lg:min-h-0">
              <MissionLog events={state.triggeredEvents} />
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>SAR Command & Control | Drone Operations Dashboard</title>
        <meta
          name="description"
          content="Command & Control Dashboard for Search and Rescue Drone Operations. Real-time mission coordination and AI-powered detection system."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col scanlines">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary/20 rounded-sm border border-primary/40">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-display font-bold text-primary text-glow-primary tracking-wide">
                    SAR COMMAND
                  </h1>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Drone Operations Center
                  </p>
                </div>
              </div>

              <StatsBar stats={stats} />
              <ViewSwitcher currentView={state.viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </header>

        {/* Alert Banner */}
        {state.currentAlert && (
          <div className="px-4 pt-3">
            <AlertBanner alert={state.currentAlert} onDismiss={dismissAlert} />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-hidden">
          {renderMainContent()}
        </main>

        {/* Footer - Quick Actions */}
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm px-4 py-3">
          <QuickActions
            gpsTrackingEnabled={state.gpsTrackingEnabled}
            onToggleGps={toggleGpsTracking}
            onReset={resetMission}
          />
        </footer>
      </div>
    </>
  );
};

export default Index;
