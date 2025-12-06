import { useState, useEffect, useCallback, useRef } from 'react';
import { createAlert, getRecentAlerts, deleteAlert } from '@/services/vssApi';
import { mapVssToSarEvent, type VssAlertEvent, type VssDetectionType } from '@/types/vss';
import type { MissionEvent } from '@/data/missionEvents';

export interface UseVssAlertsOptions {
  fileId: string | null;
  enabled?: boolean;
  pollInterval?: number;
  onNewEvent?: (event: MissionEvent) => void;
}

export const useVssAlerts = ({
  fileId,
  enabled = true,
  pollInterval = 2000,
  onNewEvent,
}: UseVssAlertsOptions) => {
  const [alertId, setAlertId] = useState<string | null>(null);
  const [events, setEvents] = useState<MissionEvent[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const seenEventIds = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Convert VSS alert to MissionEvent
  const convertToMissionEvent = useCallback((alert: VssAlertEvent): MissionEvent => {
    const eventMapping = mapVssToSarEvent(alert.event_type as VssDetectionType);
    
    // Generate coordinates - in real implementation, these would come from GPS data
    // For now, we'll generate based on bounding box position if available
    const baseLng = -122.4194;
    const baseLat = 37.7749;
    const offsetLng = alert.bounding_box ? (alert.bounding_box.x / 1920) * 0.01 : Math.random() * 0.01;
    const offsetLat = alert.bounding_box ? (alert.bounding_box.y / 1080) * 0.01 : Math.random() * 0.01;
    
    const messageMap: Record<VssDetectionType, string> = {
      person: 'Person detected - possible survivor',
      fire: 'Active fire detected - danger zone',
      smoke: 'Smoke detected - potential fire hazard',
      vehicle: 'Vehicle detected - possible rescue unit',
      debris: 'Debris field detected - structural hazard',
      animal: 'Animal detected - possible rescue target',
    };

    return {
      id: `vss-${alert.id}`,
      timestamp: alert.timestamp,
      type: eventMapping.type,
      severity: eventMapping.severity,
      message: messageMap[alert.event_type as VssDetectionType] || `${alert.event_type} detected`,
      probability: Math.round(alert.confidence * 100),
      coordinates: [baseLng + offsetLng, baseLat + offsetLat],
    };
  }, []);

  // Setup alert for file
  const setupAlert = useCallback(async () => {
    if (!fileId) return;

    try {
      setError(null);
      const alert = await createAlert(fileId, ['person', 'fire', 'smoke', 'vehicle', 'debris']);
      setAlertId(alert.id);
      return alert.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup alert');
      return null;
    }
  }, [fileId]);

  // Poll for new alerts
  const pollAlerts = useCallback(async () => {
    if (!fileId) return;

    try {
      const recentAlerts = await getRecentAlerts(fileId);
      
      const newEvents: MissionEvent[] = [];
      
      for (const alert of recentAlerts) {
        if (!seenEventIds.current.has(alert.id)) {
          seenEventIds.current.add(alert.id);
          const missionEvent = convertToMissionEvent(alert);
          newEvents.push(missionEvent);
          onNewEvent?.(missionEvent);
        }
      }

      if (newEvents.length > 0) {
        setEvents(prev => [...prev, ...newEvents]);
      }
    } catch (err) {
      console.error('Failed to poll alerts:', err);
    }
  }, [fileId, convertToMissionEvent, onNewEvent]);

  // Start/stop polling
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setIsPolling(true);
    pollAlerts();
    pollIntervalRef.current = setInterval(pollAlerts, pollInterval);
  }, [pollAlerts, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup alert
  const cleanup = useCallback(async () => {
    stopPolling();
    if (alertId) {
      try {
        await deleteAlert(alertId);
      } catch {
        // Ignore cleanup errors
      }
      setAlertId(null);
    }
    setEvents([]);
    seenEventIds.current.clear();
  }, [alertId, stopPolling]);

  // Auto-setup when fileId changes
  useEffect(() => {
    if (fileId && enabled) {
      seenEventIds.current.clear();
      setEvents([]);
      setupAlert().then(id => {
        if (id) {
          startPolling();
        }
      });
    }

    return () => {
      cleanup();
    };
  }, [fileId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    alertId,
    events,
    isPolling,
    error,
    setupAlert,
    startPolling,
    stopPolling,
    cleanup,
  };
};
