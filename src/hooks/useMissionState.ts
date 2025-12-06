import { useState, useCallback, useRef, useEffect } from 'react';
import { missionEvents, MissionEvent } from '@/data/missionEvents';

export type ViewMode = 'split' | 'map' | 'video' | 'log';

export interface MissionState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  triggeredEvents: MissionEvent[];
  gpsTrackingEnabled: boolean;
  rescuerPosition: [number, number] | null;
  currentAlert: MissionEvent | null;
  viewMode: ViewMode;
  videoFile: File | null;
  videoUrl: string | null;
}

export interface MissionStats {
  elapsedTime: string;
  eventsCount: number;
  hazardsCount: number;
  victimsCount: number;
}

export const useMissionState = () => {
  const [state, setState] = useState<MissionState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    triggeredEvents: [],
    gpsTrackingEnabled: false,
    rescuerPosition: null,
    currentAlert: null,
    viewMode: 'split',
    videoFile: null,
    videoUrl: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastCheckedTime = useRef<number>(0);

  // Check for new events based on current time
  useEffect(() => {
    const currentTime = state.currentTime;
    
    if (currentTime > lastCheckedTime.current) {
      const newEvents = missionEvents.filter(
        (event) =>
          event.timestamp > lastCheckedTime.current &&
          event.timestamp <= currentTime &&
          !state.triggeredEvents.find((e) => e.id === event.id)
      );

      if (newEvents.length > 0) {
        setState((prev) => ({
          ...prev,
          triggeredEvents: [...prev.triggeredEvents, ...newEvents],
          currentAlert: newEvents.find((e) => e.severity === 'critical') || prev.currentAlert,
        }));
      }
    }
    
    lastCheckedTime.current = currentTime;
  }, [state.currentTime, state.triggeredEvents]);

  // Clear alert after 5 seconds
  useEffect(() => {
    if (state.currentAlert) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, currentAlert: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.currentAlert]);

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
  }, []);

  const handleVideoUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      videoFile: file,
      videoUrl: url,
      currentTime: 0,
      triggeredEvents: [],
      isPlaying: false,
    }));
    lastCheckedTime.current = 0;
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setState((prev) => ({ ...prev, duration }));
  }, []);

  const handlePlayPause = useCallback((playing: boolean) => {
    setState((prev) => ({ ...prev, isPlaying: playing }));
  }, []);

  const toggleGpsTracking = useCallback(() => {
    setState((prev) => ({
      ...prev,
      gpsTrackingEnabled: !prev.gpsTrackingEnabled,
      rescuerPosition: !prev.gpsTrackingEnabled ? [-122.4150, 37.7760] : null,
    }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const resetMission = useCallback(() => {
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    setState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      triggeredEvents: [],
      gpsTrackingEnabled: false,
      rescuerPosition: null,
      currentAlert: null,
      viewMode: 'split',
      videoFile: null,
      videoUrl: null,
    });
    lastCheckedTime.current = 0;
  }, [state.videoUrl]);

  const dismissAlert = useCallback(() => {
    setState((prev) => ({ ...prev, currentAlert: null }));
  }, []);

  const getStats = useCallback((): MissionStats => {
    const minutes = Math.floor(state.currentTime / 60);
    const seconds = Math.floor(state.currentTime % 60);
    
    return {
      elapsedTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      eventsCount: state.triggeredEvents.length,
      hazardsCount: state.triggeredEvents.filter((e) => e.type === 'hazard').length,
      victimsCount: state.triggeredEvents.filter((e) => e.type === 'victim').length,
    };
  }, [state.currentTime, state.triggeredEvents]);

  return {
    state,
    videoRef,
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
  };
};
