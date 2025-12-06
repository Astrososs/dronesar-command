export type EventType = 'victim' | 'hazard' | 'rescuer';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MissionEvent {
  id: string;
  timestamp: number; // seconds into video
  type: EventType;
  message: string;
  probability: number; // 0-100
  severity: SeverityLevel;
  coordinates: [number, number]; // [lng, lat]
}

// Sample mission events synchronized to video timestamps
export const missionEvents: MissionEvent[] = [
  {
    id: 'evt-001',
    timestamp: 5,
    type: 'rescuer',
    message: 'Ground team Alpha detected at staging area',
    probability: 98,
    severity: 'low',
    coordinates: [-122.4194, 37.7749],
  },
  {
    id: 'evt-002',
    timestamp: 12,
    type: 'hazard',
    message: 'Structural collapse detected - unstable debris field',
    probability: 87,
    severity: 'high',
    coordinates: [-122.4180, 37.7755],
  },
  {
    id: 'evt-003',
    timestamp: 18,
    type: 'victim',
    message: 'Thermal signature detected - possible survivor',
    probability: 73,
    severity: 'critical',
    coordinates: [-122.4165, 37.7762],
  },
  {
    id: 'evt-004',
    timestamp: 25,
    type: 'hazard',
    message: 'Gas leak indicator - elevated methane levels',
    probability: 91,
    severity: 'critical',
    coordinates: [-122.4155, 37.7768],
  },
  {
    id: 'evt-005',
    timestamp: 32,
    type: 'rescuer',
    message: 'K-9 unit Bravo approaching sector 4',
    probability: 95,
    severity: 'low',
    coordinates: [-122.4145, 37.7772],
  },
  {
    id: 'evt-006',
    timestamp: 40,
    type: 'victim',
    message: 'Movement detected in rubble - high confidence survivor',
    probability: 89,
    severity: 'critical',
    coordinates: [-122.4135, 37.7778],
  },
  {
    id: 'evt-007',
    timestamp: 48,
    type: 'hazard',
    message: 'Electrical hazard - downed power lines',
    probability: 94,
    severity: 'high',
    coordinates: [-122.4125, 37.7782],
  },
  {
    id: 'evt-008',
    timestamp: 55,
    type: 'victim',
    message: 'Audio signature - voice detected, calling for help',
    probability: 82,
    severity: 'critical',
    coordinates: [-122.4115, 37.7788],
  },
  {
    id: 'evt-009',
    timestamp: 65,
    type: 'rescuer',
    message: 'Medical team Charlie on standby at extraction point',
    probability: 99,
    severity: 'low',
    coordinates: [-122.4105, 37.7792],
  },
  {
    id: 'evt-010',
    timestamp: 75,
    type: 'hazard',
    message: 'Fire detected - active flames in building structure',
    probability: 96,
    severity: 'critical',
    coordinates: [-122.4095, 37.7798],
  },
  {
    id: 'evt-011',
    timestamp: 85,
    type: 'victim',
    message: 'Infrared anomaly - body heat signature confirmed',
    probability: 78,
    severity: 'high',
    coordinates: [-122.4085, 37.7802],
  },
  {
    id: 'evt-012',
    timestamp: 95,
    type: 'rescuer',
    message: 'Aerial support Delta entering airspace',
    probability: 100,
    severity: 'low',
    coordinates: [-122.4075, 37.7808],
  },
];

export const getEventTypeColor = (type: EventType): string => {
  switch (type) {
    case 'victim':
      return '#00ff88'; // green
    case 'hazard':
      return '#ff3366'; // red
    case 'rescuer':
      return '#00d4ff'; // blue
    default:
      return '#ffffff';
  }
};

export const getSeverityClass = (severity: SeverityLevel): string => {
  switch (severity) {
    case 'critical':
      return 'badge-critical';
    case 'high':
      return 'badge-warning';
    case 'medium':
      return 'badge-info';
    case 'low':
      return 'badge-success';
    default:
      return 'badge-info';
  }
};
