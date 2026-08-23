import React, { useState } from 'react';
import { VoiceCommandState } from '../types';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Sparkles, 
  Send,
  Radio,
  HelpCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface VoiceAssistantPanelProps {
  voiceState: VoiceCommandState;
  onToggleListening: () => void;
  onToggleContinuous: () => void;
  onToggleVoiceFeedback: () => void;
  onSimulateCommand: (commandText: string) => void;
}

const QUICK_COMMAND_SUGGESTIONS = [
  { label: '▶ "Play RadioDAVE"', cmd: 'Play RadioDAVE' },
  { label: '⏹ "Stop"', cmd: 'Stop' },
  { label: '🔊 "Volume Up"', cmd: 'Volume Up' },
  { label: '🔉 "Volume Down"', cmd: 'Volume Down' },
  { label: '🎚 "Volume 80%"', cmd: 'Set volume to 80%' },
  { label: '📊 "Spectrum"', cmd: 'Show Spectrum' },
  { label: '🎛 "Analog VU Meter"', cmd: 'Show VU Meter' },
  { label: '📈 "Oscilloscope"', cmd: 'Show Oscilloscope' },
  { label: '🎵 "What song is this?"', cmd: 'What song is this?' },
];

export const VoiceAssistantPanel: React.FC<VoiceAssistantPanelProps> = ({
  voiceState,
  onToggleListening,
  onToggleContinuous,
  onToggleVoiceFeedback,
  onSimulateCommand,
}) => {
  const [manualText, setManualText] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    onSimulateCommand(manualText.trim());
    setManualText('');
  };

  return (
    <div
      id="voice-assistant-panel"
      className="w-full bg-[#080808]/90 border border-white/5 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl border transition-all ${
            voiceState.isListening
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-mic-pulse'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}>
            {voiceState.isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Voice Assistant
                <Sparkles className="w-4 h-4 text-blue-400" />
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                voiceState.isListening
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                {voiceState.isListening ? 'LISTENING' : 'STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch player instantly by saying: <span className="text-blue-400 font-semibold">&ldquo;Play RadioDAVE&rdquo;</span>
            </p>
          </div>
        </div>

        {/* Toggles & Options */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* Main Mic Button */}
          <button
            id="voice-panel-mic-btn"
            onClick={onToggleListening}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition cursor-pointer shadow-md ${
              voiceState.isListening
                ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
            }`}
          >
            {voiceState.isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Start Microphone</span>
              </>
            )}
          </button>

          {/* Spoken feedback toggle */}
          <button
            id="voice-feedback-toggle"
            onClick={onToggleVoiceFeedback}
            title={voiceState.voiceFeedbackEnabled ? 'Voice responses active' : 'Voice responses muted'}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              voiceState.voiceFeedbackEnabled
                ? 'bg-white/5 text-blue-400 border-blue-500/30'
                : 'bg-white/[0.02] text-slate-500 border-white/5'
            }`}
          >
            {voiceState.voiceFeedbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Voice Replies</span>
          </button>
        </div>
      </div>

      {/* Real-time speech transcript and assistant feedback banner */}
      <div className="mt-4 flex flex-col gap-2.5">
        {/* Live speech recognition feed */}
        <div className="p-3.5 rounded-xl bg-[#050505] border border-white/5 flex items-start gap-3">
          <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <div className="text-slate-400 font-mono-tech flex items-center justify-between">
              <span className="tracking-widest uppercase text-[10px]">VOICE TRANSCRIPT:</span>
              {voiceState.isListening && (
                <span className="text-blue-400 text-[10px] animate-pulse">● Live Speech Feed</span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-200 mt-0.5 italic">
              {voiceState.transcript ? `"${voiceState.transcript}"` : (voiceState.isListening ? 'Speak now: "Play RadioDAVE", "Volume Up", "Stop"...' : 'Microphone idle. Click "Start Microphone" or select a command below.')}
            </p>
          </div>
        </div>

        {/* Assistant execution confirmation pill */}
        {voiceState.feedback && (
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center gap-2.5 text-xs text-blue-200 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="font-medium">{voiceState.feedback}</span>
          </div>
        )}
      </div>

      {/* Clickable Quick Command Chips */}
      <div className="mt-4">
        <div className="text-[10px] font-mono-tech tracking-widest uppercase text-slate-500 mb-2">
          <span>TRY SAYING (OR CLICK TO EXECUTE):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMAND_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              id={`btn-quick-voice-${idx}`}
              onClick={() => onSimulateCommand(item.cmd)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Command Input Fallback */}
      <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="input-voice-text-command"
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Type any command (e.g. 'Play RadioDAVE', 'Volume 90%', 'VU Meter')..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#050505] border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <button
          id="btn-submit-text-command"
          type="submit"
          disabled={!manualText.trim()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
