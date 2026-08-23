export interface TrackInfo {
  title: string;
  artist: string;
  art?: string;
  duration?: number;
  start?: string;
  end?: string;
  source?: string;
  status?: string;
  appleMusicUrl?: string;
  amazonStoreUrl?: string;
}

export interface StationInfo {
  name: string;
  slug: string;
  description: string;
  genres: string[];
  website?: string;
  logo: string;
  cover?: string;
  listeners: number;
  isPlaying: boolean;
}

export type VisualizerMode = 
  | 'spectrum' 
  | 'vu_meter' 
  | 'oscilloscope' 
  | 'circular' 
  | 'led_matrix' 
  | 'liquid_flow';

export interface VisualizerConfig {
  id: VisualizerMode;
  name: string;
  description: string;
  iconName: string;
}

export interface VoiceCommandState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  feedback: string;
  lastCommandTimestamp: number;
  continuousMode: boolean;
  voiceFeedbackEnabled: boolean;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  error: string | null;
  bitrate?: string;
}
