import { useState, useEffect, useCallback, useRef } from 'react';
import { checkHealth, checkLiveness } from '@/services/vssApi';
import type { VssHealthStatus } from '@/types/vss';

export interface VssConnectionState {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  health: VssHealthStatus;
  lastChecked: Date | null;
  retryCount: number;
}

export const useVssConnection = (pollInterval = 30000) => {
  const [state, setState] = useState<VssConnectionState>({
    status: 'connecting',
    health: { status: 'unknown' },
    lastChecked: null,
    retryCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'connecting' }));

    try {
      const [healthResult, isLive] = await Promise.all([
        checkHealth(),
        checkLiveness(),
      ]);

      setState({
        status: healthResult.status === 'healthy' && isLive ? 'connected' : 'error',
        health: healthResult,
        lastChecked: new Date(),
        retryCount: 0,
      });
    } catch (error) {
      setState(prev => ({
        status: 'disconnected',
        health: { 
          status: 'unknown', 
          message: error instanceof Error ? error.message : 'Connection failed' 
        },
        lastChecked: new Date(),
        retryCount: prev.retryCount + 1,
      }));
    }
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(checkConnection, pollInterval);
  }, [checkConnection, pollInterval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reconnect = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    checkConnection();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [checkConnection, startPolling, stopPolling]);

  return {
    ...state,
    isConnected: state.status === 'connected',
    isLoading: state.status === 'connecting',
    reconnect,
    checkConnection,
  };
};
