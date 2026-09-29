import React, { useState } from 'react';
import { PlayerSaveData } from '../game/types';
import { AudioManager } from '../game/audio';
import { X, Volume2, Monitor, Gauge, Maximize, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  settings: PlayerSaveData['settings'];
  onClose: () => void;
  onSaveSettings: (newSettings: PlayerSaveData['settings']) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onSaveSettings,
  onResetProgress,
}) => {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleChange = <K extends keyof PlayerSaveData['settings']>(
    key: K,
    val: PlayerSaveData['settings'][K]
  ) => {
    const updated = { ...localSettings, [key]: val };
    setLocalSettings(updated);
    onSaveSettings(updated);

    if (key.includes('Volume')) {
      AudioManager.getInstance().updateVolumes(
        key === 'masterVolume' ? (val as number) : updated.masterVolume,
        key === 'engineVolume' ? (val as number) : updated.engineVolume,
        key === 'sfxVolume' ? (val as number) : updated.sfxVolume
      );
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="font-orbitron text-xl font-black uppercase tracking-wider">Configurações</h2>
          </div>
          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onClose();
            }}
            className="p-2 hover:bg-zinc-800 rounded-xl transition text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-orbitron text-xs font-bold text-cyan-400 uppercase">
            <Volume2 className="w-4 h-4" /> Áudio & Efeitos Sonoros
          </div>

          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <div className="flex justify-between text-xs font-rajdhani text-zinc-300 mb-1">
                <span>Volume Geral</span>
                <span className="font-mono">{Math.round(localSettings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.masterVolume}
                onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-rajdhani text-zinc-300 mb-1">
                <span>Ronco do Motor</span>
                <span className="font-mono">{Math.round(localSettings.engineVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.engineVolume}
                onChange={(e) => handleChange('engineVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-rajdhani text-zinc-300 mb-1">
                <span>Efeitos (Pneus e Colisões)</span>
                <span className="font-mono">{Math.round(localSettings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.sfxVolume}
                onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Graphics & Performance Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-orbitron text-xs font-bold text-cyan-400 uppercase">
            <Monitor className="w-4 h-4" /> Gráficos & Desempenho
          </div>

          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <div>
              <div className="text-xs font-rajdhani text-zinc-300 mb-2">Qualidade Gráfica:</div>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleChange('quality', q)}
                    className={`py-2 rounded-xl font-orbitron text-xs uppercase font-bold transition border ${
                      localSettings.quality === q
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {q === 'low' ? 'Baixa' : q === 'medium' ? 'Média' : 'Alta (Sombras)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-xs font-rajdhani text-zinc-300">Exibir Contador FPS</span>
              <input
                type="checkbox"
                checked={localSettings.showFps}
                onChange={(e) => handleChange('showFps', e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-xs font-rajdhani text-zinc-300">Modo Tela Cheia</span>
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-rajdhani font-bold flex items-center gap-1.5"
              >
                <Maximize className="w-3.5 h-3.5" /> Alternar
              </button>
            </div>
          </div>
        </div>

        {/* Gameplay & Controls Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-orbitron text-xs font-bold text-cyan-400 uppercase">
            <Gauge className="w-4 h-4" /> Jogabilidade & Controles
          </div>

          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-rajdhani text-zinc-300 mb-1">
                <span>Sensibilidade da Direção</span>
                <span className="font-mono">{localSettings.steeringSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={localSettings.steeringSensitivity}
                onChange={(e) => handleChange('steeringSensitivity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="text-[11px] font-rajdhani text-zinc-400 pt-2 border-t border-zinc-800 leading-relaxed">
              <div className="font-bold text-zinc-200 mb-1">Guia de Teclas Rápidas:</div>
              <div>• <b>W ou ↑</b>: Acelerar</div>
              <div>• <b>S ou ↓</b>: Frear / Marcha Ré</div>
              <div>• <b>A/D ou ←/→</b>: Virar Direção</div>
              <div>• <b>ESPAÇO</b>: Freio de Mão (inicia drifts fechados)</div>
              <div>• <b>R</b>: Reposicionar / Resetar carro na pista</div>
              <div>• <b>ESC</b>: Menu de Pausa</div>
            </div>
          </div>
        </div>

        {/* Reset Progress Section */}
        <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-xs text-red-400 hover:text-red-300 font-rajdhani font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Redefinir Progresso Salvo
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className="text-xs text-red-300 font-rajdhani">Confirmar reset completo?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-2.5 py-1 rounded bg-zinc-800 text-xs font-rajdhani font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onResetProgress();
                    setShowConfirmReset(false);
                  }}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-xs font-orbitron font-bold text-white"
                >
                  SIM, RESETAR
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              AudioManager.getInstance().playUiClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-black text-xs uppercase shadow-md transition active:scale-95"
          >
            CONCLUÍDO
          </button>
        </div>
      </div>
    </div>
  );
};
