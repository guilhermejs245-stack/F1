import React from 'react';
import { Trophy, Coins, RotateCcw, Wrench, Home, Award } from 'lucide-react';
import { AudioManager } from '../game/audio';

interface ResultsModalProps {
  score: number;
  cashEarned: number;
  isNewRecord: boolean;
  totalCash: number;
  onPlayAgain: () => void;
  onGoToGarage: () => void;
  onGoToMenu: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  score,
  cashEarned,
  isNewRecord,
  totalCash,
  onPlayAgain,
  onGoToGarage,
  onGoToMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center gap-6 text-white text-center">
        {/* Badge / Trophy Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/30 border border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Trophy className="w-10 h-10 text-cyan-400" />
          </div>
          {isNewRecord && (
            <div className="absolute -top-2 -right-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-orbitron font-black text-[10px] uppercase shadow-md animate-bounce">
              NOVO RECORDE!
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h2 className="font-orbitron text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
            SESSÃO FINALIZADA
          </h2>
          <p className="text-xs text-zinc-400 font-rajdhani mt-1">
            Resultados consolidados e recompensas creditadas na sua conta.
          </p>
        </div>

        {/* Stats Summary Box */}
        <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <span className="text-xs font-rajdhani font-semibold text-zinc-400 uppercase">
              Pontuação de Drift
            </span>
            <span className="font-orbitron text-xl font-black text-cyan-400">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <span className="text-xs font-rajdhani font-semibold text-zinc-400 uppercase flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" /> Recompensa CASH
            </span>
            <span className="font-orbitron text-lg font-black text-emerald-400">
              +${cashEarned.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-semibold text-zinc-400 uppercase">
              Saldo Total Disponível
            </span>
            <span className="font-orbitron text-base font-bold text-white">
              ${totalCash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onPlayAgain();
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            CORRER NOVAMENTE
          </button>

          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onGoToGarage();
            }}
            className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-white font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            IR PARA A GARAGEM
          </button>

          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onGoToMenu();
            }}
            className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            MENU PRINCIPAL
          </button>
        </div>
      </div>
    </div>
  );
};
