import { useState, useCallback } from 'react';
import { generateVlmCaptions, summarizeVideo } from '@/services/vssApi';
import { mapVssToSarEvent, type VssDetectionType } from '@/types/vss';
import type { MissionEvent } from '@/data/missionEvents';

export interface UseVssDetectionsOptions {
  onNewEvent?: (event: MissionEvent) => void;
  onSummary?: (summary: string) => void;
}

export interface VssDetectionResult {
  events: MissionEvent[];
  summary: string | null;
  rawCaptions: Array<{
    timestamp: number;
    caption: string;
    detections?: string[];
  }>;
}

// SAR-focused prompt for VLM caption generation
const SAR_DETECTION_PROMPT = `You are a tactical rescue analyst reviewing drone footage during an emergency response operation.

PRIORITY DETECTIONS (in order of urgency):
1. PEOPLE: Identify all visible people. Distinguish between:
   - VICTIMS: People without protective equipment, in distress, trapped, injured, or needing rescue
   - RESCUERS: People wearing PPE, helmets, high-visibility gear, or emergency service uniforms
   
2. HAZARDS: Identify immediate dangers:
   - Active fire, flames, smoke (note color - black smoke indicates petroleum/toxic)
   - Structural damage, collapsed buildings, debris fields
   - Water hazards, flooding
   - Gas leaks (visible vapor), electrical hazards
   
3. ACCESS & RESOURCES:
   - Vehicles: Emergency vehicles, civilian vehicles (potential survivors inside)
   - Clear pathways for rescue teams
   - Landing zones for helicopters
   - Staging areas

For each detection, note:
- Approximate location in frame (left/center/right, near/far)
- Movement (stationary, moving, direction)
- Urgency level (critical, high, medium, low)

Be specific and actionable. Lives depend on accurate information.`;

// Parse VLM caption text to extract structured detections
const parseDetectionsFromCaption = (caption: string): { type: VssDetectionType; confidence: number; description: string }[] => {
  const detections: { type: VssDetectionType; confidence: number; description: string }[] = [];
  const lowerCaption = caption.toLowerCase();
  
  // Person/victim detection
  if (lowerCaption.includes('person') || lowerCaption.includes('people') || 
      lowerCaption.includes('victim') || lowerCaption.includes('survivor') ||
      lowerCaption.includes('individual') || lowerCaption.includes('human')) {
    detections.push({
      type: 'person',
      confidence: lowerCaption.includes('victim') || lowerCaption.includes('trapped') ? 0.95 : 0.85,
      description: caption,
    });
  }
  
  // Fire detection
  if (lowerCaption.includes('fire') || lowerCaption.includes('flame') || lowerCaption.includes('burning')) {
    detections.push({
      type: 'fire',
      confidence: 0.9,
      description: caption,
    });
  }
  
  // Smoke detection
  if (lowerCaption.includes('smoke')) {
    detections.push({
      type: 'smoke',
      confidence: 0.85,
      description: caption,
    });
  }
  
  // Vehicle detection
  if (lowerCaption.includes('vehicle') || lowerCaption.includes('car') || 
      lowerCaption.includes('truck') || lowerCaption.includes('ambulance') ||
      lowerCaption.includes('fire engine') || lowerCaption.includes('helicopter')) {
    detections.push({
      type: 'vehicle',
      confidence: 0.8,
      description: caption,
    });
  }
  
  // Debris/structural damage
  if (lowerCaption.includes('debris') || lowerCaption.includes('collapsed') || 
      lowerCaption.includes('rubble') || lowerCaption.includes('damage') ||
      lowerCaption.includes('destruction')) {
    detections.push({
      type: 'debris',
      confidence: 0.75,
      description: caption,
    });
  }
  
  return detections;
};

export const useVssDetections = ({ onNewEvent, onSummary }: UseVssDetectionsOptions = {}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VssDetectionResult | null>(null);

  // Analyze video using VLM captions
  const analyzeVideo = useCallback(async (fileId: string): Promise<VssDetectionResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('Starting VLM analysis for file:', fileId);
      
      // Generate VLM captions with SAR-focused prompt
      const captionsResponse = await generateVlmCaptions({
        id: fileId,
        prompt: SAR_DETECTION_PROMPT,
      });

      console.log('VLM captions received:', captionsResponse);

      const events: MissionEvent[] = [];
      let eventCounter = 0;

      // Process each caption and extract detections
      for (const captionData of captionsResponse.captions || []) {
        const detections = parseDetectionsFromCaption(captionData.caption);
        
        for (const detection of detections) {
          const eventMapping = mapVssToSarEvent(detection.type);
          
          // Generate coordinates based on timestamp (spread across the map area)
          const baseLng = -122.4194;
          const baseLat = 37.7749;
          const offsetLng = (Math.random() - 0.5) * 0.02;
          const offsetLat = (Math.random() - 0.5) * 0.02;

          const event: MissionEvent = {
            id: `vss-detection-${fileId}-${eventCounter++}`,
            timestamp: captionData.timestamp,
            type: eventMapping.type,
            severity: eventMapping.severity,
            message: detection.description.slice(0, 150) + (detection.description.length > 150 ? '...' : ''),
            probability: Math.round(detection.confidence * 100),
            coordinates: [baseLng + offsetLng, baseLat + offsetLat],
          };

          events.push(event);
          onNewEvent?.(event);
        }
      }

      // Also get a summary
      let summary: string | null = null;
      try {
        const summaryResponse = await summarizeVideo({
          file_id: fileId,
          prompt: 'Provide a tactical situation report (SITREP) for rescue commanders. Include: 1) Number and status of potential victims, 2) Active hazards and their locations, 3) Recommended approach routes, 4) Resource requirements. Be concise and actionable.',
        });
        summary = summaryResponse.summary;
        onSummary?.(summary);
        console.log('Video summary:', summary);
      } catch (summaryError) {
        console.warn('Summary generation failed (non-critical):', summaryError);
      }

      const detectionResult: VssDetectionResult = {
        events,
        summary,
        rawCaptions: captionsResponse.captions || [],
      };

      setResult(detectionResult);
      setIsAnalyzing(false);
      
      console.log(`Analysis complete: ${events.length} events detected`);
      return detectionResult;

    } catch (err) {
      console.error('VLM analysis failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setIsAnalyzing(false);
      return null;
    }
  }, [onNewEvent, onSummary]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    analyzeVideo,
    isAnalyzing,
    error,
    result,
    reset,
  };
};
