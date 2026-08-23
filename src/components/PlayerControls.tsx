import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Loader2, 
  Mic, 
  MicOff,
  Radio
} from 'lucide-react';
import { VoiceCommandState } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  voiceState: VoiceCommandState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleVoice: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isLoading,
  volume,
  isMuted,
  voiceState,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onToggleMute,
  onToggleVoice,
}) => {
  const effectiveVolume = isMuted ? 0 : volume;

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div
      id="player-master-controls"
      className="w-full bg-[#080808]/90 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Voice & Playback Controls */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-mono-tech">
            Playback Control
          </span>
          <div className="flex items-center gap-3">
            {/* Play / Pause Primary Button */}
            <button
              id="btn-main-play-pause"
              onClick={isPlaying ? onPause : onPlay}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                isPlaying
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:bg-blue-500'
                  : 'bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105'
              }`}
              title={isPlaying ? 'Pause RadioDAVE' : 'Play RadioDAVE'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Connecting...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Stop Button */}
            <button
              id="btn-main-stop"
              onClick={onStop}
              disabled={!isPlaying && !isLoading}
              className={`px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                isPlaying || isLoading
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  : 'border-white/5 bg-transparent text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Stop Stream"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP</span>
            </button>
          </div>
        </div>

        {/* Center: Push-to-Talk / Listening Indicator */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-mono-tech">
            Voice Control
          </span>
          <button
            id="btn-voice-push-to-talk"
            onClick={onToggleVoice}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
              voiceState.isListening
                ? 'bg-blue-600/90 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-mic-pulse'
                : 'bg-white/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40'
            }`}
            title={voiceState.isListening ? 'Microphone Active — Click to pause' : 'Click to enable voice commands'}
          >
            {voiceState.isListening ? (
              <>
                <Mic className="w-4 h-4 text-white animate-pulse" />
                <span>LISTENING...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-blue-400" />
                <span>VOICE ASSISTANT</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Immersive Volume Bar */}
        <div className="flex flex-col gap-1 w-full md:w-48">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono-tech">
              Volume
            </span>
            <span className="text-xs font-mono-tech text-blue-400">
              {Math.round(effectiveVolume * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-volume-mute"
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono-tech">MIN</span>
              <input
                id="input-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectiveVolume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition"
              />
              <span className="text-[10px] text-slate-500 font-mono-tech">MAX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
