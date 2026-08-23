import React from 'react';
import { StationInfo, VoiceCommandState } from '../types';
import { Radio, Mic, MicOff, History, HelpCircle, Volume2, Smartphone } from 'lucide-react';

interface HeaderProps {
  station: StationInfo;
  isPlaying: boolean;
  voiceState: VoiceCommandState;
  onToggleVoice: () => void;
  onOpenHistory: () => void;
  onOpenHelp: () => void;
  onOpenAndroidModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  station,
  isPlaying,
  voiceState,
  onToggleVoice,
  onOpenHistory,
  onOpenHelp,
  onOpenAndroidModal,
}) => {
  return (
    <header id="radiodave-header" className="w-full border-b border-white/5 bg-[#050505]/90 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Logo & Station Title & Tagline */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)] overflow-hidden border border-blue-400/30">
              <img
                id="radiodave-brand-logo"
                src={station.logo || '/logo.png'}
                alt="RadioDAVE Logo"
                className="w-full h-full object-cover transition transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-[#050505]"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white italic">
                RadioDAVE
              </h1>
              {/* ON AIR Indicator */}
              <div 
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-colors ${
                  isPlaying
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-blue-400 animate-pulse shadow-sm shadow-blue-400' : 'bg-slate-500'}`} />
                <span>{isPlaying ? 'ON AIR' : 'OFF AIR'}</span>
              </div>
            </div>

            {/* Official Station Tagline */}
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-blue-500 font-bold tracking-[0.25em] uppercase text-xs">
                Radio&apos;s Classic Hits!
              </p>
              <span className="text-slate-600 text-xs hidden sm:inline">•</span>
              <span className="text-slate-400 text-xs hidden sm:inline font-mono-tech">
                Live 24/7 Stream
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Listening for: "Play RadioDAVE" & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Immersive Theme Listening Pill */}
          <div 
            onClick={onToggleVoice}
            title={voiceState.isListening ? 'Click to pause voice assistant' : 'Click to enable voice assistant'}
            className="bg-blue-500/10 border border-blue-500/20 px-4 sm:px-5 py-2 rounded-full flex items-center gap-2.5 cursor-pointer hover:bg-blue-500/15 hover:border-blue-500/40 transition shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          >
            <div className={`w-2 h-2 rounded-full ${voiceState.isListening ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]' : 'bg-slate-500'}`}></div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
              {voiceState.isListening ? 'Listening: "Play RadioDAVE"' : 'Voice: "Play RadioDAVE"'}
            </span>
          </div>

          {/* Android App Button */}
          <button
            id="header-android-btn"
            onClick={onOpenAndroidModal}
            title="Install as Android App"
            className="px-3 py-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:text-white hover:bg-blue-600/20 hover:border-blue-500/50 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Android App</span>
          </button>

          {/* History Button */}
          <button
            id="header-history-btn"
            onClick={onOpenHistory}
            title="Recently Played Tracks"
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Recent Tracks</span>
          </button>

          {/* Help Button */}
          <button
            id="header-help-btn"
            onClick={onOpenHelp}
            title="Voice Commands & Help Guide"
            className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Commands</span>
          </button>
        </div>
      </div>
    </header>
  );
};
