import React, { useRef } from 'react';
import { DriftEventState } from '../game/types';
import { Pause, RotateCcw, Camera, Zap, Gauge } from 'lucide-react';

interface HUDProps {
  driftState: DriftEventState;
  fps: number;
  showFps: boolean;
  showTouchControls?: boolean;
  trackName: string;
  onPause: () => void;
  onResetCar: () => void;
  onCycleCamera?: () => void;
  onTouchInput: (steer: number, throttle: number, brake: number, handbrake: boolean) => void;
  minimapRef: React.RefObject<HTMLCanvasElement | null>;
}

export const HUD: React.FC<HUDProps> = ({
  driftState,
  fps,
  showFps,
  showTouchControls = false,
  trackName,
  onPause,
  onResetCar,
  onCycleCamera,
  onTouchInput,
  minimapRef,
}) => {
  // Mobile virtual joystick/button states (only if showTouchControls is active)
  const steerRef = useRef(0);
  const throttleRef = useRef(0);
  const brakeRef = useRef(0);
  const handbrakeRef = useRef(false);

  const updateTouch = () => {
    onTouchInput(steerRef.current, throttleRef.current, brakeRef.current, handbrakeRef.current);
  };

  // Speedometer calc for F1 (up to 360 km/h)
  const speedPercentage = Math.min(100, (driftState.speedKmh / 360) * 100);

  // F1 8-Speed Seamless Shift Gearbox
  const gear =
    driftState.speedKmh === 0
      ? 'N'
      : driftState.speedKmh < 68
      ? '1'
      : driftState.speedKmh < 118
      ? '2'
      : driftState.speedKmh < 168
      ? '3'
      : driftState.speedKmh < 212
      ? '4'
      : driftState.speedKmh < 256
      ? '5'
      : driftState.speedKmh < 298
      ? '6'
      : driftState.speedKmh < 332
      ? '7'
      : '8';

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden z-20">
      {/* Top Bar: Track, Score & PC Quick Action Buttons */}
      <div className="flex items-start justify-between w-full">
        {/* Track info & Score */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
            <span className="font-orbitron text-xs tracking-widest text-cyan-400 uppercase font-black">
              {trackName}
            </span>
          </div>

          {/* Session Drift Score */}
          <div className="bg-zinc-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-4 py-2.5 shadow-xl shadow-cyan-950/30">
            <div className="text-[10px] text-zinc-400 font-rajdhani font-semibold tracking-wider uppercase">
              Pontuação de Drift
            </div>
            <div className="font-orbitron text-2xl md:text-3xl font-black text-white tracking-wider neon-glow-cyan">
              {driftState.score.toLocaleString()}
            </div>
          </div>

          {showFps && (
            <div className="text-[11px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 w-max">
              FPS: <span className={fps < 30 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{fps}</span>
            </div>
          )}
        </div>

        {/* Center: Active Drift & Combo Status */}
        <div className="flex flex-col items-center">
          {driftState.isDrifting && (
            <div className="flex flex-col items-center animate-bounce">
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 px-4 py-1.5 rounded-full border border-cyan-300/40 shadow-xl">
                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span className="font-orbitron font-black text-sm md:text-base text-white tracking-wider">
                  DRIFT {driftState.angle}°
                </span>
              </div>
              {driftState.proximityBonus && (
                <div className="mt-1 text-[11px] font-bold text-amber-300 tracking-wider animate-pulse">
                  BARREIRA PRÓXIMA +60%
                </div>
              )}
            </div>
          )}

          {/* Combo Multiplier Box */}
          {driftState.combo > 1 && (
            <div className="mt-2 flex flex-col items-center">
              <div className="font-orbitron text-xl md:text-2xl font-black text-amber-400 neon-glow-amber">
                x{driftState.combo}
              </div>
              {/* Combo decay timer bar */}
              <div className="w-28 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1 border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-75"
                  style={{ width: `${driftState.comboTimer * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Callout Popup */}
          {driftState.calloutText && (
            <div
              className={`mt-3 px-4 py-1.5 rounded-xl font-orbitron font-black text-sm md:text-lg tracking-wider uppercase shadow-2xl transform transition-transform ${
                driftState.calloutType === 'lost'
                  ? 'bg-red-900/90 text-red-200 border border-red-500 scale-95'
                  : driftState.calloutType === 'perfect'
                  ? 'bg-purple-600 text-white border border-purple-300 scale-110 neon-glow-cyan'
                  : 'bg-cyan-500 text-black border border-cyan-200 scale-105'
              }`}
            >
              {driftState.calloutText}
            </div>
          )}
        </div>

        {/* Right side: Minimap and PC Action Buttons */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Action buttons (Camera, Reset, Pause) */}
          <div className="flex items-center gap-2">
            {onCycleCamera && (
              <button
                onClick={onCycleCamera}
                title="Mudar Câmera (Tecla C)"
                className="p-2.5 bg-zinc-950/85 hover:bg-zinc-800 backdrop-blur-md border border-zinc-800 hover:border-purple-400/50 rounded-xl text-purple-400 hover:text-white transition shadow-lg active:scale-95 flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] font-orbitron font-bold">C</span>
              </button>
            )}

            <button
              onClick={onResetCar}
              title="Resetar Carro na Pista (Tecla R)"
              className="p-2.5 bg-zinc-950/85 hover:bg-zinc-800 backdrop-blur-md border border-zinc-800 hover:border-zinc-600 rounded-xl text-zinc-300 hover:text-white transition shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline text-[11px] font-orbitron font-bold">R</span>
            </button>

            <button
              onClick={onPause}
              title="Pausar o Jogo (Tecla ESC)"
              className="p-2.5 bg-zinc-950/85 hover:bg-zinc-800 backdrop-blur-md border border-zinc-800 hover:border-cyan-400/50 rounded-xl text-zinc-300 hover:text-white transition shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <Pause className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-orbitron font-bold">ESC</span>
            </button>
          </div>

          {/* 2D Minimap Canvas */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 bg-zinc-950/90">
            <canvas
              ref={minimapRef}
              width={160}
              height={160}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar: PC Keyboard Guide & Racing Cockpit Cluster */}
      <div className="flex items-end justify-between w-full">
        {/* Left Side: PC Keyboard Keybindings Guide (or touch buttons if enabled) */}
        {!showTouchControls ? (
          <div className="pointer-events-auto bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col gap-2 shadow-2xl max-w-sm">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
              <span className="text-[10px] uppercase font-orbitron font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Controles do Computador
              </span>
              <span className="text-[9px] font-rajdhani text-zinc-500 font-semibold">TECLADO PC</span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-rajdhani text-zinc-300">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-cyan-300 font-bold text-[11px]">
                  W
                </kbd>
                <span>Acelerar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-cyan-300 font-bold text-[11px]">
                  S
                </kbd>
                <span>Freio / Ré</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-cyan-300 font-bold text-[11px]">
                  A
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-cyan-300 font-bold text-[11px]">
                  D
                </kbd>
                <span>Virar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-amber-300 font-bold text-[10px]">
                  ESPAÇO
                </kbd>
                <span>Drift / Mão</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-purple-300 font-bold text-[11px]">
                  C
                </kbd>
                <span>Câmera</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-zinc-400 font-bold text-[11px]">
                  R
                </kbd>
                <span>Resetar</span>
              </div>
            </div>
          </div>
        ) : (
          /* Mobile Steering Buttons (Fallback if touch enabled) */
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onTouchStart={() => { steerRef.current = 1; updateTouch(); }}
              onTouchEnd={() => { steerRef.current = 0; updateTouch(); }}
              onMouseDown={() => { steerRef.current = 1; updateTouch(); }}
              onMouseUp={() => { steerRef.current = 0; updateTouch(); }}
              className="w-16 h-16 bg-zinc-900/60 active:bg-cyan-500/40 backdrop-blur-md border-2 border-zinc-700 active:border-cyan-400 rounded-2xl flex items-center justify-center text-white text-2xl font-black font-orbitron select-none shadow-xl"
            >
              ◄
            </button>
            <button
              onTouchStart={() => { steerRef.current = -1; updateTouch(); }}
              onTouchEnd={() => { steerRef.current = 0; updateTouch(); }}
              onMouseDown={() => { steerRef.current = -1; updateTouch(); }}
              onMouseUp={() => { steerRef.current = 0; updateTouch(); }}
              className="w-16 h-16 bg-zinc-900/60 active:bg-cyan-500/40 backdrop-blur-md border-2 border-zinc-700 active:border-cyan-400 rounded-2xl flex items-center justify-center text-white text-2xl font-black font-orbitron select-none shadow-xl"
            >
              ►
            </button>
          </div>
        )}

        {/* Right Side: PC Racing Speedometer & Gear Cockpit Gauge */}
        <div className="pointer-events-auto flex items-end gap-4">
          <div className="flex flex-col items-center bg-zinc-950/90 backdrop-blur-md px-6 py-3.5 rounded-3xl border border-zinc-800 shadow-2xl min-w-[210px]">
            {/* Gear & Speed row */}
            <div className="flex items-baseline justify-between w-full">
              {/* Digital Gear Box */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-orbitron font-bold text-zinc-500 uppercase">MARCHA</span>
                <span className="font-orbitron text-2xl font-black text-cyan-400">{gear}</span>
              </div>

              {/* Big Digital Speed KM/H */}
              <div className="flex items-baseline gap-1.5 ml-4">
                <span className="font-orbitron text-4xl md:text-5xl font-black text-white tracking-tight">
                  {driftState.speedKmh}
                </span>
                <span className="font-rajdhani text-xs font-bold text-cyan-400 uppercase">KM/H</span>
              </div>
            </div>

            {/* F1 Shift Lights LED Bar */}
            <div className="flex gap-1 w-full justify-between mt-2.5 px-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`g-${i}`}
                  className={`h-2 flex-1 rounded-sm transition-colors ${
                    speedPercentage > 15 + i * 10
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={`r-${i}`}
                  className={`h-2 flex-1 rounded-sm transition-colors ${
                    speedPercentage > 60 + i * 6
                      ? 'bg-red-500 shadow-sm shadow-red-500'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
              {[0, 1, 2].map((i) => (
                <div
                  key={`p-${i}`}
                  className={`h-2 flex-1 rounded-sm transition-colors ${
                    speedPercentage > 88 + i * 4
                      ? 'bg-purple-400 animate-pulse shadow-sm shadow-purple-400'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Sub-bar with F1 RPM marks */}
            <div className="flex justify-between w-full text-[8px] font-mono text-zinc-400 mt-1">
              <span>0</span>
              <span>4K</span>
              <span>8K</span>
              <span>11K</span>
              <span className="text-red-400 font-bold">14K RPM</span>
            </div>
          </div>

          {/* Touch pedals only if showTouchControls is active */}
          {showTouchControls && (
            <div className="pointer-events-auto flex items-end gap-2">
              <button
                onTouchStart={() => { handbrakeRef.current = true; updateTouch(); }}
                onTouchEnd={() => { handbrakeRef.current = false; updateTouch(); }}
                className="w-14 h-14 bg-amber-600/60 active:bg-amber-500 rounded-2xl flex flex-col items-center justify-center text-white font-orbitron font-bold text-[10px]"
              >
                FREIO
              </button>
              <button
                onTouchStart={() => { brakeRef.current = 1; updateTouch(); }}
                onTouchEnd={() => { brakeRef.current = 0; updateTouch(); }}
                className="w-16 h-16 bg-red-600/60 active:bg-red-500 rounded-2xl flex flex-col items-center justify-center text-white font-orbitron font-bold text-xs"
              >
                RÉ
              </button>
              <button
                onTouchStart={() => { throttleRef.current = 1; updateTouch(); }}
                onTouchEnd={() => { throttleRef.current = 0; updateTouch(); }}
                className="w-16 h-20 bg-emerald-600/70 active:bg-emerald-500 rounded-2xl flex flex-col items-center justify-center text-white font-orbitron font-black text-sm"
              >
                GAS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
