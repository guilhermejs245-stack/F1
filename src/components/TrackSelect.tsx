import React from 'react';
import { PlayerSaveData } from '../game/types';
import { AudioManager } from '../game/audio';
import { ArrowLeft, Trophy, CheckCircle, Lock, Play } from 'lucide-react';

interface TrackSelectProps {
  saveData: PlayerSaveData;
  onBack: () => void;
  onStartTrack: (trackId: string) => void;
}

const TRACKS_INFO = [
  {
    id: 'industrial',
    name: 'Autódromo Internacional',
    theme: 'Circuito Profissional de Asfalto com Boxes e Arquibancadas',
    difficulty: 'Médio',
    description: 'Pista de asfalto padrão FIA com grid de largada, linha xadrez, pórtico monumental, prédio dos boxes com pit wall, arquibancadas cobertas e zebras vibrantes.',
    ready: true,
  },
  {
    id: 'mountain',
    name: 'Mountain Pass (Touge)',
    theme: 'Subida e Descida Sinuosa',
    difficulty: 'Difícil',
    description: 'Sequência veloz de curvas em gancho e asfalto estreito com barreiras de proteção.',
    ready: false,
    unlockLvl: 3,
  },
  {
    id: 'downtown',
    name: 'Downtown Neon',
    theme: 'Metrópole Urbana Noturna',
    difficulty: 'Fácil',
    description: 'Avenidas largas com iluminação neon pulsante e cruzamentos abertos para drifts em 360.',
    ready: false,
    unlockLvl: 5,
  },
];

export const TrackSelect: React.FC<TrackSelectProps> = ({ saveData, onBack, onStartTrack }) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-10 overflow-y-auto bg-zinc-950 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            AudioManager.getInstance().playUiClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white font-rajdhani font-bold transition shadow-md active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          MENU PRINCIPAL
        </button>

        <div className="text-right">
          <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Nível do Piloto</div>
          <div className="font-orbitron text-base font-black text-white">Nível {saveData.level}</div>
        </div>
      </div>

      {/* Title */}
      <div className="my-6">
        <h2 className="font-orbitron text-3xl md:text-4xl font-black uppercase tracking-tight">
          SELECIONE A <span className="text-cyan-400">PISTA</span>
        </h2>
        <p className="text-zinc-400 font-rajdhani text-sm mt-1">
          Domine cada circuito noturno para acumular pontuações recordes e recompensas em dinheiro.
        </p>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
        {TRACKS_INFO.map((track) => {
          const isUnlocked = track.ready;
          const bestScore = saveData.trackRecords[track.id] || 0;

          return (
            <div
              key={track.id}
              className={`flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                isUnlocked
                  ? 'bg-zinc-900/80 border-cyan-500/40 shadow-xl shadow-cyan-950/20 hover:border-cyan-400'
                  : 'bg-zinc-900/40 border-zinc-800/80 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-orbitron font-bold uppercase px-2.5 py-1 rounded-md ${
                      track.difficulty === 'Fácil'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : track.difficulty === 'Médio'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-red-950 text-red-400 border border-red-800'
                    }`}
                  >
                    {track.difficulty}
                  </span>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-xs font-orbitron font-bold text-cyan-400">
                      <CheckCircle className="w-4 h-4" /> DISPONÍVEL
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-orbitron font-bold text-zinc-500">
                      <Lock className="w-4 h-4" /> NÍVEL {track.unlockLvl}
                    </span>
                  )}
                </div>

                <h3 className="font-orbitron text-2xl font-black text-white">{track.name}</h3>
                <p className="text-xs text-cyan-400/80 font-rajdhani font-semibold mt-0.5">{track.theme}</p>
                <p className="text-xs text-zinc-400 font-rajdhani mt-3 leading-relaxed">
                  {track.description}
                </p>

                {/* Best Score on this track */}
                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-rajdhani">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Recorde do Circuito:
                  </div>
                  <div className="font-orbitron text-sm font-black text-amber-400">
                    {bestScore.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                {isUnlocked ? (
                  <button
                    onClick={() => {
                      AudioManager.getInstance().playUiClick();
                      onStartTrack(track.id);
                    }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-black text-xs uppercase transition shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    CORRER NESTA PISTA
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-xl bg-zinc-800/60 text-zinc-500 font-orbitron font-bold text-xs uppercase cursor-not-allowed"
                  >
                    DESBLOQUEIA NO NÍVEL {track.unlockLvl}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-zinc-500 font-rajdhani text-center mt-4">
        A pista Industrial Night está 100% calibrada com iluminação noturna volumétrica e múltiplos setores de drift contínuo.
      </div>
    </div>
  );
};
