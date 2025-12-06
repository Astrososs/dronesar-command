// VSS API Service Layer
import type { 
  VssHealthStatus, 
  VssFile, 
  VssUploadResponse, 
  VssAlert, 
  VssAlertEvent,
  VssChatRequest,
  VssChatResponse,
  VssSummaryRequest,
  VssSummaryResponse
} from '@/types/vss';

// Get API base URL from environment or default to /api for nginx proxy
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_VSS_API_URL || '/api';
};

// Health check endpoints
export const checkHealth = async (): Promise<VssHealthStatus> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health/ready`);
    if (response.ok) {
      return { status: 'healthy' };
    }
    return { status: 'unhealthy', message: `Status: ${response.status}` };
  } catch (error) {
    return { status: 'unknown', message: error instanceof Error ? error.message : 'Connection failed' };
  }
};

export const checkLiveness = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health/live`);
    return response.ok;
  } catch {
    return false;
  }
};

// File management
export const uploadVideo = async (file: File): Promise<VssUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'vision');
  formData.append('media_type', 'video');

  const response = await fetch(`${getApiBaseUrl()}/files`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  return response.json();
};

export const listFiles = async (): Promise<VssFile[]> => {
  const response = await fetch(`${getApiBaseUrl()}/files`);
  if (!response.ok) {
    throw new Error('Failed to list files');
  }
  return response.json();
};

export const getFileInfo = async (fileId: string): Promise<VssFile> => {
  const response = await fetch(`${getApiBaseUrl()}/files/${fileId}`);
  if (!response.ok) {
    throw new Error('Failed to get file info');
  }
  return response.json();
};

export const deleteFile = async (fileId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/files/${fileId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete file');
  }
};

// Alert management
export const createAlert = async (
  fileId: string, 
  events: string[] = ['person', 'fire', 'smoke', 'vehicle', 'debris'],
  callbackUrl?: string
): Promise<VssAlert> => {
  const response = await fetch(`${getApiBaseUrl()}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_id: fileId,
      events,
      callback_url: callbackUrl || '/via-alert-callback',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create alert: ${error}`);
  }

  return response.json();
};

export const getRecentAlerts = async (fileId?: string): Promise<VssAlertEvent[]> => {
  const url = fileId 
    ? `${getApiBaseUrl()}/alerts/recent?file_id=${fileId}`
    : `${getApiBaseUrl()}/alerts/recent`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to get recent alerts');
  }
  return response.json();
};

export const deleteAlert = async (alertId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/alerts/${alertId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete alert');
  }
};

// Chat / Q&A
export const sendChatMessage = async (request: VssChatRequest): Promise<VssChatResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat failed: ${error}`);
  }

  return response.json();
};

// Streaming chat
export const streamChatMessage = async (
  request: VssChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void
): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, stream: true }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Stream failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          onComplete();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
  onComplete();
};

// Summarization
export const summarizeVideo = async (request: VssSummaryRequest): Promise<VssSummaryResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summarization failed: ${error}`);
  }

  return response.json();
};

// Live stream support
export const startLiveStream = async (rtspUrl: string): Promise<{ stream_id: string }> => {
  const response = await fetch(`${getApiBaseUrl()}/live-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: rtspUrl }),
  });

  if (!response.ok) {
    throw new Error('Failed to start live stream');
  }

  return response.json();
};

export const stopLiveStream = async (streamId: string): Promise<void> => {
  const response = await fetch(`${getApiBaseUrl()}/live-stream/${streamId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to stop live stream');
  }
};
