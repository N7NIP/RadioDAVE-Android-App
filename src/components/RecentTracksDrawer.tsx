import React from 'react';
import { TrackInfo } from '../types';
import { X, History, Music, ExternalLink, Disc3, Clock } from 'lucide-react';

interface RecentTracksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TrackInfo[];
  currentTrack: TrackInfo;
}

export const RecentTracksDrawer: React.FC<RecentTracksDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrack,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="recent-tracks-modal"
        className="relative w-full max-w-xl max-h-[85vh] bg-[#080808] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Recently Played Tracks</h3>
              <p className="text-xs text-slate-400 font-mono-tech">RadioDAVE Live Broadcast History</p>
            </div>
          </div>

          <button
            id="close-recent-tracks-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {/* Currently playing highlight */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-center gap-3.5">
            <img
              src={currentTrack.art || '/logo.png'}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover border border-blue-400/40 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                NOW PLAYING
              </div>
              <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[10px] font-mono-tech uppercase tracking-widest text-slate-500 mb-2">Previous Tracks on Stream</h4>
          </div>

          {tracks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No recent track history available yet.
            </div>
          ) : (
            tracks.map((track, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#050505] border border-white/5 hover:border-white/10 flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={track.art || '/logo.png'}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0 bg-[#050505]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{track.title}</p>
                    <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {track.appleMusicUrl && (
                    <a
                      href={track.appleMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition"
                      title="Listen on Apple Music"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {track.amazonStoreUrl && (
                    <a
                      href={track.amazonStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition"
                      title="Buy / Stream on Amazon Music"
                    >
                      <Music className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span>RadioDAVE • Radio&apos;s Classic Hits!</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
