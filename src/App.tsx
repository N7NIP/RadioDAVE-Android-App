import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TrackInfo, StationInfo, VisualizerMode, VoiceCommandState } from './types';
import { fetchStationMetadata, DEFAULT_LOGO_URL } from './services/live365Service';
import { AudioEngine } from './services/audioEngine';
import { VoiceRecognitionService, ParsedVoiceCommand } from './services/voiceRecognitionService';
import { Header } from './components/Header';
import { AudioVisualizer } from './components/AudioVisualizer';
import { NowPlayingCard } from './components/NowPlayingCard';
import { PlayerControls } from './components/PlayerControls';
import { VoiceAssistantPanel } from './components/VoiceAssistantPanel';
import { RecentTracksDrawer } from './components/RecentTracksDrawer';
import { HelpCommandsModal } from './components/HelpCommandsModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { Radio, Volume2, ShieldCheck, Sparkles, AlertCircle, Smartphone, Download } from 'lucide-react';

export default function App() {
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Visualizer mode
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('spectrum');

  // Station and track metadata
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>({
    title: "Radio's Classic Hits!",
    artist: 'RadioDAVE',
    art: DEFAULT_LOGO_URL,
    status: 'playing',
  });

  const [recentTracks, setRecentTracks] = useState<TrackInfo[]>([]);
  const [station, setStation] = useState<StationInfo>({
    name: 'RadioDAVE',
    slug: 'RadioDAVE',
    description: "Radio's Classic Hits!",
    genres: ['Classic Hits', 'Oldies', '70s', '80s'],
    website: 'http://www.radiodave.us/',
    logo: DEFAULT_LOGO_URL,
    listeners: 1,
    isPlaying: true,
  });

  // Voice Command State
  const [voiceState, setVoiceState] = useState<VoiceCommandState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    feedback: 'Say "Play RadioDAVE" to start streaming!',
    lastCommandTimestamp: Date.now(),
    continuousMode: true,
    voiceFeedbackEnabled: true,
  });

  // Modal / Drawer states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Android Native Install Prompt Event (PWA / WebAPK)
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed Android app)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredInstallPrompt(null);
    } else {
      setIsAndroidModalOpen(true);
    }
  };

  const audioEngineRef = useRef<AudioEngine>(AudioEngine.getInstance());
  const voiceServiceRef = useRef<VoiceRecognitionService>(VoiceRecognitionService.getInstance());

  // Initial metadata fetch & polling loop
  const updateMetadata = useCallback(async () => {
    try {
      const data = await fetchStationMetadata();
      if (data.currentTrack) {
        setCurrentTrack(data.currentTrack);
      }
      if (data.recentTracks && data.recentTracks.length > 0) {
        setRecentTracks(data.recentTracks);
      }
      if (data.station) {
        setStation(data.station);
      }
    } catch (err) {
      console.warn('Metadata update error:', err);
    }
  }, []);

  useEffect(() => {
    updateMetadata();
    const interval = setInterval(updateMetadata, 8000);
    return () => clearInterval(interval);
  }, [updateMetadata]);

  // Audio Playback Handlers
  const handlePlay = useCallback(async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await audioEngineRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to play stream:', err);
      setIsLoading(false);
      setIsPlaying(false);
      setErrorMsg('Could not start stream. Please click Play or check connection.');
    }
  }, []);

  const handlePause = useCallback(() => {
    audioEngineRef.current.pause();
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    audioEngineRef.current.stop();
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const handleVolumeChange = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (isMuted && clamped > 0) {
      setIsMuted(false);
      audioEngineRef.current.setMuted(false);
    }
    audioEngineRef.current.setVolume(clamped);
  }, [isMuted]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioEngineRef.current.setMuted(next);
      return next;
    });
  }, []);

  // Voice Command Execution Engine
  const executeCommand = useCallback((cmd: ParsedVoiceCommand) => {
    const voiceService = voiceServiceRef.current;

    setVoiceState((prev) => ({
      ...prev,
      transcript: cmd.rawText,
      feedback: cmd.feedbackText,
      lastCommandTimestamp: Date.now(),
    }));

    switch (cmd.type) {
      case 'PLAY':
        handlePlay();
        voiceService.speakFeedback("Playing RadioDAVE. Radio's Classic Hits!");
        break;

      case 'STOP':
      case 'PAUSE':
        handleStop();
        voiceService.speakFeedback('Stopping RadioDAVE.');
        break;

      case 'VOLUME_UP': {
        const nextVol = Math.min(1, volume + 0.15);
        handleVolumeChange(nextVol);
        voiceService.speakFeedback(`Volume turned up to ${Math.round(nextVol * 100)} percent.`);
        break;
      }

      case 'VOLUME_DOWN': {
        const nextVol = Math.max(0, volume - 0.15);
        handleVolumeChange(nextVol);
        voiceService.speakFeedback(`Volume turned down to ${Math.round(nextVol * 100)} percent.`);
        break;
      }

      case 'SET_VOLUME': {
        if (typeof cmd.volumeValue === 'number') {
          handleVolumeChange(cmd.volumeValue);
          voiceService.speakFeedback(`Volume set to ${Math.round(cmd.volumeValue * 100)} percent.`);
        }
        break;
      }

      case 'MUTE':
        setIsMuted(true);
        audioEngineRef.current.setMuted(true);
        voiceService.speakFeedback('Audio muted.');
        break;

      case 'UNMUTE':
        setIsMuted(false);
        audioEngineRef.current.setMuted(false);
        voiceService.speakFeedback('Audio unmuted.');
        break;

      case 'SET_VISUALIZER':
        if (cmd.visualizerMode) {
          setVisualizerMode(cmd.visualizerMode as VisualizerMode);
          voiceService.speakFeedback(cmd.feedbackText);
        }
        break;

      case 'NEXT_VISUALIZER': {
        const modes: VisualizerMode[] = ['spectrum', 'vu_meter', 'oscilloscope', 'circular', 'led_matrix', 'liquid_flow'];
        const currIdx = modes.indexOf(visualizerMode);
        const nextMode = modes[(currIdx + 1) % modes.length];
        setVisualizerMode(nextMode);
        voiceService.speakFeedback(`Switched to ${nextMode.replace('_', ' ')} visualizer.`);
        break;
      }

      case 'QUERY_SONG': {
        const announcement = `Now playing ${currentTrack.title} by ${currentTrack.artist} on RadioDAVE.`;
        setVoiceState((prev) => ({ ...prev, feedback: announcement }));
        voiceService.speakFeedback(announcement);
        break;
      }

      case 'QUERY_STATION': {
        const stationAnnouncement = "RadioDAVE — Radio's Classic Hits! Live streaming classic hits 24/7.";
        setVoiceState((prev) => ({ ...prev, feedback: stationAnnouncement }));
        voiceService.speakFeedback(stationAnnouncement);
        break;
      }

      case 'SHOW_HISTORY':
        setIsHistoryOpen(true);
        voiceService.speakFeedback('Showing recently played tracks.');
        break;

      case 'SHOW_HELP':
        setIsHelpOpen(true);
        voiceService.speakFeedback("Here are available voice commands for RadioDAVE.");
        break;

      case 'UNKNOWN':
      default:
        // Soft unrecognized command
        break;
    }
  }, [handlePlay, handleStop, handleVolumeChange, volume, visualizerMode, currentTrack]);

  // Setup Web Audio listeners & Voice Service Callbacks
  useEffect(() => {
    const voiceService = voiceServiceRef.current;
    const isSupported = voiceService.isSupported();

    setVoiceState((prev) => ({
      ...prev,
      isSupported,
    }));

    voiceService.setCallbacks({
      onCommand: (cmd) => {
        executeCommand(cmd);
      },
      onTranscript: (transcript, isFinal) => {
        setVoiceState((prev) => ({
          ...prev,
          transcript,
        }));
      },
      onStatusChange: (isListening, error) => {
        setVoiceState((prev) => ({
          ...prev,
          isListening,
          feedback: error ? `Microphone status: ${error}` : prev.feedback,
        }));
      },
    });

    const audioEl = audioEngineRef.current.getAudioElement();
    if (audioEl) {
      const onPlaying = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };
      const onWaiting = () => setIsLoading(true);
      const onPause = () => setIsPlaying(false);
      const onError = () => {
        setIsLoading(false);
        setIsPlaying(false);
      };

      audioEl.addEventListener('playing', onPlaying);
      audioEl.addEventListener('waiting', onWaiting);
      audioEl.addEventListener('pause', onPause);
      audioEl.addEventListener('error', onError);

      return () => {
        audioEl.removeEventListener('playing', onPlaying);
        audioEl.removeEventListener('waiting', onWaiting);
        audioEl.removeEventListener('pause', onPause);
        audioEl.removeEventListener('error', onError);
      };
    }
  }, [executeCommand]);

  // Android MediaSession integration for lock-screen & notification shade controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || "Radio's Classic Hits!",
        artist: currentTrack.artist || 'RadioDAVE',
        album: "RadioDAVE Live Broadcast",
        artwork: [
          { src: currentTrack.art || '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: currentTrack.art || '/logo.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        handlePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        handlePause();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        handleStop();
      });
    }
  }, [currentTrack, handlePlay, handlePause, handleStop]);

  // Voice Toggle Handler
  const handleToggleVoice = () => {
    const voiceService = voiceServiceRef.current;
    const isNowListening = voiceService.toggleListening();
    setVoiceState((prev) => ({
      ...prev,
      isListening: isNowListening,
      feedback: isNowListening 
        ? 'Microphone active! Say "Play RadioDAVE" or "Volume Up"...' 
        : 'Microphone paused.',
    }));
  };

  const handleToggleContinuous = () => {
    setVoiceState((prev) => {
      const next = !prev.continuousMode;
      return { ...prev, continuousMode: next };
    });
  };

  const handleToggleVoiceFeedback = () => {
    setVoiceState((prev) => {
      const next = !prev.voiceFeedbackEnabled;
      voiceServiceRef.current.setVoiceFeedbackEnabled(next);
      return { ...prev, voiceFeedbackEnabled: next };
    });
  };

  const handleSimulateCommand = (commandText: string) => {
    const parsed = voiceServiceRef.current.parseCommand(commandText);
    executeCommand(parsed);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when inside input field
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) handlePause();
        else handlePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.05));
      } else if (e.code === 'Digit1') {
        setVisualizerMode('spectrum');
      } else if (e.code === 'Digit2') {
        setVisualizerMode('vu_meter');
      } else if (e.code === 'Digit3') {
        setVisualizerMode('oscilloscope');
      } else if (e.code === 'Digit4') {
        setVisualizerMode('circular');
      } else if (e.code === 'Digit5') {
        setVisualizerMode('led_matrix');
      } else if (e.code === 'Digit6') {
        setVisualizerMode('liquid_flow');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, handlePlay, handlePause, handleToggleMute, handleVolumeChange]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] font-sans flex flex-col overflow-x-hidden relative selection:bg-blue-600 selection:text-white">
      {/* Ambient Radial Gradient Background from Immersive Theme */}
      <div 
        className="absolute inset-0 opacity-25 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 50% 40%, #1e293b 0%, transparent 75%)' }} 
      />

      {/* Station Header */}
      <Header
        station={station}
        isPlaying={isPlaying}
        voiceState={voiceState}
        onToggleVoice={handleToggleVoice}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 relative z-10">
        {/* Android PWA / WebAPK Quick Install Banner */}
        {deferredInstallPrompt && !isInstalled && (
          <div className="p-3 sm:p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-white text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Install RadioDAVE on Android</span>
                <p className="text-xs text-slate-300">Add to your home screen for standalone audio and lock-screen controls.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleTriggerInstall}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
            </div>
          </div>
        )}
        {/* Error notification banner if stream issues occur */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={handlePlay}
              className="px-3 py-1 rounded-lg bg-red-800/80 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Top Grid: Now Playing Info & Master Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Now Playing Card (7 Cols on desktop) */}
          <div className="lg:col-span-7 flex">
            <NowPlayingCard
              track={currentTrack}
              station={station}
              isPlaying={isPlaying}
              onOpenHistory={() => setIsHistoryOpen(true)}
            />
          </div>

          {/* Master Tactile Audio Controls (5 Cols on desktop) */}
          <div className="lg:col-span-5 flex">
            <PlayerControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              volume={volume}
              isMuted={isMuted}
              voiceState={voiceState}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              onToggleVoice={handleToggleVoice}
            />
          </div>
        </div>

        {/* Real-Time Audio Visualizer Section */}
        <div className="w-full">
          <AudioVisualizer
            mode={visualizerMode}
            onModeChange={setVisualizerMode}
            albumArt={currentTrack.art || station.logo}
            isPlaying={isPlaying}
          />
        </div>

        {/* Hands-free Voice Assistant & Command Center */}
        <div className="w-full">
          <VoiceAssistantPanel
            voiceState={voiceState}
            onToggleListening={handleToggleVoice}
            onToggleContinuous={handleToggleContinuous}
            onToggleVoiceFeedback={handleToggleVoiceFeedback}
            onSimulateCommand={handleSimulateCommand}
          />
        </div>
      </main>

      {/* Footer styled with Immersive UI aesthetics */}
      <footer className="w-full border-t border-white/5 bg-white/[0.02] backdrop-blur-xl py-6 text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-white italic text-sm">RadioDAVE</span>
              <span className="text-white/20">•</span>
              <span className="text-blue-400 font-bold tracking-[0.2em] uppercase text-[11px]">Radio&apos;s Classic Hits!</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <div className="hidden md:block text-right">
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 block">Currently Streaming</span>
              <span className="text-xs font-mono-tech text-blue-400">HQ_AUDIO_256KBPS.X365</span>
            </div>
            <span className="hidden md:inline text-white/10">•</span>
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setIsHelpOpen(true)}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                Voice Commands
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                Playlist History
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Slide-out Modals */}
      <RecentTracksDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tracks={recentTracks}
        currentTrack={currentTrack}
      />

      <HelpCommandsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectCommand={handleSimulateCommand}
      />

      <AndroidInstallModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        canPromptInstall={Boolean(deferredInstallPrompt)}
        onInstallClick={handleTriggerInstall}
      />
    </div>
  );
}
