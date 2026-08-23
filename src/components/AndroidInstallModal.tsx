import React from 'react';
import { Smartphone, Download, CheckCircle2, X, Sparkles, Radio, ShieldCheck } from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  canPromptInstall: boolean;
  onInstallClick: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  canPromptInstall,
  onInstallClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="android-install-modal"
        className="relative w-full max-w-lg bg-[#080808] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Android App Installation
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-mono-tech">
                  PWA / APK
                </span>
              </h3>
              <p className="text-xs text-slate-400">Install RadioDAVE directly onto your Android device</p>
            </div>
          </div>
          <button
            id="close-android-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Hero Banner */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] flex-shrink-0">
              <img src="/logo.png" alt="RadioDAVE" className="w-10 h-10 rounded-lg object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">RadioDAVE for Android</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Enjoy seamless 24/7 background audio, hands-free voice controls, lock-screen playback controls, and live spectrum visualizers.
              </p>
            </div>
          </div>

          {/* Quick Install Button if browser supports 1-tap install */}
          {canPromptInstall && (
            <button
              id="btn-android-native-install"
              onClick={() => {
                onInstallClick();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>INSTALL RADIODAVE ON ANDROID NOW</span>
            </button>
          )}

          {/* Step by Step Manual Installation Guide for Android Chrome/Samsung Internet */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-mono-tech uppercase tracking-wider text-slate-400">
              How to Install on Any Android Device:
            </h5>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#050505] border border-white/5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-white">Open in Chrome or Edge on Android</strong>
                  <p className="text-slate-400 mt-0.5">Open this URL in Google Chrome, Samsung Internet, or Brave on your phone.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#050505] border border-white/5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-white">Tap the Browser Menu (⋮)</strong>
                  <p className="text-slate-400 mt-0.5">Tap the three vertical dots in the top-right corner of Chrome.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#050505] border border-white/5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="text-white">Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</strong>
                  <p className="text-slate-400 mt-0.5">RadioDAVE will be installed to your app drawer and home screen with standalone mode and full media controls.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Android Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Background Streaming</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Lock-Screen Controls</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Voice Commands</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Real-Time Spectrum</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Standalone Android Web App
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
