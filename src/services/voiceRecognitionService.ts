export type CommandActionType =
  | 'PLAY'
  | 'STOP'
  | 'PAUSE'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'SET_VOLUME'
  | 'MUTE'
  | 'UNMUTE'
  | 'NEXT_VISUALIZER'
  | 'SET_VISUALIZER'
  | 'QUERY_SONG'
  | 'QUERY_STATION'
  | 'SHOW_HISTORY'
  | 'SHOW_HELP'
  | 'UNKNOWN';

export interface ParsedVoiceCommand {
  type: CommandActionType;
  rawText: string;
  feedbackText: string;
  volumeValue?: number; // 0 to 1
  visualizerMode?: string;
}

export class VoiceRecognitionService {
  private static instance: VoiceRecognitionService | null = null;
  private recognition: any = null;
  private isListening = false;
  private continuousMode = true;
  private onCommandCallback: ((command: ParsedVoiceCommand) => void) | null = null;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onStatusChangeCallback: ((isListening: boolean, error?: string) => void) | null = null;
  private synth: SpeechSynthesis | null = null;
  private voiceFeedbackEnabled = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis || null;
      this.initRecognition();
    }
  }

  public static getInstance(): VoiceRecognitionService {
    if (!VoiceRecognitionService.instance) {
      VoiceRecognitionService.instance = new VoiceRecognitionService();
    }
    return VoiceRecognitionService.instance;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }

  private initRecognition() {
    const SpeechRecognitionClass = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStatusChangeCallback?.(true);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        if (interimTranscript) {
          this.onTranscriptCallback?.(interimTranscript.trim(), false);
        }

        if (finalTranscript) {
          const trimmed = finalTranscript.trim();
          this.onTranscriptCallback?.(trimmed, true);
          const parsed = this.parseCommand(trimmed);
          this.onCommandCallback?.(parsed);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.isListening = false;
          this.onStatusChangeCallback?.(false, 'Microphone permission denied.');
        } else if (event.error !== 'no-speech') {
          this.onStatusChangeCallback?.(this.isListening, `Voice event: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        // In continuous mode, automatically restart if listening should remain active
        if (this.isListening && this.continuousMode) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        } else {
          this.isListening = false;
          this.onStatusChangeCallback?.(false);
        }
      };
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
    }
  }

  public startListening(continuous = true): void {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) return;

    this.continuousMode = continuous;
    try {
      this.isListening = true;
      this.recognition.start();
    } catch (e) {
      // If already started, ignore error
    }
  }

  public stopListening(): void {
    this.isListening = false;
    this.continuousMode = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
    }
    this.onStatusChangeCallback?.(false);
  }

  public toggleListening(): boolean {
    if (this.isListening) {
      this.stopListening();
      return false;
    } else {
      this.startListening(true);
      return true;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setVoiceFeedbackEnabled(enabled: boolean): void {
    this.voiceFeedbackEnabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  public getVoiceFeedbackEnabled(): boolean {
    return this.voiceFeedbackEnabled;
  }

  public speakFeedback(text: string): void {
    if (!this.voiceFeedbackEnabled || !this.synth || typeof window === 'undefined') return;

    try {
      this.synth.cancel(); // Cancel prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.85;

      // Select natural English voice if available
      const voices = this.synth.getVoices();
      const preferredVoice = voices.find(v => 
        (v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public setCallbacks(callbacks: {
    onCommand: (command: ParsedVoiceCommand) => void;
    onTranscript?: (transcript: string, isFinal: boolean) => void;
    onStatusChange?: (isListening: boolean, error?: string) => void;
  }) {
    this.onCommandCallback = callbacks.onCommand;
    this.onTranscriptCallback = callbacks.onTranscript || null;
    this.onStatusChangeCallback = callbacks.onStatusChange || null;
  }

  /**
   * Parses natural speech into structured actions
   */
  public parseCommand(rawText: string): ParsedVoiceCommand {
    const text = rawText.toLowerCase().trim();

    // 1. Play / Launch / Resume "Play RadioDAVE"
    if (
      text.includes('play radiodave') || 
      text.includes('play radio dave') ||
      text.includes('play radio day') ||
      text.includes('start radiodave') ||
      text.includes('launch radiodave') ||
      text.includes('listen to radiodave') ||
      text.includes('listen to radio dave') ||
      text.includes('turn on radiodave') ||
      text.includes('turn on radio dave') ||
      text.includes('open radiodave') ||
      text === 'play' ||
      text === 'play radio' ||
      text === 'play music' ||
      text === 'resume' ||
      text === 'start' ||
      text === 'start player'
    ) {
      return {
        type: 'PLAY',
        rawText,
        feedbackText: "Playing RadioDAVE — Radio's Classic Hits!",
      };
    }

    // 2. Stop / Pause / Turn off
    if (
      text.includes('stop radiodave') ||
      text.includes('stop radio') ||
      text.includes('stop music') ||
      text.includes('pause radiodave') ||
      text.includes('pause radio') ||
      text.includes('turn off') ||
      text.includes('shut down') ||
      text === 'stop' ||
      text === 'pause' ||
      text === 'halt' ||
      text === 'quiet' ||
      text === 'off'
    ) {
      return {
        type: 'STOP',
        rawText,
        feedbackText: 'Stopping RadioDAVE playback.',
      };
    }

    // 3. Mute / Unmute
    if (text.includes('unmute') || text.includes('sound on')) {
      return {
        type: 'UNMUTE',
        rawText,
        feedbackText: 'Audio unmuted.',
      };
    }

    if (text.includes('mute') || text.includes('silence') || text.includes('sound off')) {
      return {
        type: 'MUTE',
        rawText,
        feedbackText: 'Audio muted.',
      };
    }

    // 4. Volume commands with numeric percentages: e.g. "volume 80%", "set volume to 50"
    const volumePercentMatch = text.match(/(?:set\s+)?volume(?:\s+to)?\s+(\d{1,3})(?:\s*%|\s*percent)?/);
    if (volumePercentMatch && volumePercentMatch[1]) {
      const num = parseInt(volumePercentMatch[1], 10);
      const clamped = Math.max(0, Math.min(100, num)) / 100;
      return {
        type: 'SET_VOLUME',
        rawText,
        volumeValue: clamped,
        feedbackText: `Volume set to ${Math.round(clamped * 100)} percent.`,
      };
    }

    if (text.includes('max volume') || text.includes('maximum volume') || text.includes('full volume') || text.includes('100%')) {
      return {
        type: 'SET_VOLUME',
        rawText,
        volumeValue: 1.0,
        feedbackText: 'Volume set to maximum (100%).',
      };
    }

    if (text.includes('half volume') || text.includes('medium volume')) {
      return {
        type: 'SET_VOLUME',
        rawText,
        volumeValue: 0.5,
        feedbackText: 'Volume set to 50 percent.',
      };
    }

    if (
      text.includes('volume up') ||
      text.includes('turn it up') ||
      text.includes('louder') ||
      text.includes('increase volume') ||
      text.includes('raise volume') ||
      text.includes('boost volume')
    ) {
      return {
        type: 'VOLUME_UP',
        rawText,
        feedbackText: 'Turning volume up.',
      };
    }

    if (
      text.includes('volume down') ||
      text.includes('turn it down') ||
      text.includes('softer') ||
      text.includes('quieter') ||
      text.includes('decrease volume') ||
      text.includes('lower volume') ||
      text.includes('reduce volume')
    ) {
      return {
        type: 'VOLUME_DOWN',
        rawText,
        feedbackText: 'Turning volume down.',
      };
    }

    // 5. Visualizer controls
    if (text.includes('vu meter') || text.includes('analog meter') || text.includes('needle')) {
      return {
        type: 'SET_VISUALIZER',
        visualizerMode: 'vu_meter',
        rawText,
        feedbackText: 'Switched to Dual Analog VU Meters.',
      };
    }

    if (text.includes('oscilloscope') || text.includes('wave form') || text.includes('waveform') || text.includes('scope')) {
      return {
        type: 'SET_VISUALIZER',
        visualizerMode: 'oscilloscope',
        rawText,
        feedbackText: 'Switched to Oscilloscope waveform display.',
      };
    }

    if (text.includes('spectrum') || text.includes('equalizer') || text.includes('frequency bars') || text.includes('classic bars')) {
      return {
        type: 'SET_VISUALIZER',
        visualizerMode: 'spectrum',
        rawText,
        feedbackText: 'Switched to Real-time Spectrum Analyzer.',
      };
    }

    if (text.includes('circular') || text.includes('cosmic') || text.includes('radial') || text.includes('halo')) {
      return {
        type: 'SET_VISUALIZER',
        visualizerMode: 'circular',
        rawText,
        feedbackText: 'Switched to Cosmic Radial Visualizer.',
      };
    }

    if (text.includes('matrix') || text.includes('led') || text.includes('dot matrix')) {
      return {
        type: 'SET_VISUALIZER',
        visualizerMode: 'led_matrix',
        rawText,
        feedbackText: 'Switched to Hi-Fi LED Matrix display.',
      };
    }

    if (text.includes('liquid') || text.includes('flow') || text.includes('neon wave')) {
      return {
        type: 'SET_VISUALIZER',
        visualizerMode: 'liquid_flow',
        rawText,
        feedbackText: 'Switched to Liquid Audio Wave.',
      };
    }

    if (
      text.includes('next visualizer') ||
      text.includes('switch visualizer') ||
      text.includes('change visualizer') ||
      text.includes('cycle visualizer') ||
      text.includes('change visual')
    ) {
      return {
        type: 'NEXT_VISUALIZER',
        rawText,
        feedbackText: 'Switching visualizer display mode.',
      };
    }

    // 6. Track & Station Queries
    if (
      text.includes('what song') ||
      text.includes('what is playing') ||
      text.includes("what's playing") ||
      text.includes('current song') ||
      text.includes('who is this') ||
      text.includes('who is singing') ||
      text.includes('track name') ||
      text.includes('song title')
    ) {
      return {
        type: 'QUERY_SONG',
        rawText,
        feedbackText: 'Fetching current track details...',
      };
    }

    if (
      text.includes('station info') ||
      text.includes('about radio') ||
      text.includes('what is radiodave') ||
      text.includes('tagline')
    ) {
      return {
        type: 'QUERY_STATION',
        rawText,
        feedbackText: "RadioDAVE — Radio's Classic Hits! Broadcasting the finest classic hits 24/7.",
      };
    }

    // 7. Playlist history
    if (
      text.includes('recent') ||
      text.includes('history') ||
      text.includes('last song') ||
      text.includes('playlist') ||
      text.includes('previous songs')
    ) {
      return {
        type: 'SHOW_HISTORY',
        rawText,
        feedbackText: 'Opening recent tracks history.',
      };
    }

    // 8. Help & Commands
    if (
      text.includes('help') ||
      text.includes('commands') ||
      text.includes('what can i say') ||
      text.includes('how to use')
    ) {
      return {
        type: 'SHOW_HELP',
        rawText,
        feedbackText: "Here are voice commands you can say: 'Play RadioDAVE', 'Stop', 'Volume Up', 'Set volume to 80%', or 'What's playing?'.",
      };
    }

    return {
      type: 'UNKNOWN',
      rawText,
      feedbackText: `Command received: "${rawText}". Try saying "Play RadioDAVE", "Stop", or "Volume Up".`,
    };
  }
}
