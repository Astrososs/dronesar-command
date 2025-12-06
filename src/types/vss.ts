// VSS API Types

export interface VssHealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  message?: string;
}

export interface VssFile {
  id: string;
  filename: string;
  purpose: string;
  media_type: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface VssUploadResponse {
  id: string;
  filename: string;
  purpose: string;
  media_type: string;
}

export interface VssAlert {
  id: string;
  file_id: string;
  events: string[];
  callback_url: string;
  created_at: string;
  status: 'active' | 'inactive';
}

export interface VssAlertEvent {
  id: string;
  alert_id: string;
  event_type: string;
  timestamp: number;
  confidence: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: Record<string, unknown>;
}

export interface VssChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface VssChatRequest {
  messages: VssChatMessage[];
  file_id?: string;
  stream?: boolean;
}

export interface VssChatResponse {
  id: string;
  choices: {
    message: VssChatMessage;
    finish_reason: string;
  }[];
}

export interface VssSummaryRequest {
  file_id: string;
  prompt?: string;
}

export interface VssSummaryResponse {
  summary: string;
  file_id: string;
}

// Mapping VSS detections to SAR events
export type VssDetectionType = 'person' | 'fire' | 'smoke' | 'vehicle' | 'debris' | 'animal';

export const mapVssToSarEvent = (detection: VssDetectionType): { type: 'victim' | 'hazard' | 'rescuer'; severity: 'low' | 'medium' | 'high' | 'critical' } => {
  switch (detection) {
    case 'person':
      return { type: 'victim', severity: 'critical' };
    case 'fire':
    case 'smoke':
      return { type: 'hazard', severity: 'critical' };
    case 'vehicle':
      return { type: 'rescuer', severity: 'low' };
    case 'debris':
      return { type: 'hazard', severity: 'high' };
    case 'animal':
      return { type: 'victim', severity: 'medium' };
    default:
      return { type: 'hazard', severity: 'medium' };
  }
};
