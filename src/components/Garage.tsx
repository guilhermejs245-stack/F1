import React, { useEffect, useRef, useState } from 'react';
import { CarStats, PlayerSaveData } from '../game/types';
import { GarageViewer } from '../game/garageViewer';
import { SaveManager } from '../game/save';
import { AudioManager } from '../game/audio';
import { ArrowLeft, Coins, Check, ShieldAlert } from 'lucide-react';

interface GarageProps {
  saveData: PlayerSaveData;
  onBack: () => void;
  onUpdateSave: (updater: (prev: PlayerSaveData) => PlayerSaveData) => void;
}

const COLOR_PALETTE = [
  { name: 'Cyan Neon', hex: '#06b6d4' },
  { name: 'Vermelho Fúria', hex: '#ef4444' },
  { name: 'Roxo Kuro', hex: '#a855f7' },
  { name: 'Laranja Flame', hex: '#f97316' },
  { name: 'Verde Tóxico', hex: '#22c55e' },
  { name: 'Amarelo Gold', hex: '#eab308' },
  { name: 'Preto Shadow', hex: '#18181b' },
  { name: 'Branco Pérola', hex: '#f8fafc' },
];

const UPGRADE_COSTS = [400, 850, 1500, 2400, 3600];

export const Garage: React.FC<GarageProps> = ({ saveData, onBack, onUpdateSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GarageViewer | null>(null);

  const carId = saveData.selectedCarId;
  const car = saveData.cars[carId] || Object.values(saveData.cars)[0];

  const [activeTab, setActiveTab] = useState<'upgrades' | 'colors'>('upgrades');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Initialize 3D turntable viewer
  useEffect(() => {
    if (!containerRef.current) return;
    viewerRef.current = new GarageViewer(containerRef.current, car);

    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [carId]);

  const handleColorChange = (hex: string) => {
    AudioManager.getInstance().playUiClick();
    viewerRef.current?.updateColor(hex);

    onUpdateSave((prev) => {
      const updatedCars = { ...prev.cars };
      if (updatedCars[carId]) {
        updatedCars[carId] = { ...updatedCars[carId], color: hex };
      }
      return { ...prev, cars: updatedCars };
    });
  };

  const handleUpgrade = (type: keyof CarStats['upgrades']) => {
    const currentLvl = car.upgrades[type];
    if (currentLvl >= 5) return;

    const cost = UPGRADE_COSTS[currentLvl];
    if (saveData.cash < cost) {
      setFeedbackMsg('Dinheiro insuficiente!');
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    AudioManager.getInstance().playCashEarned();
    onUpdateSave((prev) => {
      const updatedCars = { ...prev.cars };
      const currentCar = updatedCars[carId];
      if (!currentCar) return prev;

      const newUpgrades = { ...currentCar.upgrades, [type]: currentLvl + 1 };
      updatedCars[carId] = { ...currentCar, upgrades: newUpgrades };

      return {
        ...prev,
        cash: prev.cash - cost,
        cars: updatedCars,
      };
    });

    setFeedbackMsg(`Upgrade realizado com sucesso! (-$${cost})`);
    setTimeout(() => setFeedbackMsg(null), 2000);
  };

  const upgradesList: { key: keyof CarStats['upgrades']; label: string; desc: string }[] = [
    { key: 'engine', label: 'Motor & Turbo', desc: 'Aumenta velocidade máxima e aceleração' },
    { key: 'tires', label: 'Pneus Esportivos', desc: 'Melhora controle de derrapagem e transições' },
    { key: 'suspension', label: 'Suspensão de Drift', desc: 'Reduz perda de estabilidade e peso lateral' },
    { key: 'steering', label: 'Ângulo de Direção', desc: 'Maior capacidade de esterço e contraesterço' },
    { key: 'brakes', label: 'Freios Ventilados', desc: 'Potência de frenagem e resposta de handbrake' },
  ];

  // Calculated upgraded stats (out of 100%)
  const speedStat = Math.min(100, Math.round((car.maxSpeed * 10) * (1 + car.upgrades.engine * 0.07)));
  const accelStat = Math.min(100, Math.round((car.acceleration * 10) * (1 + car.upgrades.engine * 0.06)));
  const handlingStat = Math.min(100, Math.round((car.handling * 10) * (1 + car.upgrades.steering * 0.06)));
  const driftStat = Math.min(100, Math.round((car.driftFactor * 10) * (1 + car.upgrades.suspension * 0.05)));
  const brakeStat = Math.min(100, Math.round((car.braking * 10) * (1 + car.upgrades.brakes * 0.07)));

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden bg-zinc-950 text-white">
      {/* Left/Main Area: 3D Turntable Car View */}
      <div className="relative flex-1 h-[45vh] md:h-full w-full">
        {/* 3D Canvas Container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Top Floating Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onBack();
            }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700 rounded-xl text-white font-rajdhani font-bold transition shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-cyan-400" />
            MENU
          </button>

          <div className="flex items-center gap-2 bg-zinc-900/85 backdrop-blur-md border border-emerald-500/40 rounded-xl px-4 py-2 shadow-lg">
            <Coins className="w-5 h-5 text-emerald-400" />
            <span className="font-orbitron text-base font-black text-emerald-400">
              ${saveData.cash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Floating Car Badge */}
        <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/75 backdrop-blur-md border border-zinc-800 p-4 rounded-2xl shadow-xl max-w-xs">
          <span className="text-[10px] text-zinc-400 uppercase font-rajdhani font-bold">Veículo Atual</span>
          <h2 className="font-orbitron text-2xl font-black text-white">{car.name}</h2>
          <p className="text-xs text-zinc-400 font-rajdhani mt-0.5">{car.subtitle}</p>
        </div>
      </div>

      {/* Right Area: Upgrades & Color Customization Panel */}
      <div className="w-full md:w-[420px] bg-zinc-900/90 border-t md:border-t-0 md:border-l border-zinc-800 backdrop-blur-lg flex flex-col justify-between p-5 overflow-y-auto">
        <div>
          {/* Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-4">
            <button
              onClick={() => {
                AudioManager.getInstance().playUiClick();
                setActiveTab('upgrades');
              }}
              className={`flex-1 py-2 rounded-lg font-orbitron text-xs font-bold transition ${
                activeTab === 'upgrades'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              UPGRADES MECÂNICOS
            </button>
            <button
              onClick={() => {
                AudioManager.getInstance().playUiClick();
                setActiveTab('colors');
              }}
              className={`flex-1 py-2 rounded-lg font-orbitron text-xs font-bold transition ${
                activeTab === 'colors'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              PINTURA
            </button>
          </div>

          {/* Feedback message banner */}
          {feedbackMsg && (
            <div className="mb-3 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-rajdhani font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" />
              {feedbackMsg}
            </div>
          )}

          {/* Upgrades Tab */}
          {activeTab === 'upgrades' && (
            <div className="space-y-3">
              {upgradesList.map((item) => {
                const currentLevel = car.upgrades[item.key];
                const isMax = currentLevel >= 5;
                const cost = !isMax ? UPGRADE_COSTS[currentLevel] : 0;
                const canAfford = saveData.cash >= cost;

                return (
                  <div
                    key={item.key}
                    className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-orbitron text-sm font-bold text-white">{item.label}</div>
                        <div className="text-[11px] text-zinc-400 font-rajdhani">{item.desc}</div>
                      </div>

                      {/* Level Badges */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`w-2.5 h-5 rounded-sm ${
                              lvl <= currentLevel
                                ? 'bg-cyan-400 shadow-sm shadow-cyan-400'
                                : 'bg-zinc-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                      <span className="text-xs font-rajdhani text-zinc-400">
                        {isMax ? 'Nível Máximo' : `Nível ${currentLevel} ➔ ${currentLevel + 1}`}
                      </span>

                      {!isMax ? (
                        <button
                          onClick={() => handleUpgrade(item.key)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-black transition flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          ${cost.toLocaleString()}
                        </button>
                      ) : (
                        <span className="text-xs font-orbitron font-bold text-cyan-400">MAX</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="flex flex-col gap-4">
              <span className="text-xs font-rajdhani text-zinc-400">
                Selecione uma tonalidade para personalizar a carroceria:
              </span>
              <div className="grid grid-cols-4 gap-3">
                {COLOR_PALETTE.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => handleColorChange(col.hex)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition group ${
                      car.color === col.hex
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : 'border-zinc-800 bg-zinc-950 hover:border-zinc-600'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full shadow-lg border border-white/20 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[10px] font-rajdhani font-semibold text-zinc-300 text-center">
                      {col.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Performance Stats Summary */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 mt-4 space-y-2">
          <div className="text-[11px] font-orbitron font-bold text-zinc-400 uppercase mb-2">
            Desempenho Atual
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
              <span>VELOCIDADE</span>
              <span className="text-white font-bold">{speedStat}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${speedStat}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
              <span>ACELERAÇÃO</span>
              <span className="text-white font-bold">{accelStat}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400" style={{ width: `${accelStat}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
              <span>CONTROLE</span>
              <span className="text-white font-bold">{handlingStat}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: `${handlingStat}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
              <span>DRIFT SLIP</span>
              <span className="text-white font-bold">{driftStat}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400" style={{ width: `${driftStat}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-orbitron text-zinc-400 mb-1">
              <span>FREIOS</span>
              <span className="text-white font-bold">{brakeStat}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${brakeStat}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
