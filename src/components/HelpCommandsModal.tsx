import React from 'react';
import { X, Mic, Volume2, Activity, HelpCircle, Sparkles, Radio } from 'lucide-react';

interface HelpCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (cmd: string) => void;
}

const COMMAND_CATEGORIES = [
  {
    category: 'Playback & Launching',
    icon: Radio,
    commands: [
      { phrase: 'Play RadioDAVE', desc: 'Launches and begins streaming RadioDAVE live' },
      { phrase: 'Play', desc: 'Starts or resumes music stream' },
      { phrase: 'Stop / Pause', desc: 'Stops live playback' },
      { phrase: 'Turn on Radio Dave', desc: 'Alternative launch trigger phrase' },
    ],
  },
  {
    category: 'Volume Controls',
    icon: Volume2,
    commands: [
      { phrase: 'Volume Up / Louder', desc: 'Increases audio level by 15%' },
      { phrase: 'Volume Down / Quieter', desc: 'Decreases audio level by 15%' },
      { phrase: 'Set volume to 80%', desc: 'Sets exact volume percentage (0-100%)' },
      { phrase: 'Max Volume / 100%', desc: 'Sets audio level to maximum' },
      { phrase: 'Mute / Unmute', desc: 'Toggles audio mute state' },
    ],
  },
  {
    category: 'Real-time Visualizers',
    icon: Activity,
    commands: [
      { phrase: 'Show Spectrum', desc: 'Switches to classic multi-band frequency bars' },
      { phrase: 'Show VU Meter', desc: 'Switches to vintage analog needle dials' },
      { phrase: 'Show Oscilloscope', desc: 'Switches to phosphor vector CRT waveform' },
      { phrase: 'Show Cosmic Halo', desc: 'Switches to 360° circular starburst visualizer' },
      { phrase: 'Show LED Matrix', desc: 'Switches to 28-band studio LED stack' },
      { phrase: 'Next Visualizer', desc: 'Cycles through all available visual displays' },
    ],
  },
  {
    category: 'Track & Station Queries',
    icon: Sparkles,
    commands: [
      { phrase: "What's playing? / What song is this?", desc: 'Announces and highlights the current artist & song' },
      { phrase: 'Station info', desc: "Reads out station info: RadioDAVE — Radio's Classic Hits!" },
      { phrase: 'Recent songs', desc: 'Opens the broadcast history playlist' },
    ],
  },
];

export const HelpCommandsModal: React.FC<HelpCommandsModalProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="help-commands-modal"
        className="relative w-full max-w-2xl max-h-[90vh] bg-[#080808] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Voice Commands Guide
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                  Hands-Free
                </span>
              </h3>
              <p className="text-xs text-slate-400">Speak naturally to control RadioDAVE anytime</p>
            </div>
          </div>

          <button
            id="close-help-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Launch Highlight banner */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Instant Voice Launch</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Simply enable your microphone and say <span className="font-bold text-blue-300">&ldquo;Play RadioDAVE&rdquo;</span>. The player will immediately connect to the live stream and start playing Radio&apos;s Classic Hits!
                </p>
              </div>
            </div>
          </div>

          {COMMAND_CATEGORIES.map((cat, idx) => {
            const CatIcon = cat.icon;
            return (
              <div key={idx} className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono-tech uppercase text-slate-400">
                  <CatIcon className="w-4 h-4 text-blue-400" />
                  <span>{cat.category}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.commands.map((cmd, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={() => {
                        onSelectCommand(cmd.phrase);
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-[#050505] border border-white/5 hover:border-blue-500/40 hover:bg-white/[0.03] transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300">
                          &ldquo;{cmd.phrase}&rdquo;
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono-tech group-hover:text-blue-400">
                          Try →
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{cmd.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span>Keyboard: <strong className="text-slate-300">Space</strong> (Play/Pause) • <strong className="text-slate-300">M</strong> (Mute) • <strong className="text-slate-300">↑/↓</strong> (Volume)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
