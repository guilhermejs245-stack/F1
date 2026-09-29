import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';
import { AudioManager } from '../game/audio';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onExitToMenu }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-white">
        {/* Title */}
        <div className="text-center">
          <div className="text-xs uppercase font-rajdhani font-bold text-cyan-400 tracking-widest">
            Jogo em Espera
          </div>
          <h2 className="font-orbitron text-3xl font-black uppercase tracking-wider text-white mt-1">
            PAUSADO
          </h2>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onResume();
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-black text-sm tracking-wider uppercase shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2.5 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            CONTINUAR
          </button>

          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onRestart();
            }}
            className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-white font-orbitron font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            REINICIAR CARRO
          </button>

          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onExitToMenu();
            }}
            className="w-full py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-orbitron font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2.5 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            SAIR PARA O MENU
          </button>
        </div>

        <div className="text-[11px] font-rajdhani text-zinc-500 text-center">
          Pressione ESC para retornar rapidamente à corrida
        </div>
      </div>
    </div>
  );
};
