import React, { useEffect, useState } from 'react';
import { TrackInfo, StationInfo } from '../types';
import { Music, Disc3, Radio, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

interface NowPlayingCardProps {
  track: TrackInfo;
  station: StationInfo;
  isPlaying: boolean;
  onOpenHistory: () => void;
}

export const NowPlayingCard: React.FC<NowPlayingCardProps> = ({
  track,
  station,
  isPlaying,
  onOpenHistory,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track timer increment when playing
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, track.title]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id="now-playing-card"
      className="w-full bg-[#080808]/90 border border-white/5 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between"
    >
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
        {/* Album Artwork / Station Vinyl Cover with Dial-Glow */}
        <div className="relative flex-shrink-0 group">
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/10 dial-glow bg-[#050505] flex items-center justify-center">
            <img
              id="current-track-artwork"
              src={track.art || station.logo || '/logo.png'}
              alt={`${track.title} by ${track.artist}`}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />

            {/* Vinyl record spinning badge overlay when playing */}
            {isPlaying && (
              <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-lg animate-spin" style={{ animationDuration: '6s' }}>
                <Disc3 className="w-5 h-5 text-blue-400" />
              </div>
            )}
          </div>

          {/* Live Stream Badge */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#050505] border border-blue-500/30 shadow-md text-[10px] font-bold text-blue-400 font-mono-tech tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            LIVE BROADCAST
          </div>
        </div>

        {/* Track Title, Artist, and Station Tagline Info */}
        <div className="flex-1 flex flex-col justify-between text-center md:text-left min-w-0 w-full">
          <div className="space-y-2">
            {/* Tagline Banner */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <p className="text-blue-500 font-bold tracking-[0.3em] uppercase text-xs">
                Radio&apos;s Classic Hits!
              </p>
              <span className="text-white/20 hidden sm:inline">•</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[11px] font-medium font-mono-tech">
                HQ_AUDIO_256KBPS
              </span>
            </div>

            {/* Current Song Title with glow-text from design */}
            <div className="overflow-hidden pt-1">
              <h2
                id="now-playing-track-title"
                className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight glow-text break-words line-clamp-2"
                title={track.title}
              >
                {track.title || "Radio's Classic Hits!"}
              </h2>
            </div>

            {/* Artist Name */}
            <h3
              id="now-playing-track-artist"
              className="text-lg sm:text-2xl lg:text-3xl font-medium text-slate-400 flex items-center justify-center md:justify-start gap-2 pt-1"
            >
              <Music className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="truncate">{track.artist || 'RadioDAVE'}</span>
            </h3>
          </div>

          {/* Broadcast Details & Progress Bar */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-3">
            {/* Immersive Theme Progress & Timing Row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-400 min-w-20">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{isPlaying ? formatTime(elapsedSeconds) : '00:00'}</span>
              </div>

              {/* Progress bar with blue glow matching design */}
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-300 ${
                    isPlaying ? 'w-full animate-pulse' : 'w-0'
                  }`}
                />
              </div>

              <span className="text-xs font-mono-tech text-slate-500 whitespace-nowrap">
                LIVE STREAM
              </span>
            </div>

            {/* External Links and Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <div className="flex items-center gap-2">
                {track.appleMusicUrl && (
                  <a
                    href={track.appleMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                  >
                    <span>Apple Music</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {track.amazonStoreUrl && (
                  <a
                    href={track.amazonStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                  >
                    <span>Amazon Music</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <button
                id="view-recent-history-link"
                onClick={onOpenHistory}
                className="text-blue-400 hover:text-blue-300 font-sans font-medium transition cursor-pointer text-xs flex items-center gap-1 ml-auto"
              >
                Playlist History →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
