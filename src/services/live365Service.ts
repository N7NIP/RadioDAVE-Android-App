import { StationInfo, TrackInfo } from '../types';

// The stream URL used internally by the audio player (never rendered as raw text in the UI)
export const STREAM_AUDIO_URL = 'https://streaming.live365.com/a61726';
export const LIVE365_API_ENDPOINT = 'https://api.live365.com/station/a61726';
export const DEFAULT_LOGO_URL = '/logo.png';

export interface StationDataResponse {
  currentTrack: TrackInfo;
  recentTracks: TrackInfo[];
  station: StationInfo;
}

export async function fetchStationMetadata(): Promise<StationDataResponse> {
  try {
    const response = await fetch(LIVE365_API_ENDPOINT, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Station metadata request failed: ${response.status}`);
    }

    const data = await response.json();

    const currentTrackData = data['current-track'] || {};
    const lastPlayedData = Array.isArray(data['last-played']) ? data['last-played'] : [];

    const currentTrack: TrackInfo = {
      title: cleanTrackTitle(currentTrackData.title) || "Radio's Classic Hits!",
      artist: currentTrackData.artist || 'RadioDAVE',
      art: isValidArt(currentTrackData.art) ? currentTrackData.art : DEFAULT_LOGO_URL,
      duration: Number(currentTrackData.duration) || 0,
      start: currentTrackData.start || '',
      end: currentTrackData.end || '',
      status: currentTrackData.status || 'playing',
      appleMusicUrl: currentTrackData.apple_music_url,
      amazonStoreUrl: currentTrackData.amazon_store_url,
    };

    const recentTracks: TrackInfo[] = lastPlayedData.map((item: any) => ({
      title: cleanTrackTitle(item.title) || 'Classic Track',
      artist: item.artist || 'RadioDAVE',
      art: isValidArt(item.art) ? item.art : DEFAULT_LOGO_URL,
      duration: Number(item.duration) || 0,
      start: item.start || '',
      end: item.end || '',
      status: item.status || '',
      appleMusicUrl: item.apple_music_url,
      amazonStoreUrl: item.amazon_store_url,
    }));

    const station: StationInfo = {
      name: data.name || 'RadioDAVE',
      slug: data.slug || 'RadioDAVE',
      description: data.description || "Radio's Classic Hits!",
      genres: Array.isArray(data.genres) && data.genres.length > 0 ? data.genres : ['Oldies', 'Classic Hits', '70s', '80s'],
      website: data.website || 'http://www.radiodave.us/',
      logo: data.logo || DEFAULT_LOGO_URL,
      cover: data.cover,
      listeners: typeof data.listeners === 'number' ? data.listeners : 1,
      isPlaying: Boolean(data.is_playing ?? true),
    };

    return {
      currentTrack,
      recentTracks,
      station,
    };
  } catch (err) {
    console.warn('Could not fetch live station metadata, using fallback:', err);
    // Fallback data
    return {
      currentTrack: {
        title: "Radio's Classic Hits!",
        artist: 'RadioDAVE',
        art: DEFAULT_LOGO_URL,
        status: 'playing',
      },
      recentTracks: [],
      station: {
        name: 'RadioDAVE',
        slug: 'RadioDAVE',
        description: "Radio's Classic Hits!",
        genres: ['Oldies', 'Classic Hits', '70s', '80s'],
        website: 'http://www.radiodave.us/',
        logo: DEFAULT_LOGO_URL,
        listeners: 1,
        isPlaying: true,
      },
    };
  }
}

function isValidArt(artUrl?: string): boolean {
  if (!artUrl) return false;
  if (artUrl.includes('blankart.jpg')) return false;
  return true;
}

function cleanTrackTitle(title?: string): string {
  if (!title) return '';
  return title.trim();
}
