import React, { useState } from 'react';
import { PlayerSaveData, CarStats } from '../game/types';
import { AudioManager } from '../game/audio';
import { ArrowLeft, Coins, Lock, CheckCircle, Zap } from 'lucide-react';

interface CarSelectProps {
  saveData: PlayerSaveData;
  onBack: () => void;
  onUpdateSave: (updater: (prev: PlayerSaveData) => PlayerSaveData) => void;
}

export const CarSelect: React.FC<CarSelectProps> = ({ saveData, onBack, onUpdateSave }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const cars = Object.values(saveData.cars);

  const handleSelect = (carId: string) => {
    AudioManager.getInstance().playUiClick();
    onUpdateSave((prev) => ({
      ...prev,
      selectedCarId: carId,
    }));
  };

  const handleBuy = (car: CarStats) => {
    if (saveData.cash < car.price) {
      setFeedback('Dinheiro insuficiente!');
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    AudioManager.getInstance().playCashEarned();
    onUpdateSave((prev) => {
      const updatedCars = { ...prev.cars };
      updatedCars[car.id] = { ...car, unlocked: true };
      return {
        ...prev,
        cash: prev.cash - car.price,
        selectedCarId: car.id,
        cars: updatedCars,
      };
    });

    setFeedback(`Parabéns! ${car.name} desbloqueado e equipado!`);
    setTimeout(() => setFeedback(null), 2500);
  };

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

        <div className="flex items-center gap-2 bg-zinc-900 border border-emerald-500/40 rounded-xl px-4 py-2 shadow-lg">
          <Coins className="w-5 h-5 text-emerald-400" />
          <span className="font-orbitron text-base font-black text-emerald-400">
            ${saveData.cash.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Title & Feedback */}
      <div className="my-6">
        <h2 className="font-orbitron text-3xl md:text-4xl font-black uppercase tracking-tight">
          CONCESSIONÁRIA <span className="text-cyan-400">DE DRIFT</span>
        </h2>
        <p className="text-zinc-400 font-rajdhani text-sm mt-1">
          Desbloqueie veículos de alta performance projetados especificamente para derrapagens insanas.
        </p>

        {feedback && (
          <div className="mt-3 inline-block px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 font-rajdhani font-bold text-sm">
            {feedback}
          </div>
        )}
      </div>

      {/* Cars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
        {cars.map((car) => {
          const isSelected = saveData.selectedCarId === car.id;
          const isUnlocked = car.unlocked;
          const canAfford = saveData.cash >= car.price;

          return (
            <div
              key={car.id}
              className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-zinc-900/90 border-cyan-400 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: car.color }}
                  />
                  {isSelected ? (
                    <span className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-cyan-400 uppercase">
                      <CheckCircle className="w-4 h-4" /> EQUIPADO
                    </span>
                  ) : !isUnlocked ? (
                    <span className="flex items-center gap-1.5 text-xs font-orbitron font-bold text-amber-400 uppercase">
                      <Lock className="w-4 h-4" /> BLOQUEADO
                    </span>
                  ) : (
                    <span className="text-xs font-rajdhani font-semibold text-zinc-500 uppercase">
                      DISPONÍVEL
                    </span>
                  )}
                </div>

                <h3 className="font-orbitron text-2xl font-black text-white">{car.name}</h3>
                <p className="text-xs text-zinc-400 font-rajdhani mt-1 mb-4">{car.subtitle}</p>

                {/* Stats Breakdown */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div>
                    <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
                      <span>VELOCIDADE</span>
                      <span className="text-white font-bold">{Math.round(car.maxSpeed * 10)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${car.maxSpeed * 10}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
                      <span>DRIFT FACTOR</span>
                      <span className="text-white font-bold">{Math.round(car.driftFactor * 10)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400" style={{ width: `${car.driftFactor * 10}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
                      <span>CONTROLE</span>
                      <span className="text-white font-bold">{Math.round(car.handling * 10)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${car.handling * 10}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-zinc-800">
                {isSelected ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-zinc-800 text-cyan-400 font-orbitron font-bold text-xs uppercase cursor-default"
                  >
                    EM USO
                  </button>
                ) : isUnlocked ? (
                  <button
                    onClick={() => handleSelect(car.id)}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-black text-xs uppercase transition shadow-md active:scale-95"
                  >
                    EQUIPAR CARRO
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(car)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-orbitron font-black text-xs uppercase transition flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-950/40 active:scale-95'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    COMPRAR POR ${car.price.toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-zinc-600 font-rajdhani text-center mt-6">
        Dica: O Kuro Drift Spec oferece a maior capacidade de ângulo lateral para pontuações massivas.
      </div>
    </div>
  );
};
