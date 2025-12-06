import { useState, useCallback, useRef, useEffect } from 'react';
import { missionEvents, MissionEvent } from '@/data/missionEvents';
import { uploadVideo as vssUploadVideo, getFileInfo } from '@/services/vssApi';

export type ViewMode = 'split' | 'map' | 'video' | 'log' | 'chat';
export type VssProcessingStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

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
  // VSS integration state
  vssFileId: string | null;
  vssProcessingStatus: VssProcessingStatus;
  vssError: string | null;
  useVssAnalysis: boolean;
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
    // VSS integration defaults
    vssFileId: null,
    vssProcessingStatus: 'idle',
    vssError: null,
    useVssAnalysis: true, // Enable VSS by default
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastCheckedTime = useRef<number>(0);
  const processingPollRef = useRef<NodeJS.Timeout | null>(null);

  // Check for new events based on current time (fallback for hardcoded events)
  useEffect(() => {
    // Only use hardcoded events if VSS analysis is disabled or no file is being processed
    if (state.useVssAnalysis && state.vssFileId) return;

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
  }, [state.currentTime, state.triggeredEvents, state.useVssAnalysis, state.vssFileId]);

  // Clear alert after 5 seconds
  useEffect(() => {
    if (state.currentAlert) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, currentAlert: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.currentAlert]);

  // Poll for VSS processing status with timeout
  const pollCountRef = useRef<number>(0);
  const MAX_POLL_ATTEMPTS = 60; // 3 minutes max (60 * 3 seconds)

  const pollProcessingStatus = useCallback(async (fileId: string) => {
    pollCountRef.current += 1;
    
    // Timeout after max attempts
    if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
      console.error('VSS processing timeout after', MAX_POLL_ATTEMPTS, 'attempts');
      setState(prev => ({ 
        ...prev, 
        vssProcessingStatus: 'error',
        vssError: 'Processing timeout - VSS backend may be unavailable'
      }));
      if (processingPollRef.current) {
        clearInterval(processingPollRef.current);
        processingPollRef.current = null;
      }
      return;
    }

    try {
      const fileInfo = await getFileInfo(fileId);
      console.log('VSS file status:', fileInfo.status, '- attempt', pollCountRef.current);
      
      if (fileInfo.status === 'completed' || fileInfo.status === 'ready') {
        setState(prev => ({ ...prev, vssProcessingStatus: 'ready', vssError: null }));
        if (processingPollRef.current) {
          clearInterval(processingPollRef.current);
          processingPollRef.current = null;
        }
        pollCountRef.current = 0;
      } else if (fileInfo.status === 'failed' || fileInfo.status === 'error') {
        setState(prev => ({ 
          ...prev, 
          vssProcessingStatus: 'error',
          vssError: fileInfo.error || 'Video processing failed'
        }));
        if (processingPollRef.current) {
          clearInterval(processingPollRef.current);
          processingPollRef.current = null;
        }
        pollCountRef.current = 0;
      }
      // else still processing, continue polling
    } catch (error) {
      console.error('Failed to check processing status:', error);
      // Don't immediately fail - VSS might be temporarily unavailable
      // After several failures, show error
      if (pollCountRef.current >= 5) {
        setState(prev => ({ 
          ...prev, 
          vssProcessingStatus: 'error',
          vssError: error instanceof Error ? error.message : 'Cannot reach VSS backend'
        }));
        if (processingPollRef.current) {
          clearInterval(processingPollRef.current);
          processingPollRef.current = null;
        }
        pollCountRef.current = 0;
      }
    }
  }, []);

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
  }, []);

  const handleVideoUpload = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    
    setState((prev) => ({
      ...prev,
      videoFile: file,
      videoUrl: url,
      currentTime: 0,
      triggeredEvents: [],
      isPlaying: false,
      vssProcessingStatus: 'uploading',
      vssFileId: null,
      vssError: null,
    }));
    lastCheckedTime.current = 0;

    // Upload to VSS if analysis is enabled
    if (state.useVssAnalysis) {
      try {
        console.log('Uploading video to VSS...');
        const response = await vssUploadVideo(file);
        console.log('VSS upload success, file ID:', response.id);
        
        // Reset poll counter
        pollCountRef.current = 0;
        
        setState(prev => ({
          ...prev,
          vssFileId: response.id,
          vssProcessingStatus: 'processing',
          vssError: null,
        }));

        // Start polling for processing status
        processingPollRef.current = setInterval(() => {
          pollProcessingStatus(response.id);
        }, 3000);

      } catch (error) {
        console.error('VSS upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // Check for specific error types
        let userFriendlyError = errorMessage;
        if (errorMessage.includes('405')) {
          userFriendlyError = 'VSS backend not reachable (405 - check NGINX proxy config)';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          userFriendlyError = 'Cannot connect to VSS backend - check if via-server is running';
        }
        
        setState(prev => ({
          ...prev,
          vssProcessingStatus: 'error',
          vssError: userFriendlyError,
        }));
      }
    }
  }, [state.useVssAnalysis, pollProcessingStatus]);

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

  const toggleVssAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      useVssAnalysis: !prev.useVssAnalysis,
    }));
  }, []);

  // Add VSS-detected event
  const addVssEvent = useCallback((event: MissionEvent) => {
    setState(prev => ({
      ...prev,
      triggeredEvents: [...prev.triggeredEvents, event],
      currentAlert: event.severity === 'critical' ? event : prev.currentAlert,
    }));
  }, []);

  const resetMission = useCallback(() => {
    if (state.videoUrl) {
      URL.revokeObjectURL(state.videoUrl);
    }
    if (processingPollRef.current) {
      clearInterval(processingPollRef.current);
      processingPollRef.current = null;
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
      vssFileId: null,
      vssProcessingStatus: 'idle',
      vssError: null,
      useVssAnalysis: true,
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingPollRef.current) {
        clearInterval(processingPollRef.current);
      }
    };
  }, []);

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
    toggleVssAnalysis,
    addVssEvent,
  };
};
