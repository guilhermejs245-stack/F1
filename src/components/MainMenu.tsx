import React from 'react';
import { PlayerSaveData } from '../game/types';
import { Play, Wrench, Car, Flag, Settings, Trophy, Coins, Award } from 'lucide-react';

interface MainMenuProps {
  saveData: PlayerSaveData;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenCars: () => void;
  onOpenTracks: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onPlay,
  onOpenGarage,
  onOpenCars,
  onOpenTracks,
  onOpenSettings,
}) => {
  const currentCar = saveData.cars[saveData.selectedCarId] || Object.values(saveData.cars)[0];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 overflow-hidden bg-radial from-zinc-900 via-zinc-950 to-black">
      {/* Background ambient decorative shapes & neon grid */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Top Header: Player Profile Stats */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-10 bg-cyan-400 rounded-full inline-block" />
            <span className="font-rajdhani text-xs md:text-sm font-bold tracking-widest text-cyan-400 uppercase">
              Pro Drift Series
            </span>
          </div>
          <h1 className="font-orbitron text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase drop-shadow-md">
            STREET <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">DRIFT</span>
          </h1>
        </div>

        {/* Currency & Level Pill Badges */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Level */}
          <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2 shadow-lg">
            <Award className="w-5 h-5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Nível</span>
              <span className="font-orbitron text-base font-black text-white">{saveData.level}</span>
            </div>
          </div>

          {/* Cash */}
          <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-emerald-500/40 rounded-xl px-4 py-2 shadow-lg shadow-emerald-950/20">
            <Coins className="w-5 h-5 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">CASH</span>
              <span className="font-orbitron text-base font-black text-emerald-400">
                ${saveData.cash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Best Score */}
          <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-amber-500/40 rounded-xl px-4 py-2 shadow-lg shadow-amber-950/20">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Recorde</span>
              <span className="font-orbitron text-base font-black text-amber-400">
                {saveData.bestScore.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Left: Selected Car Glance & Menu Action Buttons */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 my-auto">
        {/* Navigation Action Buttons */}
        <div className="flex flex-col gap-3.5 w-full max-w-xs">
          {/* PLAY BUTTON (Hero) */}
          <button
            onClick={onPlay}
            className="group relative flex items-center justify-between px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-black text-xl tracking-wider uppercase shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
          >
            <span className="flex items-center gap-3 text-zinc-950">
              <Play className="w-6 h-6 fill-current" />
              JOGAR
            </span>
            <span className="text-zinc-950 font-bold opacity-60 group-hover:translate-x-1 transition-transform">
              ►
            </span>
          </button>

          {/* GARAGE */}
          <button
            onClick={onOpenGarage}
            className="group flex items-center justify-between px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 hover:border-cyan-400/50 text-white font-orbitron font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-98"
          >
            <span className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-cyan-400" />
              GARAGEM & UPGRADES
            </span>
            <span className="text-zinc-500 group-hover:text-cyan-400 transition-colors">►</span>
          </button>

          {/* CARS */}
          <button
            onClick={onOpenCars}
            className="group flex items-center justify-between px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 hover:border-cyan-400/50 text-white font-orbitron font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-98"
          >
            <span className="flex items-center gap-3">
              <Car className="w-5 h-5 text-red-400" />
              CARROS
            </span>
            <span className="text-zinc-500 group-hover:text-red-400 transition-colors">►</span>
          </button>

          {/* TRACKS */}
          <button
            onClick={onOpenTracks}
            className="group flex items-center justify-between px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 hover:border-cyan-400/50 text-white font-orbitron font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-98"
          >
            <span className="flex items-center gap-3">
              <Flag className="w-5 h-5 text-amber-400" />
              PISTAS
            </span>
            <span className="text-zinc-500 group-hover:text-amber-400 transition-colors">►</span>
          </button>

          {/* SETTINGS */}
          <button
            onClick={onOpenSettings}
            className="group flex items-center justify-between px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 hover:border-zinc-500 text-white font-orbitron font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-98"
          >
            <span className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-zinc-400" />
              CONFIGURAÇÕES
            </span>
            <span className="text-zinc-500 group-hover:text-white transition-colors">►</span>
          </button>
        </div>

        {/* Selected Vehicle Showcase Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 backdrop-blur-md rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-rajdhani font-bold text-zinc-400">Veículo Equipado</span>
            <div
              className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: currentCar.color }}
            />
          </div>

          <div>
            <h3 className="font-orbitron font-black text-2xl text-white tracking-wide">{currentCar.name}</h3>
            <p className="text-xs text-zinc-400 font-rajdhani">{currentCar.subtitle}</p>
          </div>

          {/* Quick Stats Bars */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div>
              <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
                <span>VELOCIDADE</span>
                <span className="text-white font-bold">{Math.round(currentCar.maxSpeed * 10)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${currentCar.maxSpeed * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
                <span>DRIFT SLIP</span>
                <span className="text-white font-bold">{Math.round(currentCar.driftFactor * 10)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-400 rounded-full"
                  style={{ width: `${currentCar.driftFactor * 10}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
                <span>CONTROLE</span>
                <span className="text-white font-bold">{Math.round(currentCar.handling * 10)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${currentCar.handling * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between text-xs text-zinc-500 font-rajdhani pt-4 border-t border-zinc-900">
        <div>Controles: W/A/S/D ou Teclas de Seta • ESPAÇO: Freio de Mão • R: Resetar • ESC: Pausa</div>
        <div>Street Drift 3D • Versão WebGL 1.0</div>
      </div>
    </div>
  );
};
