/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SaveManager } from './game/save';
import { GameManager } from './game/GameManager';
import { DriftEventState, PlayerSaveData } from './game/types';
import { AudioManager } from './game/audio';
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { CarSelect } from './components/CarSelect';
import { TrackSelect } from './components/TrackSelect';
import { SettingsModal } from './components/SettingsModal';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { ResultsModal } from './components/ResultsModal';

export default function App() {
  const saveManager = SaveManager.getInstance();
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => saveManager.getData());

  // Navigation state
  const [screen, setScreen] = useState<'menu' | 'game' | 'garage' | 'cars' | 'tracks'>('menu');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [resultsData, setResultsData] = useState<{
    score: number;
    cashEarned: number;
    isNewRecord: boolean;
  } | null>(null);

  // HUD & Game Live State
  const [driftState, setDriftState] = useState<DriftEventState>({
    isDrifting: false,
    angle: 0,
    speedKmh: 0,
    score: 0,
    combo: 1,
    comboTimer: 0,
    multiplier: 1,
    calloutText: '',
    calloutType: null,
    proximityBonus: false,
    slipRatio: 0,
  });
  const [fps, setFps] = useState(60);

  // Canvas Refs
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);

  // Keep save data synchronized with SaveManager
  const updateSaveData = (updater: (prev: PlayerSaveData) => PlayerSaveData) => {
    saveManager.updateData((prev) => {
      const next = updater(prev);
      setSaveData(next);
      return next;
    });
  };

  // Launch game when screen is 'game'
  useEffect(() => {
    if (screen !== 'game') {
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
        gameManagerRef.current = null;
      }
      return;
    }

    if (!gameContainerRef.current) return;

    const currentCar = saveData.cars[saveData.selectedCarId] || Object.values(saveData.cars)[0];

    const gm = new GameManager(
      gameContainerRef.current,
      minimapRef.current,
      currentCar,
      saveData.settings,
      {
        onDriftUpdate: (drift) => setDriftState(drift),
        onFpsUpdate: (currentFps) => setFps(currentFps),
        onPauseRequested: () => setIsPaused(true),
      }
    );

    gameManagerRef.current = gm;
    gm.start();

    return () => {
      gm.destroy();
      gameManagerRef.current = null;
    };
  }, [screen, saveData.selectedCarId]);

  // Pause / Resume game
  useEffect(() => {
    if (!gameManagerRef.current) return;
    if (isPaused) {
      gameManagerRef.current.pause();
    } else {
      gameManagerRef.current.resume();
    }
  }, [isPaused]);

  const handleStartGame = (trackId?: string) => {
    AudioManager.getInstance().playUiClick();
    if (trackId) {
      updateSaveData((prev) => ({ ...prev, selectedTrackId: trackId }));
    }
    setResultsData(null);
    setIsPaused(false);
    setScreen('game');
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleResetCar = () => {
    gameManagerRef.current?.resetCarToNearestCheckpoint();
  };

  const handleCycleCamera = () => {
    gameManagerRef.current?.cycleCamera();
  };

  const handleExitToMenu = () => {
    if (gameManagerRef.current) {
      const finalScore = gameManagerRef.current.getScore();
      if (finalScore > 0) {
        const { isNewRecord, cashEarned } = saveManager.recordScore(
          finalScore,
          saveData.selectedTrackId || 'industrial'
        );
        setSaveData(saveManager.getData());
        setResultsData({ score: finalScore, cashEarned, isNewRecord });
        setIsPaused(false);
        return;
      }
    }
    setIsPaused(false);
    setScreen('menu');
  };

  const handleTouchInput = (steer: number, throttle: number, brake: number, handbrake: boolean) => {
    gameManagerRef.current?.setTouchInputs(steer, throttle, brake, handbrake);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-rajdhani">
      {/* 3D WebGL Game Container (only present when screen === 'game') */}
      {screen === 'game' && (
        <div className="relative w-full h-full">
          <div ref={gameContainerRef} className="w-full h-full absolute inset-0" />

          {/* In-Game HUD Overlay */}
          <HUD
            driftState={driftState}
            fps={fps}
            showFps={saveData.settings.showFps}
            showTouchControls={saveData.settings.touchControls}
            trackName="Autódromo Internacional"
            onPause={handlePause}
            onResetCar={handleResetCar}
            onCycleCamera={handleCycleCamera}
            onTouchInput={handleTouchInput}
            minimapRef={minimapRef}
          />

          {/* Pause Menu Modal */}
          {isPaused && (
            <PauseMenu
              onResume={handleResume}
              onRestart={handleResetCar}
              onExitToMenu={handleExitToMenu}
            />
          )}

          {/* Results Summary Modal */}
          {resultsData && (
            <ResultsModal
              score={resultsData.score}
              cashEarned={resultsData.cashEarned}
              isNewRecord={resultsData.isNewRecord}
              totalCash={saveData.cash}
              onPlayAgain={() => {
                setResultsData(null);
                handleStartGame();
              }}
              onGoToGarage={() => {
                setResultsData(null);
                setScreen('garage');
              }}
              onGoToMenu={() => {
                setResultsData(null);
                setScreen('menu');
              }}
            />
          )}
        </div>
      )}

      {/* Main Menu Screen */}
      {screen === 'menu' && (
        <MainMenu
          saveData={saveData}
          onPlay={() => handleStartGame()}
          onOpenGarage={() => {
            AudioManager.getInstance().playUiClick();
            setScreen('garage');
          }}
          onOpenCars={() => {
            AudioManager.getInstance().playUiClick();
            setScreen('cars');
          }}
          onOpenTracks={() => {
            AudioManager.getInstance().playUiClick();
            setScreen('tracks');
          }}
          onOpenSettings={() => {
            AudioManager.getInstance().playUiClick();
            setShowSettings(true);
          }}
        />
      )}

      {/* Garage Screen */}
      {screen === 'garage' && (
        <Garage
          saveData={saveData}
          onBack={() => setScreen('menu')}
          onUpdateSave={updateSaveData}
        />
      )}

      {/* Car Selection Screen */}
      {screen === 'cars' && (
        <CarSelect
          saveData={saveData}
          onBack={() => setScreen('menu')}
          onUpdateSave={updateSaveData}
        />
      )}

      {/* Track Selection Screen */}
      {screen === 'tracks' && (
        <TrackSelect
          saveData={saveData}
          onBack={() => setScreen('menu')}
          onStartTrack={(trackId) => handleStartGame(trackId)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={saveData.settings}
          onClose={() => setShowSettings(false)}
          onSaveSettings={(newSettings) =>
            updateSaveData((prev) => ({ ...prev, settings: newSettings }))
          }
          onResetProgress={() => {
            saveManager.resetGame();
            setSaveData(saveManager.getData());
          }}
        />
      )}
    </div>
  );
}
