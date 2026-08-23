import React, { useEffect, useRef, useState } from 'react';
import { VisualizerMode } from '../types';
import { AudioEngine } from '../services/audioEngine';
import { 
  Activity, 
  BarChart3, 
  Gauge, 
  Orbit, 
  Grid3X3, 
  Waves,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface AudioVisualizerProps {
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  albumArt?: string;
  isPlaying: boolean;
}

export const VISUALIZER_OPTIONS: { id: VisualizerMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'spectrum', label: 'Spectrum Bars', icon: BarChart3, desc: 'Real-time multi-band frequency analyzer' },
  { id: 'vu_meter', label: 'Analog VU Meter', icon: Gauge, desc: 'Dual classic ballistic needle dials' },
  { id: 'oscilloscope', label: 'Oscilloscope', icon: Activity, desc: 'Phosphor vector waveform trace' },
  { id: 'circular', label: 'Cosmic Halo', icon: Orbit, desc: '360° radial frequency starburst' },
  { id: 'led_matrix', label: 'LED Dot Matrix', icon: Grid3X3, desc: 'Vintage 28-band studio LED stack' },
  { id: 'liquid_flow', label: 'Liquid Waves', icon: Waves, desc: 'Fluid multi-harmonic neon wave' },
];

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode,
  onModeChange,
  albumArt,
  isPlaying,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Peak hold data for spectrum & LED matrix
  const peakValuesRef = useRef<number[]>([]);
  const peakSpeedRef = useRef<number[]>([]);
  const circularImageRef = useRef<HTMLImageElement | null>(null);

  // Preload logo/album art image for circular mode
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = albumArt || '/logo.png';
    img.onload = () => {
      circularImageRef.current = img;
    };
  }, [albumArt]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    const engine = AudioEngine.getInstance();

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);
    resizeCanvas();

    // Render loop
    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || !container) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const data = engine.getVisualizerData();

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      switch (mode) {
        case 'spectrum':
          drawSpectrum(ctx, width, height, data.frequency, isPlaying);
          break;
        case 'vu_meter':
          drawDualVuMeters(ctx, width, height, data.leftVu, data.rightVu, data.leftPeak, data.rightPeak, isPlaying);
          break;
        case 'oscilloscope':
          drawOscilloscope(ctx, width, height, data.timeDomain, isPlaying);
          break;
        case 'circular':
          drawCircularVisualizer(ctx, width, height, data.frequency, circularImageRef.current, isPlaying);
          break;
        case 'led_matrix':
          drawLedMatrix(ctx, width, height, data.frequency, isPlaying);
          break;
        case 'liquid_flow':
          drawLiquidWaves(ctx, width, height, data.frequency, data.timeDomain, isPlaying);
          break;
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [mode, isPlaying]);

  // Visualizer 1: Spectrum Bars with peak caps & floor reflection
  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freq: Uint8Array,
    playing: boolean
  ) => {
    const barCount = Math.min(48, Math.floor(width / 14));
    const gap = 3;
    const totalBarWidth = (width - 40) / barCount;
    const barWidth = Math.max(3, totalBarWidth - gap);
    const startX = 20;
    const bottomY = height - 28;
    const maxHeight = height - 60;

    // Draw background frequency grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = bottomY - (maxHeight * (i / 4));
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(width - startX, y);
      ctx.stroke();
    }

    if (peakValuesRef.current.length !== barCount) {
      peakValuesRef.current = new Array(barCount).fill(0);
      peakSpeedRef.current = new Array(barCount).fill(0);
    }

    // Step across frequencies with logarithmic bias
    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor(Math.pow(i / barCount, 1.4) * (freq.length * 0.75));
      const val = playing ? (freq[freqIndex] || 0) : 0;
      const normalized = val / 255;
      const barHeight = Math.max(2, normalized * maxHeight);

      // Peak cap calculation
      if (barHeight >= peakValuesRef.current[i]) {
        peakValuesRef.current[i] = barHeight;
        peakSpeedRef.current[i] = 0;
      } else {
        peakSpeedRef.current[i] += 0.25;
        peakValuesRef.current[i] = Math.max(0, peakValuesRef.current[i] - peakSpeedRef.current[i]);
      }

      const x = startX + i * (barWidth + gap);
      const y = bottomY - barHeight;

      // Immersive UI Theme Gradient: Electric Blue -> Light Blue -> Soft Azure Peak
      const gradient = ctx.createLinearGradient(x, bottomY, x, bottomY - maxHeight);
      gradient.addColorStop(0, '#1d4ed8');
      gradient.addColorStop(0.45, '#3b82f6');
      gradient.addColorStop(0.8, '#60a5fa');
      gradient.addColorStop(1, '#93c5fd');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
      ctx.fill();

      // Peak cap line with blue neon glow
      const peakY = bottomY - peakValuesRef.current[i];
      if (peakY < bottomY - 3) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, peakY - 2, barWidth, 2);
        ctx.shadowBlur = 0;
      }

      // Subtle reflection below floor line
      const reflGradient = ctx.createLinearGradient(x, bottomY, x, bottomY + 20);
      reflGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      reflGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = reflGradient;
      ctx.fillRect(x, bottomY + 2, barWidth, barHeight * 0.25);
    }

    // Floor line
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX - 5, bottomY + 1);
    ctx.lineTo(width - startX + 5, bottomY + 1);
    ctx.stroke();

    // Frequency labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    const labels = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'];
    labels.forEach((lbl, idx) => {
      const lx = startX + (idx / (labels.length - 1)) * (width - startX * 2);
      ctx.fillText(lbl, lx, height - 8);
    });
  };

  // Visualizer 2: Dual Analog VU Meters
  const drawDualVuMeters = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    leftLevel: number,
    rightLevel: number,
    leftPeak: number,
    rightPeak: number,
    playing: boolean
  ) => {
    const meterWidth = Math.min(width * 0.46, (width - 40) / 2);
    const meterHeight = Math.min(height - 24, meterWidth * 0.65);
    const gap = 16;
    const startX = (width - (meterWidth * 2 + gap)) / 2;
    const startY = (height - meterHeight) / 2;

    // Draw Left Channel VU
    drawSingleVuMeter(
      ctx,
      startX,
      startY,
      meterWidth,
      meterHeight,
      'LEFT CHANNEL (L)',
      leftLevel,
      leftPeak,
      playing
    );

    // Draw Right Channel VU
    drawSingleVuMeter(
      ctx,
      startX + meterWidth + gap,
      startY,
      meterWidth,
      meterHeight,
      'RIGHT CHANNEL (R)',
      rightLevel,
      rightPeak,
      playing
    );
  };

  const drawSingleVuMeter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    level: number,
    peak: number,
    playing: boolean
  ) => {
    // Meter Bezel & Housing
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vintage warm backlight illumination dial face
    const dialMargin = 8;
    const dialX = x + dialMargin;
    const dialY = y + dialMargin;
    const dialW = w - dialMargin * 2;
    const dialH = h - dialMargin * 2;

    ctx.beginPath();
    ctx.roundRect(dialX, dialY, dialW, dialH, 6);
    const dialBg = ctx.createRadialGradient(
      dialX + dialW / 2,
      dialY + dialH * 0.9,
      10,
      dialX + dialW / 2,
      dialY + dialH * 0.4,
      dialW * 0.7
    );
    dialBg.addColorStop(0, '#fef3c7');
    dialBg.addColorStop(0.65, '#fde68a');
    dialBg.addColorStop(1, '#d97706');
    ctx.fillStyle = dialBg;
    ctx.fill();

    // Pivot location at bottom center
    const pivotX = dialX + dialW / 2;
    const pivotY = dialY + dialH * 1.15;
    const needleRadius = dialH * 1.12;

    // Arc scale lines
    const minAngle = -Math.PI * 0.68;
    const maxAngle = -Math.PI * 0.32;
    const totalAngle = maxAngle - minAngle;

    // Draw main black scale arc (-20 to 0 dB) and red scale arc (0 to +3 dB)
    const zeroDbAngle = minAngle + totalAngle * 0.72;

    // Black Arc
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, needleRadius * 0.88, minAngle, zeroDbAngle);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Red Warning Arc
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, needleRadius * 0.88, zeroDbAngle, maxAngle);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Ticks & dB markings
    const ticks = [
      { val: -20, norm: 0.0, label: '-20' },
      { val: -10, norm: 0.22, label: '-10' },
      { val: -7, norm: 0.36, label: '-7' },
      { val: -5, norm: 0.48, label: '-5' },
      { val: -3, norm: 0.58, label: '-3' },
      { val: -1, norm: 0.66, label: '-1' },
      { val: 0, norm: 0.72, label: '0' },
      { val: 1, norm: 0.82, label: '+1' },
      { val: 2, norm: 0.91, label: '+2' },
      { val: 3, norm: 1.0, label: '+3' },
    ];

    ticks.forEach(t => {
      const ang = minAngle + totalAngle * t.norm;
      const isRed = t.val > 0;
      const tickOuter = needleRadius * 0.92;
      const tickInner = needleRadius * 0.82;

      ctx.strokeStyle = isRed ? '#dc2626' : '#1e293b';
      ctx.lineWidth = t.val === 0 ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.moveTo(pivotX + Math.cos(ang) * tickInner, pivotY + Math.sin(ang) * tickInner);
      ctx.lineTo(pivotX + Math.cos(ang) * tickOuter, pivotY + Math.sin(ang) * tickOuter);
      ctx.stroke();

      if (t.label) {
        ctx.fillStyle = isRed ? '#b91c1c' : '#0f172a';
        ctx.font = 'bold 9px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lblR = needleRadius * 0.72;
        ctx.fillText(t.label, pivotX + Math.cos(ang) * lblR, pivotY + Math.sin(ang) * lblR);
      }
    });

    // VU text and Channel Badge
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 12px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VU', pivotX, dialY + dialH * 0.38);

    ctx.fillStyle = '#451a03';
    ctx.font = '700 8px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, pivotX, dialY + dialH * 0.52);

    // Peak LED Lamp (top-right of meter)
    const ledX = dialX + dialW - 14;
    const ledY = dialY + 14;
    const isPeakHot = peak > 0.85;

    ctx.beginPath();
    ctx.arc(ledX, ledY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isPeakHot ? '#ef4444' : '#450a0a';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (isPeakHot) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#fca5a5';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#991b1b';
    ctx.font = '6px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('PEAK', ledX - 6, ledY + 2);

    // Needle Calculation
    const targetNorm = playing ? Math.min(1.05, Math.max(0, level)) : 0;
    const needleAngle = minAngle + totalAngle * targetNorm;

    // Needle shadow
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pivotX + 2, pivotY + 2);
    ctx.lineTo(
      pivotX + Math.cos(needleAngle) * (needleRadius * 0.94) + 2,
      pivotY + Math.sin(needleAngle) * (needleRadius * 0.94) + 2
    );
    ctx.stroke();

    // Actual Needle (Matte Black with Red Tip)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(
      pivotX + Math.cos(needleAngle) * (needleRadius * 0.94),
      pivotY + Math.sin(needleAngle) * (needleRadius * 0.94)
    );
    ctx.stroke();

    // Red needle tip
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(
      pivotX + Math.cos(needleAngle) * (needleRadius * 0.75),
      pivotY + Math.sin(needleAngle) * (needleRadius * 0.75)
    );
    ctx.lineTo(
      pivotX + Math.cos(needleAngle) * (needleRadius * 0.94),
      pivotY + Math.sin(needleAngle) * (needleRadius * 0.94)
    );
    ctx.stroke();

    // Pivot cap
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  // Visualizer 3: Oscilloscope CRT Vector Waveform
  const drawOscilloscope = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeData: Uint8Array,
    playing: boolean
  ) => {
    // CRT screen background
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      10,
      width / 2,
      height / 2,
      width * 0.6
    );
    bgGrad.addColorStop(0, '#042f2e');
    bgGrad.addColorStop(1, '#021817');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Reticle / Scope Graticule Grid
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.15)';
    ctx.lineWidth = 1;

    const divisionsX = 10;
    const divisionsY = 8;
    for (let x = 0; x <= divisionsX; x++) {
      const gx = (width / divisionsX) * x;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let y = 0; y <= divisionsY; y++) {
      const gy = (height / divisionsY) * y;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }

    // Center crosshairs with sub-ticks
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Waveform Trace
    ctx.shadowColor = '#2dd4bf';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    const sliceWidth = width / (timeData.length - 1);
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = playing ? (timeData[i] / 128.0) : 1.0;
      const y = (v * (height / 2));

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing beam scanline overlay
    ctx.fillStyle = 'rgba(94, 234, 212, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Scope HUD text
    ctx.fillStyle = '#2dd4bf';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillText('CH1 100mV/DIV', 16, 20);
    ctx.fillText('TIME: 2.0ms/DIV', 16, 36);
    ctx.textAlign = 'right';
    ctx.fillText(playing ? 'TRIG: AUTO [LOCKED]' : 'TRIG: STANDBY', width - 16, 20);
  };

  // Visualizer 4: Cosmic / Radial 360 Halo
  const drawCircularVisualizer = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freq: Uint8Array,
    img: HTMLImageElement | null,
    playing: boolean
  ) => {
    const cx = width / 2;
    const cy = height / 2;
    const baseRadius = Math.min(width, height) * 0.22;
    const maxBarLength = Math.min(width, height) * 0.22;

    const numPoints = 64;
    const angleStep = (Math.PI * 2) / numPoints;

    // Draw background nebula
    const radialBg = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius * 2.2);
    radialBg.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
    radialBg.addColorStop(0.6, 'rgba(147, 51, 234, 0.08)');
    radialBg.addColorStop(1, 'transparent');
    ctx.fillStyle = radialBg;
    ctx.fillRect(0, 0, width, height);

    // Radiating rays
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      // Mirror frequency indexing around circle
      const fIndex = i < numPoints / 2 ? i : numPoints - i;
      const val = playing ? (freq[fIndex] || 0) : 0;
      const barLen = Math.max(4, (val / 255) * maxBarLength);

      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + barLen);
      const y2 = cy + Math.sin(angle) * (baseRadius + barLen);

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(0.5, '#a855f7');
      grad.addColorStop(1, '#ec4899');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Outer particle dot
      if (barLen > 25) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(angle) * (baseRadius + barLen + 4),
          cy + Math.sin(angle) * (baseRadius + barLen + 4),
          1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Inner center ring / crest
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius - 2, 0, Math.PI * 2);
    ctx.clip();

    if (img && img.complete) {
      ctx.drawImage(img, cx - baseRadius, cy - baseRadius, baseRadius * 2, baseRadius * 2);
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RadioDAVE', cx, cy);
    }
    ctx.restore();

    // Outer glow border around center disc
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  // Visualizer 5: LED Matrix 28-band Graphic EQ
  const drawLedMatrix = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freq: Uint8Array,
    playing: boolean
  ) => {
    const columns = 28;
    const rows = 18;
    const colGap = 4;
    const rowGap = 3;
    const startX = 20;
    const startY = 24;
    const usableWidth = width - startX * 2;
    const usableHeight = height - startY - 24;

    const ledWidth = (usableWidth - (columns - 1) * colGap) / columns;
    const ledHeight = (usableHeight - (rows - 1) * rowGap) / rows;

    for (let c = 0; c < columns; c++) {
      const fIdx = Math.floor(Math.pow(c / columns, 1.3) * (freq.length * 0.7));
      const val = playing ? (freq[fIdx] || 0) : 0;
      const activeRows = Math.round((val / 255) * rows);

      for (let r = 0; r < rows; r++) {
        const x = startX + c * (ledWidth + colGap);
        // Rows from bottom to top
        const y = startY + (rows - 1 - r) * (ledHeight + rowGap);
        const isActive = r < activeRows;

        // Color coding: Green bottom 60%, Yellow mid 25%, Red top 15%
        let activeColor = '#22c55e'; // green
        let dimColor = '#052e16';
        let glowColor = '#4ade80';

        if (r >= rows * 0.82) {
          activeColor = '#ef4444'; // red
          dimColor = '#450a0a';
          glowColor = '#f87171';
        } else if (r >= rows * 0.6) {
          activeColor = '#eab308'; // yellow
          dimColor = '#422006';
          glowColor = '#facc15';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, ledWidth, ledHeight, 2);
        ctx.fillStyle = isActive ? activeColor : dimColor;
        if (isActive) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 4;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Grid labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    const freqs = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
    freqs.forEach((f, idx) => {
      const x = startX + (idx / (freqs.length - 1)) * usableWidth;
      ctx.fillText(f, x, height - 6);
    });
  };

  // Visualizer 6: Liquid Harmonic Neon Waves
  const drawLiquidWaves = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freq: Uint8Array,
    timeData: Uint8Array,
    playing: boolean
  ) => {
    const bass = playing ? (freq[2] || 20) / 255 : 0.05;
    const mid = playing ? (freq[16] || 20) / 255 : 0.05;
    const treble = playing ? (freq[32] || 20) / 255 : 0.05;

    const layers = [
      { color: 'rgba(99, 102, 241, 0.45)', speed: 0.02, amp: 35 * bass + 10, freq: 0.008, offset: 0 },
      { color: 'rgba(6, 182, 212, 0.45)', speed: 0.03, amp: 45 * mid + 12, freq: 0.012, offset: Math.PI / 2 },
      { color: 'rgba(236, 72, 153, 0.45)', speed: 0.025, amp: 40 * treble + 8, freq: 0.015, offset: Math.PI },
    ];

    const time = Date.now() * 0.002;

    layers.forEach((layer) => {
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 10) {
        const tIndex = Math.floor((x / width) * (timeData.length - 1));
        const timeFactor = (timeData[tIndex] - 128) / 128;
        const wave = Math.sin(x * layer.freq + time * layer.speed * 20 + layer.offset) * layer.amp;
        const y = height * 0.55 + wave + (playing ? timeFactor * 25 : 0);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    });
  };

  return (
    <div 
      ref={containerRef}
      id="radio-visualizer-container"
      className={`relative w-full rounded-2xl overflow-hidden border border-white/5 bg-[#080808]/90 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-72 md:h-80'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Top Overlay Controls: Mode Switcher & Fullscreen */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Mode selection pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-lg pointer-events-auto overflow-x-auto max-w-[82vw] sm:max-w-none scrollbar-none">
          {VISUALIZER_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = mode === opt.id;
            return (
              <button
                key={opt.id}
                id={`visualizer-tab-${opt.id}`}
                onClick={() => onModeChange(opt.id)}
                title={opt.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Fullscreen button */}
        <button
          id="btn-toggle-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Visualizer'}
          className="p-2 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 pointer-events-auto transition cursor-pointer shadow-lg ml-2"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Mode name watermark badge */}
      <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]"></span>
        <span className="text-[11px] font-mono-tech tracking-widest text-slate-500 uppercase">
          VISUALIZER: {VISUALIZER_OPTIONS.find(o => o.id === mode)?.label || mode}
        </span>
      </div>
    </div>
  );
};
